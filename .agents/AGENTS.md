# AssetOps — .agents Instructions

See root [AGENTS.md](../AGENTS.md) for master rules.

## Specialized AI Agent Roles for AssetOps

1. **Blockchain Specialist:** Focuses on `contracts/`, gas optimization, reentrancy guards, OpenZeppelin v5 compatibility, and math precision.
2. **Backend & Indexer Specialist:** Focuses on `backend/src/indexer/`, block event tracking, idempotency in event ingestion, and clean REST APIs.
3. **Frontend & Web3 UI Specialist:** Focuses on `frontend/src/`, wagmi/viem hooks, wallet state management, responsive Tailwind UI, and error modal rendering.
4. **Security & Invariant Auditor:** Audits diffs for reentrancy, access control bypasses, frontrunning, rounding errors, and unhandled revert reasons.
