import { Router } from 'express';
import { prisma } from '../database/prisma.js';

export const paymentRoutes = Router();

// GET /api/v1/payments
// Optional filters: ?actionId=0x...&holder=0x...
paymentRoutes.get('/payments', async (req, res, next) => {
  try {
    const { actionId, holder } = req.query;
    const where: any = {};

    if (actionId) where.actionId = String(actionId).toLowerCase();
    if (holder) where.holderAddress = String(holder).toLowerCase();

    const payments = await prisma.paymentEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    res.json({
      payments,
      count: payments.length
    });
  } catch (error) {
    next(error);
  }
});
