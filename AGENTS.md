# AssetOps — AI Agent Guidelines & Architecture Rules

This repository contains **AssetOps**, the on-chain operations layer for tokenized Real-World Assets (RWAs).

---

## 1. Project Principles & Non-Negotiable Rules

1. **On-Chain Authority:**
   - Smart contracts in `contracts/` are the absolute source of truth for ownership, corporate action status, payment execution, and redemption.
   - The backend indexer (`backend/`) and frontend (`frontend/`) are read/query projections only. They never authorize financial state transitions.

2. **Corporate Action Versioning (Append-Only):**
   - Corporate action announcements in `CorporateActionRegistry.sol` are strictly append-only.
   - Amendments NEVER mutate or overwrite existing versions.
   - A superseded version is permanently marked `SUPERSEDED` and cannot be paid. Only the `ACTIVE` version can execute.

3. **Idempotency by Construction:**
   - Every payout and redemption action must enforce an on-chain execution guard (`mapping(bytes32 => bool) executedVersion`).
   - A second execution attempt MUST revert on-chain (`AlreadyExecuted`).

4. **Authorized Redemption Burn:**
   - Redemptions must execute an authorized token burn (`burnFromHolder`) to reduce asset total supply to zero upon full redemption.

5. **Sentry Monitoring Rule:**
   - Backend and frontend services must integrate Sentry for error tracking and performance monitoring.
   - Never hardcode Sentry DSNs; read from environment variables (`SENTRY_DSN`, `VITE_SENTRY_DSN`) with graceful degradation if absent.

---

## 2. Team Structure & Ownership (3 Members)

- **Member A (Smart Contract Lead):** Owns `contracts/`, Solidity ^0.8.24, OpenZeppelin v5, Hardhat tests, and security invariants.
- **Member B (Protocol & Backend Lead):** Owns `backend/`, event indexer, SQLite/Postgres schemas, API endpoints, `deployments/`, and Sepolia deployment scripts.
- **Member C (Product & Frontend Lead):** Owns `frontend/`, React + Vite dashboard, wagmi/viem integration, UI/UX states, and demo flows.

---

## 3. Autonomous Execution Rules

- **Pre-Execution Check:** Verify specifications in `docs/` (`PRD.md`, `CONTRACT_DESIGN.md`, `ARCHITECTURE.md`) before altering interfaces.
- **Empirical Verification:** Never declare a task complete without executing tests (`pnpm test`, `hardhat test`) and verifying output.
- **No Hardcoded Secrets:** Never insert private keys, mnemonics, or sensitive API keys. Use `.env.example` templates.
