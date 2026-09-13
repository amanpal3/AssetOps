import { Router } from 'express';
import { AuditRepository } from '../database/repositories/audit.repository.js';

export const auditRoutes = Router();

auditRoutes.get('/audit/logs', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const logs = AuditRepository.getLogs(limit);
  res.json({ logs });
});
