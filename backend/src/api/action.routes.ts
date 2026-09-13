import { Router } from 'express';
import { ActionRepository } from '../database/repositories/action.repository.js';

export const actionRoutes = Router();

actionRoutes.get('/actions', (req, res) => {
  const actions = ActionRepository.getActions();
  res.json({ actions });
});

actionRoutes.get('/actions/:actionId', (req, res) => {
  const action = ActionRepository.getAction(req.params.actionId);
  if (!action) return res.status(404).json({ error: 'Action not found' });
  const activeVersion = ActionRepository.getActiveVersion(req.params.actionId);
  const history = ActionRepository.getVersionHistory(req.params.actionId);
  res.json({ action, activeVersion, history });
});
