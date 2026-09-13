import { DatabaseSync } from 'node:sqlite';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: any = null;

export function getDatabase(): any {
  if (!dbInstance) {
    const dbDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    dbInstance = new DatabaseSync(config.databasePath);
    try {
      dbInstance.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // Ignore pragma error if memory db
    }
    runMigrations(dbInstance);
    seedInitialData(dbInstance);
  }
  return dbInstance;
}

function runMigrations(db: any) {
  const migrationsDir = path.resolve(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql);
    }
  }
}

function seedInitialData(db: any) {
  try {
    const row = db.prepare('SELECT count(*) as count FROM assets').get() as { count: number | bigint };
    if (row && Number(row.count) > 0) return;

    // 1. Sync State
    db.prepare(`
      INSERT OR REPLACE INTO sync_state (key, last_block, updated_at)
      VALUES ('corporate_actions', 194825, CURRENT_TIMESTAMP)
    `).run();

    // 2. Asset (Digital Bond Token)
    const assetAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    db.prepare(`
      INSERT INTO assets (address, name, symbol, total_supply)
      VALUES (?, 'Digital Bond Token', 'DBT', '1000')
    `).run(assetAddress);

    // 3. Holders
    db.prepare(`
      INSERT INTO holders (address, asset_address, balance, is_whitelisted)
      VALUES (?, ?, '500', 1)
    `).run('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', assetAddress); // Alice

    db.prepare(`
      INSERT INTO holders (address, asset_address, balance, is_whitelisted)
      VALUES (?, ?, '300', 1)
    `).run('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', assetAddress); // Bob

    db.prepare(`
      INSERT INTO holders (address, asset_address, balance, is_whitelisted)
      VALUES (?, ?, '200', 1)
    `).run('0x90F79bf6EB2c4f870365E785982E1f101E93b906', assetAddress); // Charlie

    // 4. Corporate Action CA-001
    const actionId = 'CA-001';
    const v1Id = '0x1a8f92b7c0d38119e48271829374019283740192837401928374019283740191';
    const v2Id = '0x2b9c81a4e1d49220f59382930485120394851203948512039485120394851202';

    db.prepare(`
      INSERT INTO corporate_actions (action_id, asset_address, action_type, active_version_id, status)
      VALUES (?, ?, 'COUPON_PAYMENT', ?, 'ACTIVE')
    `).run(actionId, assetAddress, v2Id);

    // Version 1 (SUPERSEDED)
    db.prepare(`
      INSERT INTO action_versions (
        version_id, action_id, version_number, rate_bps, amount_per_token,
        record_date, payable_date, document_hash, status, announced_by
      ) VALUES (?, ?, 1, 500, '0.05', 1789430400, 1789473600, 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco', 'SUPERSEDED', '0x90F79bf6EB2c4f870365E785982E1f101E93b906')
    `).run(v1Id, actionId);

    // Version 2 (ACTIVE)
    db.prepare(`
      INSERT INTO action_versions (
        version_id, action_id, version_number, rate_bps, amount_per_token,
        record_date, payable_date, supersedes_version_id, document_hash, status, announced_by
      ) VALUES (?, ?, 2, 400, '0.04', 1789430400, 1789732800, ?, 'QmZtmD2qtW3wT1xYy72vedxjQkDD73hwo81kNmE9281kNm', 'ACTIVE', '0x90F79bf6EB2c4f870365E785982E1f101E93b906')
    `).run(v2Id, actionId, v1Id);

    // 5. Payment Events
    db.prepare(`
      INSERT INTO payment_events (action_id, version_id, holder_address, amount, asset_balance, transaction_hash, block_number, timestamp)
      VALUES (?, ?, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', '20.0', '500', '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a', 194825, 1789732800)
    `).run(actionId, v2Id);

    db.prepare(`
      INSERT INTO payment_events (action_id, version_id, holder_address, amount, asset_balance, transaction_hash, block_number, timestamp)
      VALUES (?, ?, '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', '12.0', '300', '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a', 194825, 1789732800)
    `).run(actionId, v2Id);

    db.prepare(`
      INSERT INTO payment_events (action_id, version_id, holder_address, amount, asset_balance, transaction_hash, block_number, timestamp)
      VALUES (?, ?, '0x90F79bf6EB2c4f870365E785982E1f101E93b906', '8.0', '200', '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a', 194825, 1789732800)
    `).run(actionId, v2Id);

    // 6. Audit Logs
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (event_type, action_id, version_id, actor, details, transaction_hash, block_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    logStmt.run('TokenMint', null, null, 'Genesis', JSON.stringify({ asset: 'Digital Bond Token', totalSupply: '1000 DBT' }), '0x2d81726354819283740192837401928374019283740192837401928374019281', 194801);
    logStmt.run('WhitelistUpdated', null, null, 'ComplianceOfficer', JSON.stringify({ accounts: ['Alice', 'Bob', 'Charlie'], status: 'APPROVED' }), '0x9c81729384710293847102938471029384710293847102938471029384710293', 194805);
    logStmt.run('ActionCreated', actionId, v1Id, 'Issuer', JSON.stringify({ actionId, version: 1, rateBps: 500, type: 'COUPON' }), '0x4f82719283740192837401928374019283740192837401928374019283740192', 194810);
    logStmt.run('Transfer', null, null, 'Bob', JSON.stringify({ from: 'Bob', to: 'Charlie', amount: '200 DBT' }), '0x7a81928374019283740192837401928374019283740192837401928374019283', 194819);
    logStmt.run('ActionAmended', actionId, v2Id, 'Issuer', JSON.stringify({ actionId, prevVersionId: v1Id, newVersionId: v2Id, newRateBps: 400 }), '0x1e82937401928374019283740192837401928374019283740192837401928371', 194821);
    logStmt.run('ActionPaymentExecuted', actionId, v2Id, 'PaymentExecutor', JSON.stringify({ actionId, version: 2, totalDisbursed: '40.00 USDC', holdersCount: 3 }), '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a', 194825);
  } catch (err) {
    console.error('Seed data error:', err);
  }
}
