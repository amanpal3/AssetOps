"""
Canonical Demo Seed Script for AssetOps Trusted Runtime.
Populates the local database with initial balances and runs through the demo lifecycle.
"""
import sqlite3
from pathlib import Path
from app.database.connection import DB_PATH, init_db
from app.trusted_runtime.runtime import TrustedRuntime

def seed():
    print("[INFO] Initializing AssetOps database...")
    init_db()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    runtime = TrustedRuntime(conn)

    # 1. Seed Asset
    conn.execute("""
        INSERT OR REPLACE INTO assets (address, name, symbol, decimals, total_supply)
        VALUES ('0xasset1', 'Demo Bond Token', 'DBT', 18, '1000')
    """)

    # 2. Seed Initial Holders: Alice = 500, Bob = 300, Charlie = 200
    conn.execute("INSERT OR REPLACE INTO holders (id, address, asset_address, balance) VALUES ('h1', 'alice', '0xasset1', '500')")
    conn.execute("INSERT OR REPLACE INTO holders (id, address, asset_address, balance) VALUES ('h2', 'bob', '0xasset1', '300')")
    conn.execute("INSERT OR REPLACE INTO holders (id, address, asset_address, balance) VALUES ('h3', 'charlie', '0xasset1', '200')")
    conn.commit()

    print("[OK] Seeded initial balances: Alice = 500, Bob = 300, Charlie = 200")

    # 3. Create CA-001 Version 1 = 5%
    ca = runtime.create_corporate_action(
        action_reference="CA-001",
        asset_address="0xasset1",
        action_type="COUPON",
        rate_bps=500,
        payable_date="2026-09-20T00:00:00Z",
        document_hash="ipfs://QmAnnouncementV1"
    )
    print(f"[OK] Created Corporate Action CA-001 Version 1 (5% coupon): {ca['action_id']}")

    # 4. Amend CA-001 to Version 2 = 4%
    v2 = runtime.amend_corporate_action(
        action_id=ca["action_id"],
        new_rate_bps=400,
        document_hash="ipfs://QmAnnouncementV2"
    )
    print(f"[OK] Amended CA-001 to Version 2 (4% coupon, V1 SUPERSEDED, V2 ACTIVE): {v2['new_version_id']}")

    conn.commit()
    conn.close()
    print("[SUCCESS] Seed complete! Ready for demo.")

if __name__ == "__main__":
    seed()
