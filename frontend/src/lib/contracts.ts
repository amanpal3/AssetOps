export const CONTRACT_ADDRESSES = {
  securityToken: (import.meta.env.VITE_SECURITY_TOKEN_ADDRESS || '') as `0x${string}`,
  paymentCurrency: (import.meta.env.VITE_PAYMENT_CURRENCY_ADDRESS || '') as `0x${string}`,
  corporateActionRegistry: (import.meta.env.VITE_REGISTRY_ADDRESS || '') as `0x${string}`,
  paymentExecutor: (import.meta.env.VITE_EXECUTOR_ADDRESS || '') as `0x${string}`,
};
