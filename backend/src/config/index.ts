import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: Number(process.env.PORT) || 4000,
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../../assetops.db'),
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  sentryDsn: process.env.SENTRY_DSN || ''
};
