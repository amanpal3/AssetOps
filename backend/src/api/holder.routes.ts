import { Router } from 'express';
import { AssetRepository } from '../database/repositories/asset.repository.js';

export const holderRoutes = Router();

holderRoutes.get('/holders', (req, res) => {
  const data = AssetRepository.getAllHolders();
  res.json(data);
});

holderRoutes.get('/assets/:address/holders', (req, res) => {
  const holders = AssetRepository.getHolders(req.params.address);
  res.json({ holders, count: holders.length });
});
