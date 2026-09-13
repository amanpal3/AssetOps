-- AssetOps Initial Indexed Relational Read Model
CREATE TABLE IF NOT EXISTS sync_state (
    key TEXT PRIMARY KEY,
    last_block INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    address TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    total_supply TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holders (
    address TEXT PRIMARY KEY,
    asset_address TEXT NOT NULL,
    balance TEXT NOT NULL,
    is_whitelisted BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS corporate_actions (
    action_id TEXT PRIMARY KEY,
    asset_address TEXT NOT NULL,
    action_type TEXT NOT NULL,
    active_version_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS action_versions (
    version_id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    rate_bps INTEGER,
    amount_per_token TEXT,
    record_date INTEGER,
    payable_date INTEGER,
    supersedes_version_id TEXT,
    document_hash TEXT,
    status TEXT NOT NULL,
    announced_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(action_id) REFERENCES corporate_actions(action_id)
);

CREATE TABLE IF NOT EXISTS payment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    holder_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    asset_balance TEXT,
    transaction_hash TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    action_id TEXT,
    version_id TEXT,
    actor TEXT,
    details TEXT,
    transaction_hash TEXT,
    block_number INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
