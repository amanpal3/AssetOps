import { Router } from 'express';
import { prisma } from '../database/prisma.js';

export const assetRoutes = Router();

// GET /api/v1/assets
assetRoutes.get('/assets', async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        _count: { select: { holders: true, actions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ assets });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/assets/:address
assetRoutes.get('/assets/:address', async (req, res, next) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { address: req.params.address.toLowerCase() },
      include: {
        _count: { select: { holders: true, actions: true } }
      }
    });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    next(error);
  }
});
