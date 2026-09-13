import { Router } from 'express';
import { prisma } from '../database/prisma.js';
import { config } from '../config/index.js';

export const healthRoutes = Router();

// GET /api/v1/health
healthRoutes.get('/health', async (req, res, next) => {
  try {
    const checkpoint = await prisma.syncCheckpoint.findUnique({
      where: { id: 'checkpoint' }
    });

    res.json({
      status: 'ok',
      service: 'assetops-backend',
      chainId: checkpoint?.chainId ?? 31337,
      lastSyncedBlock: checkpoint ? checkpoint.lastBlock.toString() : '0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/network
healthRoutes.get('/network', async (req, res, next) => {
  try {
    const checkpoint = await prisma.syncCheckpoint.findUnique({
      where: { id: 'checkpoint' }
    });
    const chainId = checkpoint?.chainId ?? 31337;
    const networkName = chainId === 11155111 ? 'sepolia' : 'hardhat';

    res.json({
      network: networkName,
      chainId,
      rpcUrl: config.rpcUrl,
      explorerBaseUrl: chainId === 11155111 ? 'https://sepolia.etherscan.io' : 'http://localhost:8545'
    });
  } catch (error) {
    next(error);
  }
});
