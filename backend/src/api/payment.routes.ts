import { Router } from 'express';
import { getDatabase } from '../database/connection.js';

export const paymentRoutes = Router();

paymentRoutes.get('/actions/:actionId/payments', (req, res) => {
  const db = getDatabase();
  const payments = db.prepare('SELECT * FROM payment_events WHERE action_id = ?').all(req.params.actionId);
  res.json({ payments });
});
