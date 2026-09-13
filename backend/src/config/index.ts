import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root or local .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: Number(process.env.PORT) || 4000,
  rpcUrl: process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || 'http://127.0.0.1:8545',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  sentryDsn: process.env.SENTRY_DSN || ''
};
