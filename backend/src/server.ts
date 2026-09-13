import express from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import { config } from './config/index.js';
import { healthRoutes } from './api/health.routes.js';
import { assetRoutes } from './api/asset.routes.js';
import { holderRoutes } from './api/holder.routes.js';
import { actionRoutes } from './api/action.routes.js';
import { paymentRoutes } from './api/payment.routes.js';
import { redemptionRoutes } from './api/redemption.routes.js';
import { auditRoutes } from './api/audit.routes.js';
import { EventListener } from './indexer/event-listener.js';

const app = express();

// Initialize Sentry with graceful degradation
if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development'
  });
  console.log('🛡️ Sentry initialized for AssetOps backend');
}

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// API Routes mounted on /api/v1 (and backward-compatible /api)
app.use('/api/v1', healthRoutes);
app.use('/api/v1', assetRoutes);
app.use('/api/v1', holderRoutes);
app.use('/api/v1', actionRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1', redemptionRoutes);
app.use('/api/v1', auditRoutes);

// Backward-compatible mounts
app.use('/api', healthRoutes);
app.use('/api', assetRoutes);
app.use('/api', holderRoutes);
app.use('/api', actionRoutes);
app.use('/api', paymentRoutes);
app.use('/api', redemptionRoutes);
app.use('/api', auditRoutes);

// Error Handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  if (config.sentryDsn) {
    Sentry.captureException(err);
  }
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

let server: any = null;
export function startServer(port = config.port) {
  return new Promise((resolve) => {
    server = app.listen(port, () => {
      console.log(`🚀 AssetOps Backend API listening on http://localhost:${port}/api/v1`);
      resolve(server);
    });
  });
}

const isDirectRun = process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js');

if (isDirectRun) {
  startServer().then(() => {
    const listener = new EventListener();
    listener.start().catch((err) => {
      console.error('Indexer failed to start:', err);
      if (config.sentryDsn) Sentry.captureException(err);
    });
  });
}

export { app };
