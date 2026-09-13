# AssetOps â€” Development Plan and Workflow

**Project:** AssetOps â€” The Operations Layer for Tokenized Assets  
**Document:** Development Plan  
**Status:** Initial implementation baseline  
**Team:** Three members using GitHub  
**Development tools:** Antigravity IDE, Gemini CLI, and Claude models

## 1. Development Analysis

The project currently has the product, architecture, database, technical, and technology documentation defined. The implementation repository is not yet scaffolded with Solidity, frontend, indexer, or test source code.

The architecture has four high-risk boundaries:

1. Corporate-action versioning must preserve every announcement and make only the active version payable.
2. Payment execution must calculate deterministic amounts and prevent duplicate execution.
3. Redemption must pay holders and burn investor-owned asset tokens through a valid authorized path.
4. The indexer must be rebuildable from blockchain events and must not become a second financial authority.

Development must proceed incrementally. The team should not build the frontend before contract interfaces and event names stabilize. The team should not implement payment execution before registry invariants and token holder behavior are tested.

## 2. Development Objective

Deliver a working AssetOps MVP that demonstrates:

```text
Create tokenized asset
    â†“
Distribute tokens
    â†“
Track current holders
    â†“
Create coupon announcement Version 1
    â†“
Transfer tokens before payment
    â†“
Amend to Version 2
    â†“
Pay only the active corrected version
    â†“
Reject duplicate and superseded execution
    â†“
Redeem principal
    â†“
Burn asset tokens
    â†“
Display the audit history
```

## 3. Team Structure

| Member   | Role                             | Primary ownership                                          | Review responsibility                                                   |
| -------- | -------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| Member A | Smart Contract Lead              | `packages/contracts`, Solidity tests, security invariants  | Reviews all contract, payment, burn, and permission changes             |
| Member B | Protocol and Infrastructure Lead | `packages/indexer`, database, deployment, scripts, Sepolia | Reviews registry integration, events, deployments, and data consistency |
| Member C | Product and Frontend Lead        | `packages/frontend`, demo flow, product documentation      | Reviews dashboard behavior, acceptance criteria, and user experience    |

The ownership model identifies the default maintainer. It does not prevent another member from contributing. Cross-area changes require review from the affected area owner.

## 4. Development Environment

The team uses:

| Tool                    | Use                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Antigravity IDE         | Open the repository, edit files, run commands, inspect diffs, and manage documentation              |
| Gemini CLI              | Explore the repository, implement focused changes, generate tests, debug, and draft documentation   |
| Claude models           | Independently review architecture, Solidity, security assumptions, test coverage, and documentation |
| Git and GitHub          | Branches, pull requests, reviews, issues, and protected main branch                                 |
| Node.js and pnpm or npm | Package management and JavaScript/TypeScript tooling                                                |
| Hardhat                 | Compile, test, deploy, and run the local EVM network                                                |
| Sepolia                 | Public testnet demonstration                                                                        |

AI tools may propose or generate code. They may not approve, merge, deploy, or handle secrets without human control.

## 5. Repository Structure

```text
assetops/
â”œâ”€â”€ README.md
â”œâ”€â”€ PRD.md
â”œâ”€â”€ technology.md
â”œâ”€â”€ architecture.md
â”œâ”€â”€ database.md
â”œâ”€â”€ development.md
â”œâ”€â”€ overview.md
â”œâ”€â”€ technicals.md
â”œâ”€â”€ packages/
â”‚   â”œâ”€â”€ contracts/
â”‚   â”‚   â”œâ”€â”€ contracts/
â”‚   â”‚   â”œâ”€â”€ test/
â”‚   â”‚   â”œâ”€â”€ scripts/
â”‚   â”‚   â”œâ”€â”€ hardhat.config.ts
â”‚   â”‚   â””â”€â”€ package.json
â”‚   â”œâ”€â”€ indexer/
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ migrations/
â”‚   â”‚   â”œâ”€â”€ schema/
â”‚   â”‚   â””â”€â”€ package.json
â”‚   â””â”€â”€ frontend/
â”‚       â”œâ”€â”€ src/
â”‚       â”œâ”€â”€ public/
â”‚       â””â”€â”€ package.json
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ deploy.ts
â”‚   â””â”€â”€ seed-demo.ts
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ DESIGN_DECISIONS.md
â”‚   â”œâ”€â”€ DEMO_SCRIPT.md
â”‚   â””â”€â”€ SECURITY_MODEL.md
â””â”€â”€ .github/
    â”œâ”€â”€ workflows/
    â”‚   â””â”€â”€ ci.yml
    â””â”€â”€ pull_request_template.md
```

## 6. Implementation Phases

### Phase 0 â€” Repository foundation

**Owner:** All members, coordinated by Member B.

Create the GitHub repository structure, package configuration, shared environment conventions, formatting rules, CI workflow, and pull-request template.

Deliverables:

- Repository initialized.
- Protected `main` branch configured.
- Package manager selected and lockfile committed.
- Hardhat package created.
- Frontend package created.
- Indexer package created.
- CI runs a basic compile or build check.
- No secrets committed.

Exit condition:

```text
A clean checkout installs dependencies and runs the initial CI workflow.
```

### Phase 1 â€” Asset token and payment currency

**Owner:** Member A.

Implement `SecurityToken.sol` and `PaymentCurrency.sol` using OpenZeppelin contracts.

Required behavior:

- ERC-20 balances and transfers.
- Minting restricted by role.
- Burning through an explicit authorized path.
- Allowlist management.
- Pausable transfer behavior.
- Holder enumeration for the small MVP.
- Payment-currency minting for test funding.

Tests must cover permissions, transfers, allowlist behavior, pause behavior, minting, burning, holder tracking, and total supply.

Exit condition:

```text
Token unit tests pass and a local script can distribute demo balances.
```

### Phase 2 â€” Corporate-action registry

**Owners:** Members A and B.

Implement `CorporateActionRegistry.sol` before the payment executor.

Required behavior:

- Create coupon, interest, and redemption actions.
- Store Version 1 permanently.
- Amend an active action by appending a new version.
- Mark the prior version superseded.
- Update the active-version pointer.
- Preserve the record date according to the documented MVP rules.
- Reject amendments to terminal actions.
- Emit structured events.

Tests must prove that Version 1 remains queryable, Version 2 links to Version 1, only Version 2 is active, and a superseded version cannot execute.

Exit condition:

```text
Registry state-transition and versioning invariants pass independently.
```

### Phase 3 â€” Payment and redemption engine

**Owner:** Member A, with Member B integration review.

Implement `PaymentExecutor.sol` after the registry interface is stable.

Required behavior:

- Coupon and interest execution.
- Basis-point calculations using integer arithmetic.
- Payable-date validation.
- Treasury balance and allowance validation.
- Current-holder balance reads.
- Per-holder payment events.
- Reentrancy protection.
- One-time execution guard.
- Redemption payments.
- Authorized holder-token burning.
- Atomic rollback on failure.

Tests must cover successful payment, insufficient funding, not-yet-payable actions, unauthorized execution, duplicate execution, superseded execution, transfer-before-payment behavior, redemption, and failed-transaction rollback.

Exit condition:

```text
The complete local contract lifecycle passes as one integration test.
```

### Phase 4 â€” Indexer and database

**Owner:** Member B.

Implement event ingestion using Ethers.js or viem and the schema defined in `database.md`.

Required behavior:

- Read configured deployment addresses.
- Start indexing from deployment blocks.
- Process events in deterministic order.
- Maintain idempotency by transaction hash and log index.
- Store assets, holders, balances, actions, versions, executions, payments, and redemptions.
- Track indexer progress.
- Support rebuild from an empty database.
- Expose read queries for the dashboard.

Exit condition:

```text
Deleting and rebuilding the read model produces the same state as direct contract reads.
```

### Phase 5 â€” Frontend dashboard

**Owner:** Member C.

Implement the dashboard after contract ABIs and event names are available.

Required views:

- Asset overview.
- Holder registry.
- Announcement list.
- Version history.
- Payment history.
- Redemption status.
- Guided demo control panel.

Required UX behavior:

- Wallet connection.
- Network validation.
- Clear signature, pending, confirmed, and failed states.
- Explorer links for confirmed transactions.
- Visible distinction between expected duplicate rejection and unexpected failure.
- Read current balances directly before important write actions.

Exit condition:

```text
A user can operate the scripted lifecycle from the dashboard on the local network.
```

### Phase 6 â€” Local demo and integration hardening

**Owners:** All members.

Create `seed-demo.ts` and run the complete scenario repeatedly on Hardhat Network.

The seed script shall:

1. Deploy all contracts.
2. Configure roles.
3. Whitelist Alice, Bob, and Charlie.
4. Mint asset tokens.
5. Mint and fund payment currency.
6. Announce Version 1 at 5%.
7. Transfer 200 tokens from Bob to Charlie.
8. Amend to Version 2 at 4%.
9. Approve and fund the payment executor.
10. Execute Version 2.
11. Attempt duplicate execution.
12. Attempt superseded Version 1 execution.
13. Create and execute a redemption action.
14. Write deployment and transaction metadata without secrets.

Exit condition:

```text
The local demo is repeatable and every acceptance criterion has an automated check.
```

### Phase 7 â€” Sepolia deployment

**Owner:** Member B, with review from Members A and C.

Deploy only from a reviewed commit.

Required deployment checks:

- Correct chain ID.
- Correct RPC endpoint.
- Correct deployer account.
- Correct role assignments.
- Correct contract addresses.
- Correct token and payment configuration.
- Verified explorer links.
- Deployment manifest written without private keys.

Exit condition:

```text
The live dashboard completes the primary scenario on Sepolia.
```

## 7. GitHub Workflow

### Branching

Use `develop` as the shared integration branch and `main` as the protected release branch. Work is organized into three area branches that merge into `develop` through pull requests:

```text
                 develop
               /    |    \
              /     |     \
       frontend  backend  blockchain
           \       |       /
            \      |      /
              Pull Requests
                    â†“
                 develop
                    â†“
                  main
```

The area branches may be persistent team branches or short-lived branches created from the corresponding area branch. The recommended long-lived branches are `frontend`, `backend`, and `blockchain`.

Use short-lived task branches based on the relevant area branch:

```text
blockchain/security-token
blockchain/corporate-action-registry
blockchain/payment-executor
backend/indexer
backend/deployment-scripts
frontend/dashboard
frontend/demo-flow
fix/redemption-burn-path
test/integration-lifecycle
docs/update-development-plan
```

The branch responsibilities are:

| Branch       | Primary scope                                                 | Merge destination    |
| ------------ | ------------------------------------------------------------- | -------------------- |
| `frontend`   | React dashboard, UI/UX, wallet flows, demo interface          | `develop`            |
| `backend`    | Indexer, database, API/query layer, deployment scripts        | `develop`            |
| `blockchain` | Solidity contracts, ABIs, contract tests, security invariants | `develop`            |
| `develop`    | Integrated testing and release-candidate preparation          | `main`               |
| `main`       | Stable release and approved deployment baseline               | None; release branch |

Direct commits to `frontend`, `backend`, `blockchain`, `develop`, and `main` are not allowed. All changes enter through pull requests.

### Pull requests

Every pull request must:

1. Explain the problem and solution.
2. Reference the relevant PRD or technical requirement.
3. Identify changed packages and contracts.
4. Include tests or explain why tests are not applicable.
5. Report local validation commands and results.
6. Identify migrations, ABI changes, or deployment effects.
7. Request review from the affected area owner.
8. Pass GitHub Actions before merge.
9. Contain no private keys, seed phrases, RPC secrets, or local environment files.

Pull requests from `frontend`, `backend`, and `blockchain` target `develop`. A release pull request targets `main` from `develop` only after the integrated lifecycle tests, frontend build, indexer checks, and demo rehearsal pass.

### Commit format

Use focused conventional-style commits:

```text
feat: add security token allowlist
feat: add corporate action amendment versions
fix: authorize redemption token burns
test: cover duplicate coupon execution
docs: update deployment workflow
chore: pin OpenZeppelin version
```

## 8. AI-Assisted Development Rules

### Antigravity IDE

Use Antigravity IDE as the shared workspace for repository inspection, implementation, command execution, diff review, and documentation maintenance.

### Gemini CLI

Use Gemini CLI for repository exploration, focused code generation, test scaffolding, debugging, refactoring, and implementation assistance. Gemini CLI must read the relevant project documents before proposing architecture changes.

### Claude models

Use Claude models for independent review rather than duplicating the same implementation blindly. Recommended uses include:

- Threat modeling.
- Solidity and access-control review.
- Corporate-action state-machine review.
- Payment-math and rounding review.
- Test-gap analysis.
- Database event-model review.
- Pull-request documentation review.

### Mandatory review rule

AI output is a proposal until validated. For every AI-assisted code change:

```text
Review diff
    â†“
Compile
    â†“
Run targeted tests
    â†“
Run full tests
    â†“
Run static checks where available
    â†“
Human area-owner approval
```

Never provide AI tools with private keys, seed phrases, API keys, user secrets, or unredacted environment files.

## 9. Testing and Validation Commands

The exact commands depend on the selected package manager, but the workflow must provide equivalents for:

```text
Install dependencies
Compile contracts
Run contract unit tests
Run integration tests
Run indexer tests
Run frontend type checks
Build frontend
Run linting
Run secret scanning
```

The minimum contract test flow is:

```text
npm run compile
npm run test
npm run test:integration
```

The minimum frontend flow is:

```text
npm run typecheck
npm run build
```

The minimum CI flow must execute all relevant package checks on every pull request.

## 10. Definition of Done

A development task is complete when:

- The implementation matches the PRD and architecture.
- The code is formatted and type-safe where applicable.
- Targeted tests pass.
- The full relevant test suite passes.
- Events and interfaces are documented when changed.
- Database migrations are included for schema changes.
- The frontend handles pending and failed transaction states.
- The pull request has area-owner review.
- CI passes.
- No secrets are present in the diff.
- The change is safe to merge into `main`.

The MVP is complete when all PRD acceptance criteria pass and the Sepolia demonstration follows the scripted lifecycle without manual state correction.

## 11. Development Risks

| Risk                                                  | Mitigation                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Contract interfaces change after frontend work begins | Stabilize registry and executor ABIs before frontend integration          |
| Versioning bug pays an old announcement               | Pair-review registry logic and test invariants before payment work        |
| Redemption burn path is invalid                       | Implement and test an explicit authorized burn function                   |
| Indexer becomes a second source of truth              | Rebuild from events and verify critical writes directly on-chain          |
| AI-generated code introduces defects                  | Independent Claude review, human review, and mandatory CI                 |
| Team merge conflicts                                  | Use ownership boundaries, small branches, and focused pull requests       |
| Sepolia deployment fails                              | Maintain a local demo fallback and record deployment metadata             |
| Secrets enter Git history                             | `.gitignore`, GitHub secret scanning, pre-commit checks, and human review |

## 12. References

[1]: ./PRD.md "AssetOps Product Requirements Document"
[2]: ./technology.md "AssetOps Master Technology Specification"
[3]: ./architecture.md "AssetOps System Architecture"
[4]: ./database.md "AssetOps Database and Data Model Specification"
[5]: ./technicals.md "AssetOps Technical Specification"
[6]: https://hardhat.org/docs "Hardhat Documentation"
[7]: https://docs.openzeppelin.com/contracts/5.x/ "OpenZeppelin Contracts Documentation"
[8]: https://docs.github.com/en/pull-requests "GitHub Pull Request Documentation"
