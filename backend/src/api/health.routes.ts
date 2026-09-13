import { Router } from 'express';
import { SyncManager } from '../indexer/sync-manager.js';

export const healthRoutes = Router();

healthRoutes.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'assetops-backend',
    lastSyncedBlock: SyncManager.getLastSyncedBlock(),
    timestamp: new Date().toISOString()
  });
});
