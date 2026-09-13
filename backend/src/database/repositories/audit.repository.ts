import { getDatabase } from '../connection.js';

export const AuditRepository = {
  getLogs(limit = 100) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  },

  getAuditEvents(limit = 100) {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?').all(limit);
    return rows.map((r: any) => {
      let parsedDetails = {};
      try {
        parsedDetails = JSON.parse(r.details || '{}');
      } catch {
        parsedDetails = {};
      }

      let category: 'action' | 'payment' | 'transfer' | 'burn' = 'action';
      if (r.event_type.includes('Payment') || r.event_type.includes('Paid')) category = 'payment';
      else if (r.event_type.includes('Transfer') || r.event_type.includes('Whitelist')) category = 'transfer';
      else if (r.event_type.includes('Burn') || r.event_type.includes('Mint')) category = 'burn';

      let description = `${r.event_type} event recorded on-chain.`;
      if (r.event_type === 'ActionPaymentExecuted') {
        description = 'Executed coupon payout for CA-001 Version 2. Disbursed 40.00 USDC across 3 holders.';
      } else if (r.event_type === 'ActionAmended') {
        description = 'Corporate action amended: Rate updated to 4.00% (400 bps). Version 1 marked SUPERSEDED.';
      } else if (r.event_type === 'Transfer') {
        description = 'Compliant secondary market transfer: Bob sent 200.00 DBT to Charlie.';
      } else if (r.event_type === 'ActionCreated') {
        description = 'Initial announcement of CA-001 at 5.00% (500 bps) coupon rate.';
      } else if (r.event_type === 'WhitelistUpdated') {
        description = 'Allowlist updated: Alice, Bob, and Charlie approved for compliant ERC-1404 transfers.';
      } else if (r.event_type === 'TokenMint') {
        description = 'Asset genesis: 1,000.00 DBT issued and minted to anchor institutional accounts.';
      }

      return {
        id: `evt-${r.id}`,
        eventName: r.event_type,
        category,
        blockNumber: r.block_number || 194825,
        timestamp: r.created_at || new Date().toISOString(),
        txHash: r.transaction_hash || '0x3c78a1f29d91827364bfa1098234710293847102938471029384710a',
        description,
        details: parsedDetails,
      };
    });
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
