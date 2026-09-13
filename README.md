# AssetOps

> **The Operations Layer for Tokenized Assets**  
> *Minting the token is the easy part — AssetOps makes tokenized assets work after launch.*

---

## 🚀 Overview

Issuing a tokenized share or bond on-chain takes minutes. But managing its post-issuance lifecycle — coupon and interest payments, investor transfers between record and payable dates, corrected corporate-action announcements, duplicate-payment prevention, and maturity redemption — is where today's Web3 tokenization platforms fail.

Current industry players (such as BlackRock's BUIDL via Securitize, Ondo, and Centrifuge) largely route around this problem by handling corporate actions off-chain through traditional transfer agents, baking yield into NAV, or batching into epochs.

**AssetOps brings the entire post-issuance operational lifecycle natively on-chain**, replicating Depository Trust Company (DTC)-grade servicing with mathematical rigor and auditability:

1. **The Token IS the Registry:** Payments execute against the live holder registry at execution time, handling mid-cycle transfers seamlessly without stale snapshots.
2. **First-Class Versioned Announcements:** Corporate action announcements are append-only. When an announcement is amended (e.g. coupon adjusted from 5% to 4%), the original version is preserved as `SUPERSEDED` and linked to the `ACTIVE` version. Both are permanently auditable on-chain.
3. **Protocol-Level Idempotency:** Duplicate payouts and replays are structurally impossible. The execution guard reverts any second payout attempt on-chain.
4. **Principal Redemption & Token Burn:** At maturity, principal is distributed to current holders, and redeemed asset tokens are burned via an authorized burn path, reducing total supply to zero.
5. **Auditor-Grade Accounting Events:** Distributions emit balanced journal events for straightforward reconciliation.

---

## 👥 Team Structure (3 Members)

AssetOps is developed collaboratively with clear domain separation:

| Member | Role | Primary Responsibility | Code Ownership |
|---|---|---|---|
| **Member A** | **Smart Contract Lead** | Solidity `^0.8.24`, OpenZeppelin v5, access control, math precision, invariant tests | `contracts/` |
| **Member B** | **Protocol & Backend Lead** | Event listener, database indexing, REST API, deployment manifests, Sepolia ops | `backend/`, `scripts/`, `deployments/` |
| **Member C** | **Product & Frontend Lead** | React dashboard, wagmi/viem integration, UI/UX design tokens, live demo script | `frontend/`, `docs/DEMO_FLOW.md` |

---

## 📂 Repository Architecture

```
AssetOps/
├── contracts/                         # Solidity smart contracts
│   ├── contracts/
│   │   ├── SecurityToken.sol          # ERC-20 + allowlist + holder enumeration + burn
│   │   ├── PaymentCurrency.sol        # Mock USDC ERC-20 stablecoin
│   │   ├── CorporateActionRegistry.sol# Append-only versioned announcement DAG
│   │   ├── PaymentExecutor.sol        # Idempotent payout & redemption engine
│   │   └── interfaces/                # Minimal decoupled contract interfaces
│   ├── test/                          # Unit & integration test suites
│   ├── scripts/                       # Deployment and demo seeding scripts
│   ├── hardhat.config.ts
│   └── package.json
│
├── frontend/                          # Institutional React operations dashboard
│   ├── src/
│   │   ├── components/                # Layout, holders, actions, payments, audit views
│   │   ├── pages/                     # Overview, Holders, CorporateActions, Redemptions, etc.
│   │   ├── hooks/                     # Custom wagmi/viem Web3 hooks
│   │   ├── lib/                       # Contract bindings, client config, explorer links
│   │   └── styles/                    # Tailwind CSS design system
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                           # Event indexer & query service
│   ├── src/
│   │   ├── indexer/                   # On-chain event listener & sync manager
│   │   ├── api/                       # REST routes for assets, actions, audit logs
│   │   ├── database/                  # Connection, migrations, and repositories
│   │   └── server.ts                  # Express API server with Sentry tracking
│   ├── test/                          # Indexer and projection tests
│   └── package.json
│
├── scripts/                           # Shared monorepo deployment & verification scripts
├── tests/                             # End-to-end integration & scenario tests
├── docs/                              # Master specifications & architecture documents
├── deployments/                       # Deployed contract addresses (Hardhat, Sepolia)
├── .agents/                           # AI skills & development workflows
└── .github/                           # CI/CD workflows, CODEOWNERS, issue templates
```

---

## 📖 Key Documentation in [`docs/`](docs/)

- [**PRD.md**](docs/PRD.md): Product Requirements Document and acceptance criteria.
- [**ARCHITECTURE.md**](docs/ARCHITECTURE.md): System architecture, trust boundaries, and data flows.
- [**CONTRACT_DESIGN.md**](docs/CONTRACT_DESIGN.md): Detailed Solidity interfaces, storage layouts, and math formulas.
- [**API_CONTRACT.md**](docs/API_CONTRACT.md): Integration specifications across contracts, indexer, and frontend.
- [**DEMO_FLOW.md**](docs/DEMO_FLOW.md): Step-by-step 5-minute live demonstration script.
- [**DECISIONS.md**](docs/DECISIONS.md): 30 Architecture Decision Records (ADRs).
- [**TESTING_PLAN.md**](docs/TESTING_PLAN.md): Invariants and multi-tier verification strategy.
- [**SECURITY.md**](docs/SECURITY.md): Threat model, role matrix, and defensive controls.
- [**UI_UX.md**](docs/UI_UX.md): Design tokens and UI specifications.
- [**teamworkenstruct.md**](docs/teamworkenstruct.md): Three-Member, Eight-Hour Hackathon Execution Guide.

---

## ⚡ Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

### Installation & Setup
```bash
# Clone the repository
git clone <repo-url>
cd AssetOps

# Copy environment variables template
cp .env.example .env

# Install all workspace dependencies
pnpm install
```

### Compile & Test Contracts
```bash
# Compile Solidity contracts
pnpm contracts:compile

# Run complete smart contract test suite
pnpm contracts:test
```

### Run Local Demo
```bash
# In terminal 1: Start local EVM node
pnpm contracts:node

# In terminal 2: Start backend indexer & API
pnpm backend:dev

# In terminal 3: Start frontend dashboard
pnpm frontend:dev
```

---

## ⚖️ License
This project is licensed under the [MIT License](LICENSE).
