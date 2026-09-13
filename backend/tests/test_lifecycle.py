"""
Complete End-to-End AssetOps Lifecycle Test
Flow:
1. Seed initial balances: Alice = 500, Bob = 300, Charlie = 200 (Total = 1,000)
2. Mid-cycle transfer: Bob transfers 200 to Charlie -> Alice = 500, Bob = 100, Charlie = 400
3. Create CA-001 Version 1 = 5% coupon
4. Amend CA-001 to Version 2 = 4% coupon (V1 becomes SUPERSEDED, V2 ACTIVE)
5. Execute Version 2 payout -> Alice = 20, Bob = 4, Charlie = 16 (or original test values based on balances)
6. Duplicate execution attempt -> REVERTS with 409 Conflict
7. Execute Redemption -> pays principal, burns exact balances, final supply becomes 0
8. Verify append-only cryptographic audit logs
"""
import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import sqlite3

from app.main import app
from app.database.connection import init_db, get_db

TEST_DB = Path(__file__).resolve().parent / "test_assetops.db"

def get_test_db():
    conn = sqlite3.connect(str(TEST_DB), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

app.dependency_overrides[get_db] = get_test_db

@pytest.fixture(autouse=True)
def setup_test_db():
    if TEST_DB.exists():
        TEST_DB.unlink()
    init_db(TEST_DB)

    # Seed Initial demo asset and holders
    conn = sqlite3.connect(str(TEST_DB))
    with conn:
        conn.execute("""
            INSERT INTO assets (address, name, symbol, decimals, total_supply)
            VALUES ('0xasset1', 'Demo Bond Token', 'DBT', 18, '1000')
        """)
        # Alice 500, Bob 300, Charlie 200
        conn.execute("INSERT INTO holders (id, address, asset_address, balance) VALUES ('h1', 'alice', '0xasset1', '500')")
        conn.execute("INSERT INTO holders (id, address, asset_address, balance) VALUES ('h2', 'bob', '0xasset1', '300')")
        conn.execute("INSERT INTO holders (id, address, asset_address, balance) VALUES ('h3', 'charlie', '0xasset1', '200')")
    conn.close()
    yield
    if TEST_DB.exists():
        TEST_DB.unlink()

def test_full_assetops_lifecycle():
    client = TestClient(app)

    # 1. Verify health and initial balances
    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    holders_res = client.get("/api/v1/holders?asset_address=0xasset1")
    assert holders_res.status_code == 200
    holders_map = {h["address"]: h["balance"] for h in holders_res.json()["holders"]}
    assert holders_map["alice"] == 500
    assert holders_map["bob"] == 300
    assert holders_map["charlie"] == 200

    # 2. Mid-cycle transfer: Bob transfers 200 to Charlie
    tx_res = client.post("/api/v1/transfers", json={
        "asset_address": "0xasset1",
        "from_address": "bob",
        "to_address": "charlie",
        "amount": 200
    })
    assert tx_res.status_code == 200
    assert tx_res.json()["sender_new_balance"] == 100
    assert tx_res.json()["receiver_new_balance"] == 400

    # 3. Create CA-001 Version 1 = 5% (500 bps)
    action_res = client.post("/api/v1/actions", json={
        "action_reference": "CA-001",
        "asset_address": "0xasset1",
        "action_type": "COUPON",
        "rate_bps": 500,
        "payable_date": "2026-09-20T00:00:00Z",
        "document_hash": "ipfs://QmAnnouncementV1"
    })
    assert action_res.status_code == 200
    action_id = action_res.json()["action_id"]
    v1_id = action_res.json()["version_id"]

    # 4. Amend CA-001 to Version 2 = 4% (400 bps)
    amend_res = client.post(f"/api/v1/actions/{action_id}/versions", json={
        "new_rate_bps": 400,
        "document_hash": "ipfs://QmAnnouncementV2"
    })
    assert amend_res.status_code == 200
    v2_id = amend_res.json()["new_version_id"]
    assert amend_res.json()["new_version_number"] == 2

    # Check version DAG: v1 is SUPERSEDED, v2 is ACTIVE
    versions_res = client.get(f"/api/v1/actions/{action_id}/versions")
    assert versions_res.status_code == 200
    versions = versions_res.json()["versions"]
    assert len(versions) == 2
    v1_record = next(v for v in versions if v["version_id"] == v1_id)
    v2_record = next(v for v in versions if v["version_id"] == v2_id)
    assert v1_record["status"] == "SUPERSEDED"
    assert v2_record["status"] == "ACTIVE"

    # Preview payments: Alice 500*4%=20, Bob 100*4%=4, Charlie 400*4%=16 (Total = 40)
    prev = client.get(f"/api/v1/actions/{action_id}/preview")
    assert prev.status_code == 200
    assert prev.json()["total_payment"] == 40

    # 5. Execute Version 2 payment
    pay_res = client.post("/api/v1/payments/execute", json={"action_id": action_id})
    assert pay_res.status_code == 200
    assert pay_res.json()["total_paid"] == 40
    payouts = {p["holder_address"]: p["amount"] for p in pay_res.json()["payments"]}
    assert payouts["alice"] == 20
    assert payouts["bob"] == 4
    assert payouts["charlie"] == 16

    # 6. Duplicate execution attempt MUST REVERT
    dup_res = client.post("/api/v1/payments/execute", json={"action_id": action_id})
    assert dup_res.status_code == 409
    assert "already executed" in dup_res.json()["detail"].lower()

    # 7. Create and execute Redemption
    red_action = client.post("/api/v1/actions", json={
        "action_reference": "REDEMPTION-001",
        "asset_address": "0xasset1",
        "action_type": "REDEMPTION",
        "amount_per_token": 1
    }).json()

    red_exec = client.post("/api/v1/redemptions/execute", json={"action_id": red_action["action_id"]})
    assert red_exec.status_code == 200
    assert red_exec.json()["total_principal_paid"] == 1000
    assert red_exec.json()["total_tokens_burned"] == 1000
    assert red_exec.json()["final_asset_total_supply"] == 0

    # All balances must now be 0
    final_holders = client.get("/api/v1/holders?asset_address=0xasset1").json()["holders"]
    for h in final_holders:
        assert h["balance"] == 0

    # 8. Verify audit history contains all chronological cryptographic logs
    audit_res = client.get("/api/v1/audit")
    assert audit_res.status_code == 200
    logs = audit_res.json()["audit_logs"]
    event_types = [l["event_type"] for l in logs]
    assert "TRANSFER" in event_types
    assert "ACTION_CREATED" in event_types
    assert "ACTION_AMENDED" in event_types
    assert "ACTION_EXECUTED" in event_types
    assert "REDEMPTION_EXECUTED" in event_types
