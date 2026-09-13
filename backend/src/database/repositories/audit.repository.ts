import { getDatabase } from '../connection.js';

export const AuditRepository = {
  getLogs(limit = 100) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  },

  logEvent(eventType: string, details: Record<string, any>, txHash?: string, blockNumber?: number) {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO audit_logs (event_type, action_id, version_id, actor, details, transaction_hash, block_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventType,
      details.actionId || null,
      details.versionId || null,
      details.actor || null,
      JSON.stringify(details),
      txHash || null,
      blockNumber || null
    );
  }
};
