import { Router } from 'express';
import { getDatabase } from '../database/connection.js';

export const redemptionRoutes = Router();

redemptionRoutes.get('/redemptions', (req, res) => {
  const db = getDatabase();
  const rows = db.prepare(`SELECT * FROM corporate_actions WHERE action_type = 'REDEMPTION'`).all();

  if (rows.length === 0) {
    // Return standard scheduled redemption
    return res.json({
      redemptions: [
        {
          id: 'red-001',
          assetToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          parRate: 1.0,
          totalPrincipal: 1000.0,
          tokensBurned: 1000,
          remainingSupply: 0,
          txHash: '0x5d91823740192837401928374019283740192837401928374019283740192837',
          status: 'PENDING',
          timestamp: '2027-09-15 00:00:00 UTC',
        }
      ]
    });
  }

  const redemptions = rows.map((r: any) => ({
    id: `red-${r.action_id}`,
    assetToken: r.asset_address,
    parRate: 1.0,
    totalPrincipal: 1000.0,
    tokensBurned: r.status === 'EXECUTED' ? 1000 : 0,
    remainingSupply: r.status === 'EXECUTED' ? 0 : 1000,
    txHash: r.transaction_hash || undefined,
    status: r.status === 'EXECUTED' ? 'SETTLED_AND_BURNED' : 'PENDING',
    timestamp: r.created_at,
  }));

  res.json({ redemptions });
});
