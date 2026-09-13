# AssetOps — Deployment & Infrastructure Specification

**Project:** AssetOps — The Operations Layer for Tokenized Assets  
**Document:** Deployment & Operational Specification  
**Status:** MVP Deployment Baseline  
**Target Environments:** Hardhat Localhost (Chain ID: 31337), Ethereum Sepolia (Chain ID: 11155111)

---

## 1. Deployment Order

Contracts must be deployed in strict dependency order:

```text
1. PaymentCurrency.sol (Mock USDC ERC-20)
2. SecurityToken.sol (ERC-20 with Allowlist & Burn)
3. CorporateActionRegistry.sol (Append-Only Version DAG)
4. PaymentExecutor.sol (Payout & Redemption Engine)
5. Grant EXECUTOR_ROLE on CorporateActionRegistry to PaymentExecutor
6. Grant BURNER_ROLE on SecurityToken to PaymentExecutor
7. Whitelist demo holders (Alice, Bob, Charlie)
8. Mint initial demo bond supply (1,000 DBT)
9. Fund Treasury with payment currency & approve PaymentExecutor
10. Generate and write deployment manifest (deployments/<network>.json)
```

---

## 2. Deployment Manifest Schema

Every deployment generates a standardized manifest in `deployments/`:

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "contracts": {
    "securityToken": "0x...",
    "paymentCurrency": "0x...",
    "corporateActionRegistry": "0x...",
    "paymentExecutor": "0x..."
  },
  "deploymentBlock": 1234567,
  "explorerBaseUrl": "https://sepolia.etherscan.io",
  "lastUpdated": "2026-09-13T08:00:00.000Z"
}
```

---

## 3. Environment Variables Configuration

Deployments read configuration strictly from environment variables:

| Variable | Description | Required Networks |
|---|---|---|
| `SEPOLIA_RPC_URL` | JSON-RPC provider endpoint for Sepolia (Alchemy/Infura) | Sepolia |
| `PRIVATE_KEY` | Deployer account private key (never commit) | Sepolia |
| `ETHERSCAN_API_KEY` | API key for automated Etherscan source verification | Sepolia |
| `SENTRY_DSN` | Backend Sentry DSN for error monitoring | All |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN for error monitoring | All |

---

## 4. Verification & Health Checks

After deployment:
1. Run `pnpm scripts/verify-deployment.ts <network>` to assert bytecode presence and correct role assignments.
2. Verify contracts on Etherscan: `pnpm contracts:verify --network sepolia`.
3. Check indexer sync health: `curl http://localhost:4000/api/health`.
