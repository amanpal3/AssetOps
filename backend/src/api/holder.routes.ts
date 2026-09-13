import { Router } from 'express';
import { AssetRepository } from '../database/repositories/asset.repository.js';

export const holderRoutes = Router();

holderRoutes.get('/assets/:address/holders', (req, res) => {
  const holders = AssetRepository.getHolders(req.params.address);
  res.json({ holders, count: holders.length });
});
