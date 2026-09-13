import { Router } from 'express';
import { prisma } from '../database/prisma.js';

export const holderRoutes = Router();

// GET /api/v1/holders
// Optional query: ?assetAddress=0x...&includeZero=true
holderRoutes.get('/holders', async (req, res, next) => {
  try {
    const { assetAddress, includeZero } = req.query;
    const whereClause: any = {};

    if (assetAddress) {
      whereClause.assetAddress = String(assetAddress).toLowerCase();
    }

    if (includeZero !== 'true') {
      whereClause.NOT = { balance: '0' };
    }

    const holders = await prisma.holder.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      holders,
      count: holders.length
    });
  } catch (error) {
    next(error);
  }
});
