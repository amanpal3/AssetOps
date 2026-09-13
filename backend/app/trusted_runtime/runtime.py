import uuid
import sqlite3
from typing import Dict, Any, List
from app.audit.audit_service import AuditService

class TrustedRuntimeError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class TrustedRuntime:
    """
    AssetOps Trusted Runtime.
    Enforces all core financial state transitions, idempotency guards, and invariant checks.
    Designed with a clean boundary so it can run locally or inside a hardware TEE (e.g. Intel SGX / AWS Nitro).
    """

    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def transfer_tokens(self, asset_address: str, from_address: str, to_address: str, amount: int) -> Dict[str, Any]:
        """
        Executes an authoritative token transfer between two holders.
        Validates balance sufficiency, updates balances, and logs cryptographic audit event.
        """
        if amount <= 0:
            raise TrustedRuntimeError("Transfer amount must be strictly greater than zero")

        from_addr = from_address.lower()
        to_addr = to_address.lower()
        asset_addr = asset_address.lower()

        # 1. Verify sender balance
        cur = self.conn.execute("SELECT balance FROM holders WHERE address = ? AND asset_address = ?", (from_addr, asset_addr))
        sender_row = cur.fetchone()
        sender_bal = int(sender_row["balance"]) if sender_row else 0

        if sender_bal < amount:
            raise TrustedRuntimeError(f"Insufficient balance: sender has {sender_bal}, requested {amount}")

        new_sender_bal = sender_bal - amount

        # 2. Get receiver balance
        cur = self.conn.execute("SELECT balance FROM holders WHERE address = ? AND asset_address = ?", (to_addr, asset_addr))
        receiver_row = cur.fetchone()
        receiver_bal = int(receiver_row["balance"]) if receiver_row else 0
        new_receiver_bal = receiver_bal + amount

        # 3. Apply state change
        self.conn.execute(
            "UPDATE holders SET balance = ?, updated_at = datetime('now') WHERE address = ? AND asset_address = ?",
            (str(new_sender_bal), from_addr, asset_addr)
        )

        if receiver_row:
            self.conn.execute(
                "UPDATE holders SET balance = ?, updated_at = datetime('now') WHERE address = ? AND asset_address = ?",
                (str(new_receiver_bal), to_addr, asset_addr)
            )
        else:
            self.conn.execute(
                "INSERT INTO holders (id, address, asset_address, balance, is_whitelisted) VALUES (?, ?, ?, ?, 1)",
                (f"h_{uuid.uuid4().hex[:10]}", to_addr, asset_addr, str(new_receiver_bal))
            )

        # 4. Record transfer transaction
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        self.conn.execute(
            "INSERT INTO transfers (id, asset_address, from_address, to_address, amount) VALUES (?, ?, ?, ?, ?)",
            (tx_id, asset_addr, from_addr, to_addr, str(amount))
        )

        # 5. Emit audit log
        AuditService.log_event(
            self.conn,
            "TRANSFER",
            {"asset": asset_addr, "from": from_addr, "to": to_addr, "amount": amount, "tx_id": tx_id},
            actor=from_addr
        )

        return {
            "transfer_id": tx_id,
            "from_address": from_addr,
            "to_address": to_addr,
            "amount": amount,
            "sender_new_balance": new_sender_bal,
            "receiver_new_balance": new_receiver_bal
        }

    def create_corporate_action(
        self,
        action_reference: str,
        asset_address: str,
        action_type: str,
        rate_bps: int = None,
        amount_per_token: int = None,
        payable_date: str = None,
        document_hash: str = "ipfs://QmDefault"
    ) -> Dict[str, Any]:
        """
        Creates an append-only corporate action announcement with Version 1 set to ACTIVE.
        """
        act_type = action_type.upper()
        if act_type not in ("COUPON", "INTEREST", "REDEMPTION"):
            raise TrustedRuntimeError(f"Unsupported action type: {act_type}")

        if act_type in ("COUPON", "INTEREST") and (rate_bps is None or rate_bps <= 0):
            raise TrustedRuntimeError("Rate in basis points (rate_bps) must be positive for COUPON/INTEREST")

        if act_type == "REDEMPTION" and (amount_per_token is None or amount_per_token <= 0):
            raise TrustedRuntimeError("amount_per_token must be positive for REDEMPTION")

        action_id = f"ca_{uuid.uuid4().hex[:12]}"
        version_id = f"ver_{uuid.uuid4().hex[:12]}"
        asset_addr = asset_address.lower()

        # Insert action root
        self.conn.execute("""
            INSERT INTO corporate_actions (action_id, action_reference, asset_address, action_type, active_version_id, status)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE')
        """, (action_id, action_reference, asset_addr, act_type, version_id))

        # Insert Version 1
        self.conn.execute("""
            INSERT INTO action_versions (version_id, action_id, version_number, rate_bps, amount_per_token, payable_date, document_hash, status)
            VALUES (?, ?, 1, ?, ?, ?, ?, 'ACTIVE')
        """, (version_id, action_id, rate_bps, str(amount_per_token) if amount_per_token else None, payable_date, document_hash))

        AuditService.log_event(
            self.conn,
            "ACTION_CREATED",
            {"action_id": action_id, "version_id": version_id, "ref": action_reference, "type": act_type, "rate_bps": rate_bps},
            action_id=action_id,
            version_id=version_id
        )

        return {
            "action_id": action_id,
            "version_id": version_id,
            "version_number": 1,
            "status": "ACTIVE"
        }

    def amend_corporate_action(
        self,
        action_id: str,
        new_rate_bps: int = None,
        new_amount_per_token: int = None,
        payable_date: str = None,
        document_hash: str = "ipfs://QmAmended"
    ) -> Dict[str, Any]:
        """
        Creates a new Version of an action.
        Permanently marks previous version as SUPERSEDED.
        Sets new version as ACTIVE.
        """
        cur = self.conn.execute("SELECT * FROM corporate_actions WHERE action_id = ?", (action_id,))
        action = cur.fetchone()
        if not action:
            raise TrustedRuntimeError("Corporate action not found", 404)

        if action["status"] != "ACTIVE":
            raise TrustedRuntimeError(f"Cannot amend action in status '{action['status']}'")

        old_ver_id = action["active_version_id"]

        # Fetch old version
        cur = self.conn.execute("SELECT version_number, action_type FROM action_versions JOIN corporate_actions USING(action_id) WHERE version_id = ?", (old_ver_id,))
        old_ver = cur.fetchone()
        new_ver_num = old_ver["version_number"] + 1

        new_ver_id = f"ver_{uuid.uuid4().hex[:12]}"

        # 1. Mark old version SUPERSEDED
        self.conn.execute("UPDATE action_versions SET status = 'SUPERSEDED' WHERE version_id = ?", (old_ver_id,))

        # 2. Insert new ACTIVE version
        self.conn.execute("""
            INSERT INTO action_versions (version_id, action_id, version_number, rate_bps, amount_per_token, payable_date, supersedes_version_id, document_hash, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        """, (new_ver_id, action_id, new_ver_num, new_rate_bps, str(new_amount_per_token) if new_amount_per_token else None, payable_date, old_ver_id, document_hash))

        # 3. Update active pointer
        self.conn.execute("UPDATE corporate_actions SET active_version_id = ? WHERE action_id = ?", (new_ver_id, action_id))

        AuditService.log_event(
            self.conn,
            "ACTION_AMENDED",
            {"action_id": action_id, "superseded_version": old_ver_id, "new_version_id": new_ver_id, "new_version_number": new_ver_num, "new_rate_bps": new_rate_bps},
            action_id=action_id,
            version_id=new_ver_id
        )

        return {
            "action_id": action_id,
            "previous_version_id": old_ver_id,
            "new_version_id": new_ver_id,
            "new_version_number": new_ver_num,
            "status": "ACTIVE"
        }

    def execute_payment(self, action_id: str) -> Dict[str, Any]:
        """
        Executes pro-rata coupon/interest payment against current holder balances.
        Guarantees idempotency (reverts if already executed or superseded).
        Formula: payment = balance * rate_bps // 10000
        """
        cur = self.conn.execute("SELECT * FROM corporate_actions WHERE action_id = ?", (action_id,))
        action = cur.fetchone()
        if not action:
            raise TrustedRuntimeError("Corporate action not found", 404)

        if action["status"] == "EXECUTED":
            raise TrustedRuntimeError("Action already executed. Duplicate execution rejected.", 409)

        if action["status"] != "ACTIVE":
            raise TrustedRuntimeError(f"Action cannot be executed in status '{action['status']}'")

        active_ver_id = action["active_version_id"]
        cur = self.conn.execute("SELECT * FROM action_versions WHERE version_id = ?", (active_ver_id,))
        active_ver = cur.fetchone()

        if not active_ver or active_ver["status"] != "ACTIVE":
            raise TrustedRuntimeError("Active action version is not in ACTIVE status")

        # Duplicate protection check
        cur = self.conn.execute("SELECT id FROM payment_executions WHERE version_id = ?", (active_ver_id,))
        if cur.fetchone():
            raise TrustedRuntimeError("Version already executed. Duplicate payment attempt rejected.", 409)

        rate_bps = active_ver["rate_bps"]
        if not rate_bps or rate_bps <= 0:
            raise TrustedRuntimeError("Invalid coupon rate for payment execution")

        # Read live balances
        cur = self.conn.execute("SELECT address, balance FROM holders WHERE asset_address = ? AND CAST(balance AS INTEGER) > 0", (action["asset_address"],))
        holders = cur.fetchall()

        total_paid = 0
        payments_list = []

        for h in holders:
            bal = int(h["balance"])
            payout = (bal * rate_bps) // 10000
            total_paid += payout
            pay_id = f"pay_{uuid.uuid4().hex[:10]}"

            self.conn.execute("""
                INSERT INTO payment_events (id, action_id, version_id, holder_address, amount, asset_balance)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (pay_id, action_id, active_ver_id, h["address"], str(payout), str(bal)))

            payments_list.append({
                "holder_address": h["address"],
                "asset_balance": bal,
                "amount": payout
            })

        # Set execution guard
        exec_id = f"exec_{uuid.uuid4().hex[:10]}"
        self.conn.execute("INSERT INTO payment_executions (id, action_id, version_id, total_paid) VALUES (?, ?, ?, ?)",
                          (exec_id, action_id, active_ver_id, str(total_paid)))

        self.conn.execute("UPDATE action_versions SET status = 'EXECUTED' WHERE version_id = ?", (active_ver_id,))
        self.conn.execute("UPDATE corporate_actions SET status = 'EXECUTED' WHERE action_id = ?", (action_id,))

        AuditService.log_event(
            self.conn,
            "ACTION_EXECUTED",
            {"action_id": action_id, "version_id": active_ver_id, "total_paid": total_paid, "holder_count": len(holders)},
            action_id=action_id,
            version_id=active_ver_id
        )

        return {
            "execution_id": exec_id,
            "action_id": action_id,
            "version_id": active_ver_id,
            "rate_bps": rate_bps,
            "total_paid": total_paid,
            "holder_count": len(holders),
            "payments": payments_list
        }

    def execute_redemption(self, action_id: str) -> Dict[str, Any]:
        """
        Executes maturity principal redemption:
        1. Pays principal (balance * amount_per_token)
        2. Burns the exact token balance of all holders
        3. Reduces asset total supply to zero
        """
        cur = self.conn.execute("SELECT * FROM corporate_actions WHERE action_id = ?", (action_id,))
        action = cur.fetchone()
        if not action:
            raise TrustedRuntimeError("Corporate action not found", 404)

        if action["action_type"] != "REDEMPTION":
            raise TrustedRuntimeError("Action is not a REDEMPTION action")

        if action["status"] == "EXECUTED":
            raise TrustedRuntimeError("Redemption already executed. Replay rejected.", 409)

        active_ver_id = action["active_version_id"]
        cur = self.conn.execute("SELECT * FROM action_versions WHERE version_id = ?", (active_ver_id,))
        active_ver = cur.fetchone()

        amount_per_token = int(active_ver["amount_per_token"] or 1)

        cur = self.conn.execute("SELECT address, balance FROM holders WHERE asset_address = ? AND CAST(balance AS INTEGER) > 0", (action["asset_address"],))
        holders = cur.fetchall()

        total_principal = 0
        total_burned = 0
        redemptions_list = []

        for h in holders:
            bal = int(h["balance"])
            principal = bal * amount_per_token
            total_principal += principal
            total_burned += bal
            red_id = f"red_{uuid.uuid4().hex[:10]}"

            # Record redemption event
            self.conn.execute("""
                INSERT INTO redemption_events (id, action_id, version_id, holder_address, tokens_burned, principal_amount)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (red_id, action_id, active_ver_id, h["address"], str(bal), str(principal)))

            # Burn exact tokens: set balance to 0
            self.conn.execute("UPDATE holders SET balance = '0', updated_at = datetime('now') WHERE address = ? AND asset_address = ?",
                              (h["address"], action["asset_address"]))

            redemptions_list.append({
                "holder_address": h["address"],
                "tokens_burned": bal,
                "principal_amount": principal
            })

        # Set asset total supply to 0
        self.conn.execute("UPDATE assets SET total_supply = '0', status = 'REDEEMED' WHERE address = ?", (action["asset_address"],))

        # Mark action EXECUTED
        exec_id = f"exec_{uuid.uuid4().hex[:10]}"
        self.conn.execute("INSERT INTO payment_executions (id, action_id, version_id, total_paid) VALUES (?, ?, ?, ?)",
                          (exec_id, action_id, active_ver_id, str(total_principal)))

        self.conn.execute("UPDATE action_versions SET status = 'EXECUTED' WHERE version_id = ?", (active_ver_id,))
        self.conn.execute("UPDATE corporate_actions SET status = 'EXECUTED' WHERE action_id = ?", (action_id,))

        AuditService.log_event(
            self.conn,
            "REDEMPTION_EXECUTED",
            {"action_id": action_id, "total_principal": total_principal, "total_burned": total_burned, "final_total_supply": 0},
            action_id=action_id,
            version_id=active_ver_id
        )

        return {
            "execution_id": exec_id,
            "action_id": action_id,
            "total_principal_paid": total_principal,
            "total_tokens_burned": total_burned,
            "final_asset_total_supply": 0,
            "redemptions": redemptions_list
        }
