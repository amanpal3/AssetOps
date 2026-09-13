import sqlite3
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).resolve().parent.parent.parent / "assetops.db"

def get_db_connection(db_path: Path = DB_PATH):
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def get_db(db_path: Path = DB_PATH):
    conn = get_db_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db(db_path: Path = DB_PATH):
    conn = get_db_connection(db_path)
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS assets (
            address TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            symbol TEXT NOT NULL,
            decimals INTEGER NOT NULL DEFAULT 18,
            total_supply TEXT NOT NULL DEFAULT '0',
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS holders (
            id TEXT PRIMARY KEY,
            address TEXT NOT NULL,
            asset_address TEXT NOT NULL,
            balance TEXT NOT NULL DEFAULT '0',
            is_whitelisted INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(address, asset_address),
            FOREIGN KEY (asset_address) REFERENCES assets(address)
        );

        CREATE TABLE IF NOT EXISTS transfers (
            id TEXT PRIMARY KEY,
            asset_address TEXT NOT NULL,
            from_address TEXT NOT NULL,
            to_address TEXT NOT NULL,
            amount TEXT NOT NULL,
            timestamp TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (asset_address) REFERENCES assets(address)
        );

        CREATE TABLE IF NOT EXISTS corporate_actions (
            action_id TEXT PRIMARY KEY,
            action_reference TEXT NOT NULL,
            asset_address TEXT NOT NULL,
            action_type TEXT NOT NULL,
            active_version_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (asset_address) REFERENCES assets(address)
        );

        CREATE TABLE IF NOT EXISTS action_versions (
            version_id TEXT PRIMARY KEY,
            action_id TEXT NOT NULL,
            version_number INTEGER NOT NULL,
            rate_bps INTEGER,
            amount_per_token TEXT,
            record_date TEXT,
            payable_date TEXT,
            supersedes_version_id TEXT,
            document_hash TEXT,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (action_id) REFERENCES corporate_actions(action_id),
            UNIQUE(action_id, version_number)
        );

        CREATE TABLE IF NOT EXISTS payment_executions (
            id TEXT PRIMARY KEY,
            action_id TEXT NOT NULL,
            version_id TEXT NOT NULL,
            total_paid TEXT NOT NULL,
            executed_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (action_id) REFERENCES corporate_actions(action_id),
            FOREIGN KEY (version_id) REFERENCES action_versions(version_id),
            UNIQUE(version_id)
        );

        CREATE TABLE IF NOT EXISTS payment_events (
            id TEXT PRIMARY KEY,
            action_id TEXT NOT NULL,
            version_id TEXT NOT NULL,
            holder_address TEXT NOT NULL,
            amount TEXT NOT NULL,
            asset_balance TEXT NOT NULL,
            timestamp TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (action_id) REFERENCES corporate_actions(action_id),
            FOREIGN KEY (version_id) REFERENCES action_versions(version_id)
        );

        CREATE TABLE IF NOT EXISTS redemption_events (
            id TEXT PRIMARY KEY,
            action_id TEXT NOT NULL,
            version_id TEXT NOT NULL,
            holder_address TEXT NOT NULL,
            tokens_burned TEXT NOT NULL,
            principal_amount TEXT NOT NULL,
            timestamp TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (action_id) REFERENCES corporate_actions(action_id),
            FOREIGN KEY (version_id) REFERENCES action_versions(version_id)
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            event_id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            action_id TEXT,
            version_id TEXT,
            actor TEXT,
            details TEXT NOT NULL,
            prev_hash TEXT,
            event_hash TEXT NOT NULL,
            timestamp TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS state_checkpoints (
            checkpoint_id TEXT PRIMARY KEY,
            checkpoint_name TEXT NOT NULL,
            state_root_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)
    conn.close()
