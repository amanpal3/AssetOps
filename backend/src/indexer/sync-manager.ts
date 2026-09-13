import { getDatabase } from '../database/connection.js';

export const SyncManager = {
  getLastSyncedBlock(key = 'corporate_actions'): number {
    const db = getDatabase();
    const row = db.prepare('SELECT last_block FROM sync_state WHERE key = ?').get(key) as { last_block: number } | undefined;
    return row ? row.last_block : 0;
  },

  setLastSyncedBlock(lastBlock: number, key = 'corporate_actions') {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO sync_state (key, last_block, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        last_block = excluded.last_block,
        updated_at = CURRENT_TIMESTAMP
    `).run(key, lastBlock);
  }
};
