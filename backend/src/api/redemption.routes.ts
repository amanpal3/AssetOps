import { Router } from 'express';
import { prisma } from '../database/prisma.js';

export const redemptionRoutes = Router();

// GET /api/v1/redemptions
// Optional filter: ?actionId=0x...
redemptionRoutes.get('/redemptions', async (req, res, next) => {
  try {
    const { actionId } = req.query;
    const where: any = {};

    if (actionId) where.actionId = String(actionId).toLowerCase();

    const redemptions = await prisma.redemptionEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    res.json({
      redemptions,
      count: redemptions.length
    });
  } catch (error) {
    next(error);
  }
});
