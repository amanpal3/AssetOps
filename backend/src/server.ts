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

// Mount API Routes on both /api and /api/v1 for complete compatibility
const apiPrefixes = ['/api', '/api/v1'];
for (const prefix of apiPrefixes) {
  app.use(prefix, healthRoutes);
  app.use(prefix, assetRoutes);
  app.use(prefix, holderRoutes);
  app.use(prefix, actionRoutes);
  app.use(prefix, paymentRoutes);
  app.use(prefix, redemptionRoutes);
  app.use(prefix, auditRoutes);
}

// Error Handling with Sentry Capture
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  if (config.sentryDsn) {
    Sentry.captureException(err);
  }
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(config.port, () => {
  console.log(`🚀 AssetOps Backend API listening on http://localhost:${config.port}`);
  console.log(`   Mounted on endpoints: /api and /api/v1`);
  const listener = new EventListener();
  listener.start().catch((err) => {
    console.warn('Indexer started in resilient fallback mode:', err?.message || err);
    if (config.sentryDsn) Sentry.captureException(err);
  });
});
