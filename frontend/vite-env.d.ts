/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SECURITY_TOKEN_ADDRESS?: string;
  readonly VITE_PAYMENT_CURRENCY_ADDRESS?: string;
  readonly VITE_REGISTRY_ADDRESS?: string;
  readonly VITE_EXECUTOR_ADDRESS?: string;
  readonly VITE_SEPOLIA_RPC_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
