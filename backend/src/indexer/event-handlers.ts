import { getDatabase } from '../database/connection.js';
import { AuditRepository } from '../database/repositories/audit.repository.js';
import { AssetRepository } from '../database/repositories/asset.repository.js';

export const EventHandlers = {
  handleTransfer(assetAddress: string, from: string, to: string, amount: string, event?: any) {
    const db = getDatabase();
    const zeroAddr = '0x0000000000000000000000000000000000000000';

    if (from !== zeroAddr) {
      const fromRow = db.prepare('SELECT balance FROM holders WHERE address = ?').get(from) as { balance: string } | undefined;
      const current = fromRow ? Number(fromRow.balance) : 0;
      const newBal = Math.max(0, current - Number(amount));
      AssetRepository.upsertHolder(from, assetAddress, newBal.toString(), true);
    }

    if (to !== zeroAddr) {
      const toRow = db.prepare('SELECT balance FROM holders WHERE address = ?').get(to) as { balance: string } | undefined;
      const current = toRow ? Number(toRow.balance) : 0;
      const newBal = current + Number(amount);
      AssetRepository.upsertHolder(to, assetAddress, newBal.toString(), true);
    }

    AuditRepository.logEvent('Transfer', {
      from,
      to,
      amount: `${amount} DBT`,
      assetAddress
    }, event?.transactionHash, event?.blockNumber);
  },

  handleActionCreated(actionId: string, versionId: string, assetToken: string, actionType: number, version: number, event: any) {
    const db = getDatabase();
    const typeStr = actionType === 0 ? 'COUPON' : actionType === 1 ? 'INTEREST' : 'REDEMPTION';

    db.prepare(`
      INSERT OR REPLACE INTO corporate_actions (action_id, asset_address, action_type, active_version_id, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `).run(actionId, assetToken, typeStr, versionId);

    db.prepare(`
      INSERT OR REPLACE INTO action_versions (version_id, action_id, version_number, status)
      VALUES (?, ?, ?, 'ACTIVE')
    `).run(versionId, actionId, version);

    AuditRepository.logEvent('ACTION_CREATED', { actionId, versionId, assetToken, typeStr, version }, event?.transactionHash, event?.blockNumber);
  },

  handleActionAmended(actionId: string, prevVersionId: string, newVersionId: string, newVersion: number, event: any) {
    const db = getDatabase();

    // Mark previous version SUPERSEDED
    db.prepare(`UPDATE action_versions SET status = 'SUPERSEDED' WHERE version_id = ?`).run(prevVersionId);

    // Insert new active version
    db.prepare(`
      INSERT OR REPLACE INTO action_versions (version_id, action_id, version_number, supersedes_version_id, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `).run(newVersionId, actionId, newVersion, prevVersionId);

    // Update active version on action
    db.prepare(`UPDATE corporate_actions SET active_version_id = ? WHERE action_id = ?`).run(newVersionId, actionId);

    AuditRepository.logEvent('ACTION_AMENDED', { actionId, prevVersionId, newVersionId, newVersion }, event?.transactionHash, event?.blockNumber);
  },

  handleActionExecuted(actionId: string, versionId: string, executor: string, event: any) {
    const db = getDatabase();
    db.prepare(`UPDATE action_versions SET status = 'EXECUTED' WHERE version_id = ?`).run(versionId);
    db.prepare(`UPDATE corporate_actions SET status = 'EXECUTED' WHERE action_id = ?`).run(actionId);

    AuditRepository.logEvent('ACTION_EXECUTED', { actionId, versionId, executor }, event?.transactionHash, event?.blockNumber);
  },

  handleHolderPaid(actionId: string, versionId: string, holder: string, balance: string, paymentAmount: string, event: any) {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO payment_events (action_id, version_id, holder_address, amount, asset_balance, transaction_hash, block_number, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(actionId, versionId, holder, paymentAmount, balance, event?.transactionHash || '', event?.blockNumber || 0, Math.floor(Date.now() / 1000));
  }
};
