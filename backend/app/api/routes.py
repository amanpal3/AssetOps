from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import sqlite3
from app.database.connection import get_db
from app.trusted_runtime.runtime import TrustedRuntime, TrustedRuntimeError
from app.schemas.schemas import (
    TransferRequest, CreateActionRequest, CreateVersionRequest,
    ExecutePaymentRequest, ExecuteRedemptionRequest,
    HolderResponse, AssetResponse, CorporateActionResponse,
    PaymentPreviewResponse, PreviewHolder
)

router = APIRouter()

# ----------------- READ APIS -----------------

@router.get("/health")
def get_health(conn: sqlite3.Connection = Depends(get_db)):
    cur = conn.execute("SELECT COUNT(*) as cnt FROM audit_logs")
    audit_count = cur.fetchone()["cnt"]
    return {
        "status": "ok",
        "service": "assetops-trusted-runtime",
        "mode": "local-development-tee-simulation",
        "audit_event_count": audit_count
    }

@router.get("/network")
def get_network():
    return {
        "runtime_environment": "AssetOps Trusted Execution Environment (TEE-ready)",
        "isolation_model": "In-Memory Enclave Boundary",
        "settlement_currency": "USDC (Internal Authorized Ledger)",
        "gas_fees": "Zero (Off-chain Trusted Runtime)"
    }

@router.get("/assets")
def get_assets(conn: sqlite3.Connection = Depends(get_db)):
    cur = conn.execute("SELECT * FROM assets")
    rows = cur.fetchall()
    return {
        "assets": [
            {
                "address": r["address"],
                "name": r["name"],
                "symbol": r["symbol"],
                "decimals": r["decimals"],
                "total_supply": int(r["total_supply"]),
                "status": r["status"],
                "created_at": r["created_at"]
            }
            for r in rows
        ]
    }

@router.get("/holders")
def get_holders(asset_address: Optional[str] = None, conn: sqlite3.Connection = Depends(get_db)):
    query = "SELECT * FROM holders"
    params = []
    if asset_address:
        query += " WHERE asset_address = ?"
        params.append(asset_address.lower())

    cur = conn.execute(query, params)
    rows = cur.fetchall()
    return {
        "holders": [
            {
                "address": r["address"],
                "asset_address": r["asset_address"],
                "balance": int(r["balance"]),
                "is_whitelisted": bool(r["is_whitelisted"]),
                "updated_at": r["updated_at"]
            }
            for r in rows
        ],
        "count": len(rows)
    }

@router.get("/actions")
def get_actions(conn: sqlite3.Connection = Depends(get_db)):
    cur = conn.execute("SELECT * FROM corporate_actions ORDER BY created_at DESC")
    actions = cur.fetchall()
    res = []
    for a in actions:
        ver_cur = conn.execute("SELECT * FROM action_versions WHERE action_id = ? ORDER BY version_number DESC", (a["action_id"],))
        versions = [
            {
                "version_id": v["version_id"],
                "version_number": v["version_number"],
                "rate_bps": v["rate_bps"],
                "display_rate": f"{v['rate_bps']/100}%" if v["rate_bps"] else None,
                "amount_per_token": v["amount_per_token"],
                "supersedes_version_id": v["supersedes_version_id"],
                "status": v["status"],
                "payable_date": v["payable_date"],
                "document_hash": v["document_hash"],
                "created_at": v["created_at"]
            }
            for v in ver_cur.fetchall()
        ]
        res.append({
            "action_id": a["action_id"],
            "action_reference": a["action_reference"],
            "asset_address": a["asset_address"],
            "action_type": a["action_type"],
            "active_version_id": a["active_version_id"],
            "status": a["status"],
            "versions": versions
        })
    return {"actions": res}

@router.get("/actions/{action_id}/versions")
def get_action_versions(action_id: str, conn: sqlite3.Connection = Depends(get_db)):
    cur = conn.execute("SELECT * FROM action_versions WHERE action_id = ? ORDER BY version_number DESC", (action_id,))
    versions = [dict(r) for r in cur.fetchall()]
    return {"action_id": action_id, "versions": versions}

@router.get("/actions/{action_id}/preview")
def preview_action_payment(action_id: str, conn: sqlite3.Connection = Depends(get_db)):
    cur = conn.execute("SELECT * FROM corporate_actions WHERE action_id = ?", (action_id,))
    action = cur.fetchone()
    if not action:
        raise HTTPException(status_code=404, detail="Corporate action not found")

    cur = conn.execute("SELECT * FROM action_versions WHERE version_id = ?", (action["active_version_id"],))
    active_ver = cur.fetchone()

    cur = conn.execute("SELECT address, balance FROM holders WHERE asset_address = ? AND CAST(balance AS INTEGER) > 0", (action["asset_address"],))
    holders = cur.fetchall()

    preview_list = []
    total = 0

    for h in holders:
        bal = int(h["balance"])
        entitled = 0
        if action["action_type"] in ("COUPON", "INTEREST"):
            rate = active_ver["rate_bps"] or 0
            entitled = (bal * rate) // 10000
        elif action["action_type"] == "REDEMPTION":
            amt = int(active_ver["amount_per_token"] or 1)
            entitled = bal * amt

        total += entitled
        preview_list.append({
            "holder_address": h["address"],
            "balance": bal,
            "entitled_amount": entitled
        })

    return {
        "action_id": action_id,
        "version_id": active_ver["version_id"],
        "version_number": active_ver["version_number"],
        "action_type": action["action_type"],
        "rate_bps": active_ver["rate_bps"],
        "total_payment": total,
        "holder_count": len(preview_list),
        "holders": preview_list
    }

@router.get("/payments")
def get_payments(action_id: Optional[str] = None, conn: sqlite3.Connection = Depends(get_db)):
    query = "SELECT * FROM payment_events"
    params = []
    if action_id:
        query += " WHERE action_id = ?"
        params.append(action_id)
    query += " ORDER BY timestamp DESC"

    cur = conn.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    return {"payments": rows, "count": len(rows)}

@router.get("/redemptions")
def get_redemptions(action_id: Optional[str] = None, conn: sqlite3.Connection = Depends(get_db)):
    query = "SELECT * FROM redemption_events"
    params = []
    if action_id:
        query += " WHERE action_id = ?"
        params.append(action_id)
    query += " ORDER BY timestamp DESC"

    cur = conn.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    return {"redemptions": rows, "count": len(rows)}

@router.get("/audit")
def get_audit(limit: int = 50, conn: sqlite3.Connection = Depends(get_db)):
    cur = conn.execute("SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT ?", (min(limit, 100),))
    rows = [dict(r) for r in cur.fetchall()]
    return {"audit_logs": rows, "count": len(rows)}

# ----------------- WRITE (MUTATION) APIS -----------------

@router.post("/transfers")
def transfer_tokens(req: TransferRequest, conn: sqlite3.Connection = Depends(get_db)):
    runtime = TrustedRuntime(conn)
    try:
        res = runtime.transfer_tokens(req.asset_address, req.from_address, req.to_address, req.amount)
        return res
    except TrustedRuntimeError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/actions")
def create_action(req: CreateActionRequest, conn: sqlite3.Connection = Depends(get_db)):
    runtime = TrustedRuntime(conn)
    try:
        res = runtime.create_corporate_action(
            action_reference=req.action_reference,
            asset_address=req.asset_address,
            action_type=req.action_type,
            rate_bps=req.rate_bps,
            amount_per_token=req.amount_per_token,
            payable_date=req.payable_date,
            document_hash=req.document_hash
        )
        return res
    except TrustedRuntimeError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/actions/{action_id}/versions")
def create_action_version(action_id: str, req: CreateVersionRequest, conn: sqlite3.Connection = Depends(get_db)):
    runtime = TrustedRuntime(conn)
    try:
        res = runtime.amend_corporate_action(
            action_id=action_id,
            new_rate_bps=req.new_rate_bps,
            new_amount_per_token=req.new_amount_per_token,
            payable_date=req.payable_date,
            document_hash=req.document_hash
        )
        return res
    except TrustedRuntimeError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/payments/execute")
def execute_payment(req: ExecutePaymentRequest, conn: sqlite3.Connection = Depends(get_db)):
    runtime = TrustedRuntime(conn)
    try:
        res = runtime.execute_payment(req.action_id)
        return res
    except TrustedRuntimeError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/redemptions/execute")
def execute_redemption(req: ExecuteRedemptionRequest, conn: sqlite3.Connection = Depends(get_db)):
    runtime = TrustedRuntime(conn)
    try:
        res = runtime.execute_redemption(req.action_id)
        return res
    except TrustedRuntimeError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
