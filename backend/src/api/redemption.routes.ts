import { Router } from 'express';
import { getDatabase } from '../database/connection.js';

export const redemptionRoutes = Router();

redemptionRoutes.get('/redemptions', (req, res) => {
  const db = getDatabase();
  const redemptions = db.prepare(`SELECT * FROM corporate_actions WHERE action_type = 'REDEMPTION'`).all();
  res.json({ redemptions });
});
