# AssetOps — Database & Data Model Specification

**Project:** AssetOps — The Operations Layer for Tokenized Assets  
**Document:** Database & Read-Model Specification  
**Status:** MVP Database Baseline  
**Authority:** On-chain contracts are the single source of truth. The database is a rebuildable projection.

---

## 1. Overview & Invariants

The AssetOps database provides an indexed query layer for the frontend dashboard and auditor reports. It mirrors confirmed blockchain events emitted by `SecurityToken`, `CorporateActionRegistry`, and `PaymentExecutor`.

### Core Database Rules
1. **Rebuildable from Scratch:** Dropping the database and re-indexing all blocks from `deploymentBlock` must produce identical state.
2. **Read-Only Authority:** The database never authorizes transactions; it is purely a query projection.
3. **Idempotency:** Re-processing the same block event must not create duplicate records or skew balances.

---

## 2. Relational Schema (SQLite / PostgreSQL)

### 2.1 `sync_state`
Tracks event indexing progress by block number.
```sql
CREATE TABLE IF NOT EXISTS sync_state (
    key TEXT PRIMARY KEY,
    last_block INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 `assets`
Information on tokenized assets monitored by AssetOps.
```sql
CREATE TABLE IF NOT EXISTS assets (
    address TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    total_supply TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 `holders`
Authoritative live token balances and allowlist status.
```sql
CREATE TABLE IF NOT EXISTS holders (
    address TEXT PRIMARY KEY,
    asset_address TEXT NOT NULL,
    balance TEXT NOT NULL,
    is_whitelisted BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 `corporate_actions`
Corporate action announcement root records.
```sql
CREATE TABLE IF NOT EXISTS corporate_actions (
    action_id TEXT PRIMARY KEY,
    asset_address TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'COUPON', 'INTEREST', 'REDEMPTION'
    active_version_id TEXT NOT NULL,
    status TEXT NOT NULL,      -- 'ACTIVE', 'EXECUTED', 'CANCELLED'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.5 `action_versions`
Append-only version DAG for each corporate action amendment.
```sql
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
    status TEXT NOT NULL,      -- 'ACTIVE', 'SUPERSEDED', 'EXECUTED'
    announced_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(action_id) REFERENCES corporate_actions(action_id)
);
```

### 2.6 `payment_events`
Individual and batch payout execution logs.
```sql
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
```

### 2.7 `audit_logs`
Chronological timeline of all system lifecycle events.
```sql
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
```
