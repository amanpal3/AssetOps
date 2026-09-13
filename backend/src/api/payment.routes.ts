import { Router } from 'express';
import { getDatabase } from '../database/connection.js';

export const paymentRoutes = Router();

paymentRoutes.get('/payments', (req, res) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM payment_events ORDER BY id DESC').all();

  // Group by action_id & version_id or map directly
  const paymentsMap = new Map<string, any>();
  for (const r of rows) {
    const key = `${r.action_id}-${r.version_id}`;
    if (!paymentsMap.has(key)) {
      paymentsMap.set(key, {
        id: `pay-${r.id}`,
        actionId: r.action_id,
        version: 2,
        type: 'Coupon Payment (400 bps)',
        totalAmount: 0,
        holderCount: 0,
        txHash: r.transaction_hash,
        blockNumber: r.block_number,
        timestamp: new Date(Number(r.timestamp) * 1000).toISOString(),
        status: 'SETTLED',
      });
    }
    const item = paymentsMap.get(key);
    item.totalAmount += Number(r.amount);
    item.holderCount += 1;
  }

  const payments = Array.from(paymentsMap.values());
  res.json({ payments });
});

paymentRoutes.get('/actions/:actionId/payments', (req, res) => {
  const db = getDatabase();
  const payments = db.prepare('SELECT * FROM payment_events WHERE action_id = ?').all(req.params.actionId);
  res.json({ payments });
});
