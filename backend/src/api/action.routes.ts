import { Router } from 'express';
import { prisma } from '../database/prisma.js';

export const actionRoutes = Router();

// GET /api/v1/actions
// Optional filters: ?status=ACTIVE&type=COUPON
actionRoutes.get('/actions', async (req, res, next) => {
  try {
    const { status, type, assetAddress } = req.query;
    const where: any = {};

    if (status) where.status = String(status).toUpperCase();
    if (type) where.actionType = String(type).toUpperCase();
    if (assetAddress) where.assetAddress = String(assetAddress).toLowerCase();

    const actions = await prisma.corporateAction.findMany({
      where,
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ actions });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/actions/:id
actionRoutes.get('/actions/:id', async (req, res, next) => {
  try {
    const actionId = req.params.id.toLowerCase();
    const action = await prisma.corporateAction.findUnique({
      where: { actionId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        },
        payments: true,
        redemptions: true
      }
    });

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    const activeVersion = action.versions.find(v => v.versionId === action.activeVersionId);

    res.json({
      action,
      activeVersion,
      versions: action.versions
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/actions/:id/versions
actionRoutes.get('/actions/:id/versions', async (req, res, next) => {
  try {
    const actionId = req.params.id.toLowerCase();
    const versions = await prisma.actionVersion.findMany({
      where: { actionId },
      orderBy: { versionNumber: 'desc' }
    });

    res.json({ actionId, versions });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/actions/:id/preview
actionRoutes.get('/actions/:id/preview', async (req, res, next) => {
  try {
    const actionId = req.params.id.toLowerCase();
    const action = await prisma.corporateAction.findUnique({
      where: { actionId },
      include: {
        versions: true
      }
    });

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    const activeVersion = action.versions.find(v => v.versionId === action.activeVersionId);
    if (!activeVersion) {
      return res.status(404).json({ error: 'Active version not found' });
    }

    // Read current holders with balance > 0
    const holders = await prisma.holder.findMany({
      where: {
        assetAddress: action.assetAddress,
        NOT: { balance: '0' }
      }
    });

    let totalPayout = 0n;
    const previewList = holders.map(h => {
      const bal = BigInt(h.balance);
      let calculated = 0n;

      if (action.actionType === 'COUPON' || action.actionType === 'INTEREST') {
        const rateBps = BigInt(activeVersion.rateBps || 0);
        calculated = (bal * rateBps) / 10000n;
      } else if (action.actionType === 'REDEMPTION') {
        const amt = BigInt(activeVersion.amountPerToken || '0');
        calculated = (bal * amt) / 1000000000000000000n;
      }

      totalPayout += calculated;

      return {
        holderAddress: h.address,
        assetBalance: h.balance,
        assetBalanceDisplay: h.balanceDisplay,
        estimatedPayout: calculated.toString()
      };
    });

    res.json({
      actionId,
      versionId: activeVersion.versionId,
      versionNumber: activeVersion.versionNumber,
      actionType: action.actionType,
      status: activeVersion.status,
      rateBps: activeVersion.rateBps,
      payableDate: activeVersion.payableDate,
      totalEstimatedPayout: totalPayout.toString(),
      eligibleHolderCount: previewList.length,
      holders: previewList
    });
  } catch (error) {
    next(error);
  }
});
