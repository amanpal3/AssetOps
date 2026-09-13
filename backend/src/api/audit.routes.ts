import { Router } from 'express';
import { prisma } from '../database/prisma.js';

export const auditRoutes = Router();

// GET /api/v1/audit
// Optional filters: ?eventType=...&limit=50
auditRoutes.get('/audit', async (req, res, next) => {
  try {
    const { eventType, limit } = req.query;
    const where: any = {};

    if (eventType) {
      where.eventType = String(eventType).toUpperCase();
    }

    const take = limit ? Math.min(Number(limit), 200) : 50;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take
    });

    const parsedLogs = logs.map(log => ({
      ...log,
      blockNumber: log.blockNumber ? log.blockNumber.toString() : null,
      details: (() => {
        try {
          return JSON.parse(log.details);
        } catch {
          return log.details;
        }
      })()
    }));

    res.json({
      auditLogs: parsedLogs,
      count: parsedLogs.length
    });
  } catch (error) {
    next(error);
  }
});
