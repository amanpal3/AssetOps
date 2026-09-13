# Contributing to AssetOps

Thank you for contributing to **AssetOps — The Operations Layer for Tokenized Assets**.

---

## 1. Team Structure & Ownership (3 Core Members)

AssetOps is developed collaboratively by a 3-member team with clear separation of responsibilities:

| Member Role | Primary Ownership | Required Review Scope |
|---|---|---|
| **Member A: Smart Contract Lead** | `contracts/`, Solidity source, unit & fuzz tests, contract deployment scripts, security invariants | Reviews all Solidity changes, mathematical formulas, and permission updates |
| **Member B: Protocol & Backend Lead** | `backend/`, event indexer, database migrations, REST/GraphQL API, `deployments/`, Sepolia operations | Reviews all registry ingestion, event listeners, API contracts, and deployment automation |
| **Member C: Product & Frontend Lead** | `frontend/`, React dashboard, UI/UX components, wallet integration, demo flow, and investor documentation | Reviews all client-side logic, user experience flows, transaction modals, and styling |

> For the granular 8-hour hackathon execution playbook, hourly checkpoints, and member-specific prompts, see [**docs/teamworkenstruct.md**](docs/teamworkenstruct.md).

---

## 2. Git Branching Strategy

We follow a structured branch workflow:

- `main`: Protected production-ready branch. Deployed to Sepolia / live dashboard.
- `develop`: Primary integration branch. All feature branches branch from and merge into `develop`.
- `feature/*`: Short-lived feature branches (e.g. `feature/security-token`, `feature/payment-executor`, `feature/indexer`).
- `fix/*`: Bug fixes for isolated issues (e.g. `fix/redemption-burn-path`).
- `docs/*`: Updates to project specifications in `docs/`.

---

## 3. Pull Request Requirements

Before opening a pull request to `develop` or `main`:

1. **Focused Scope:** Keep PRs atomic and focused on a single story or component.
2. **Quality Gates:**
   - All tests must pass: `pnpm test`
   - Linter must pass: `pnpm lint`
   - Smart contracts must compile without compiler warnings: `pnpm contracts:compile`
3. **Mandatory Area-Owner Approval:** PRs modifying `contracts/` require Member A's approval; PRs modifying `backend/` require Member B; PRs modifying `frontend/` require Member C.
4. **No Committed Secrets:** Never commit `.env`, private keys, mnemonic phrases, or secret RPC URLs.

---

## 4. Coding & Architecture Invariants

- **Blockchain as Truth:** Smart contracts remain the sole authority for token balances, corporate-action versions, execution guards, and redemption status. The backend and frontend provide projections.
- **Append-Only Announcements:** Announcements are never overwritten; amendments append a new version linked to the prior version via `supersedes`.
- **Duplicate Prevention:** Payouts and redemptions must enforce on-chain idempotency guards.
- **Fail Closed:** Financial operations revert atomically upon any precondition failure.
