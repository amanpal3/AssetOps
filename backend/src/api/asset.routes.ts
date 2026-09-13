import { Router } from 'express';
import { AssetRepository } from '../database/repositories/asset.repository.js';

export const assetRoutes = Router();

assetRoutes.get('/assets', (req, res) => {
  const assets = AssetRepository.getAllAssets();
  res.json({ assets });
});

assetRoutes.get('/assets/:address', (req, res) => {
  const asset = AssetRepository.getAsset(req.params.address);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  res.json(asset);
});
