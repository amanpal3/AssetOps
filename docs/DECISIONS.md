# AssetOps â€” Master Decisions Register

**Project:** AssetOps â€” The Operations Layer for Tokenized Assets  
**Document:** Master Decisions Register  
**Status:** Approved project baseline  
**Decision format:** Architecture Decision Record summary  
**Team:** Three members using GitHub, Antigravity IDE, Gemini CLI, and Claude models  
**Author:** Manus AI

## 1. Purpose

This document records the major decisions that control the design and delivery of AssetOps. It is the authoritative reference when implementation choices are unclear or when a proposed change may affect architecture, security, product scope, data integrity, or the live demonstration.

A decision may be changed only through a reviewed pull request. A changed decision must include the reason for change, the affected documents, the migration impact, and the responsible reviewer.

## 2. Decision Statuses

| Status       | Meaning                                                                              |
| ------------ | ------------------------------------------------------------------------------------ |
| `APPROVED`   | The team has selected this approach for the current project baseline                 |
| `PROPOSED`   | The approach is under discussion and must not be treated as implementation authority |
| `DEFERRED`   | The decision is intentionally postponed until a later phase                          |
| `REJECTED`   | The approach was considered and will not be used for the current scope               |
| `SUPERSEDED` | A later decision replaces this decision; the historical record remains               |

## 3. Decision Summary

| ID      | Decision                                                               | Status     |
| ------- | ---------------------------------------------------------------------- | ---------- |
| ADR-001 | Use AssetOps as the product name                                       | `APPROVED` |
| ADR-002 | Focus the MVP on post-issuance lifecycle operations                    | `APPROVED` |
| ADR-003 | Use Solidity, Hardhat, and OpenZeppelin                                | `APPROVED` |
| ADR-004 | Use an ERC-20 asset token instead of full ERC-1400                     | `APPROVED` |
| ADR-005 | Use an ERC-1404-style allowlist for the MVP                            | `APPROVED` |
| ADR-006 | Treat token balances as authoritative ownership                        | `APPROVED` |
| ADR-007 | Maintain an on-chain holder list for the small MVP                     | `APPROVED` |
| ADR-008 | Use a dedicated corporate-action registry                              | `APPROVED` |
| ADR-009 | Store announcements as append-only versions                            | `APPROVED` |
| ADR-010 | Allow only the active version to execute                               | `APPROVED` |
| ADR-011 | Use integer arithmetic and basis points                                | `APPROVED` |
| ADR-012 | Use direct push payments for the MVP                                   | `APPROVED` |
| ADR-013 | Use a Merkle claim model as the scale path                             | `DEFERRED` |
| ADR-014 | Use a mock ERC-20 payment currency                                     | `APPROVED` |
| ADR-015 | Prevent duplicates with an on-chain execution guard                    | `APPROVED` |
| ADR-016 | Use an explicit authorized redemption burn path                        | `APPROVED` |
| ADR-017 | Treat blockchain events as the audit history                           | `APPROVED` |
| ADR-018 | Use an indexer as a rebuildable read model                             | `APPROVED` |
| ADR-019 | Use React, Vite, TypeScript, wagmi, and viem                           | `APPROVED` |
| ADR-020 | Use Hardhat local network and Sepolia testnet                          | `APPROVED` |
| ADR-021 | Use GitHub protected branches and pull requests                        | `APPROVED` |
| ADR-022 | Use Antigravity, Gemini CLI, and Claude models with human review       | `APPROVED` |
| ADR-023 | Use a three-member ownership model                                     | `APPROVED` |
| ADR-024 | Keep the MVP non-upgradeable                                           | `APPROVED` |
| ADR-025 | Use role-based permissions and document single-wallet demo limitations | `APPROVED` |
| ADR-026 | Use IPFS-compatible document anchoring                                 | `APPROVED` |
| ADR-027 | Separate authoritative writes from indexed reads                       | `APPROVED` |
| ADR-028 | Use a local-first, test-first delivery sequence                        | `APPROVED` |
| ADR-029 | Treat the MVP as a technical prototype, not a regulated product        | `APPROVED` |
| ADR-030 | Use frontend, backend, blockchain, develop, and main branches          | `APPROVED` |

## 4. Product Decisions

### ADR-001 â€” Product name: AssetOps

**Status:** `APPROVED`

**Decision:** The product is named **AssetOps**, meaning **Asset Operations**.

**Rationale:** The name is short, clear, and broad enough for tokenized bonds, shares, funds, and other real-world assets. It communicates the operational work that occurs after issuance.

**Product story:**

> AssetOps makes tokenized assets work after issuance by managing ownership, corporate actions, payments, amendments, redemption, and audit history.

**Alternatives considered:**

- `RWA Lifecycle Servicing`: technically accurate but difficult to remember.
- `AfterMint`: memorable but less suitable as a long-term infrastructure product name.
- `BondFlow`: too narrow for assets beyond bonds.

**Consequences:** Documentation, repository naming, frontend branding, and presentation materials should use AssetOps. Existing technical contract names may remain descriptive rather than branded.

### ADR-002 â€” MVP focus: post-issuance lifecycle operations

**Status:** `APPROVED`

**Decision:** The MVP focuses on what happens after an asset is issued, rather than attempting to build a complete issuance platform.

**Required lifecycle actions:**

1. Coupon or interest payment.
2. Principal redemption at maturity.

**Required operational behaviors:**

- Holder tracking.
- Corporate-action announcements.
- Announcement amendments.
- Version management.
- Duplicate prevention.
- Audit history.

**Rationale:** Token issuance is widely demonstrated. Reliable servicing after issuance is the projectâ€™s central problem and differentiator.

**Consequences:** Features such as full investor onboarding, complex offering documents, and generalized corporate actions are outside the first release.

## 5. Smart-Contract Decisions

### ADR-003 â€” Solidity, Hardhat, and OpenZeppelin

**Status:** `APPROVED`

**Decision:** Use Solidity `^0.8.24`, Hardhat, and OpenZeppelin Contracts.

**Rationale:** This combination provides established EVM tooling, tested contract primitives, local-network testing, deployment support, and a familiar development workflow.

**Consequences:** Contract code must follow the selected Solidity and OpenZeppelin versions. Dependency versions must be pinned through the package lockfile.

### ADR-004 â€” Use ERC-20 instead of full ERC-1400

**Status:** `APPROVED`

**Decision:** Represent the tokenized asset with an OpenZeppelin ERC-20 extension.

**Rationale:** The MVP is about lifecycle servicing. ERC-20 supplies the required balance, transfer, approval, and burn behavior with less implementation complexity than a complete ERC-1400 partition model.

**Alternatives considered:**

- Full ERC-1400: deferred because partitions and additional security-token behavior are not necessary for the single-class demonstration.
- ERC-3643: deferred because identity registries and claims introduce substantial scope and operational complexity.

**Upgrade path:** ERC-3643 identity and compliance integration may be evaluated after the lifecycle engine is stable.

### ADR-005 â€” ERC-1404-style allowlist for the MVP

**Status:** `APPROVED`

**Decision:** Implement transfer restriction behavior using an allowlist and ERC-1404-style restriction codes.

**Rationale:** The MVP requires a practical way to restrict transfers to approved demonstration holders. An allowlist provides the necessary behavior without building a full on-chain identity system.

**Consequences:** The MVP is not a complete compliance implementation. Production identity, KYC, AML, jurisdiction, and investor eligibility controls require separate design and legal review.

### ADR-006 â€” Token balances are authoritative ownership

**Status:** `APPROVED`

**Decision:** The asset tokenâ€™s on-chain `balanceOf` values are the authoritative ownership state for the MVP.

**Rationale:** Using the token contract as the source of truth avoids a second manually synchronized ownership database.

**Consequences:** Payment calculations must read balances according to the documented MVP execution model. The indexer may project balances for convenience but cannot override contract state.

### ADR-007 â€” On-chain holder enumeration for the MVP

**Status:** `APPROVED`

**Decision:** Maintain a monotonic on-chain holder list for the small demonstration.

**Rationale:** The push-payment model needs deterministic holder enumeration. A small on-chain list is simple and transparent for the planned demonstration population.

**Known limitation:** Addresses that transfer their complete balance away may remain in the list. The executor skips zero-balance entries.

**Scale path:** Use an indexed snapshot and Merkle claims for large holder populations.

## 6. Corporate-Action Decisions

### ADR-008 â€” Dedicated CorporateActionRegistry

**Status:** `APPROVED`

**Decision:** Use a dedicated `CorporateActionRegistry` contract for announcements, versions, status, active-version resolution, and execution marking.

**Rationale:** Separating announcement state from token and payment logic makes the core innovation independently testable and auditable.

**Consequences:** The payment executor reads terms from the registry. The registry does not transfer payment funds.

### ADR-009 â€” Append-only announcement versions

**Status:** `APPROVED`

**Decision:** Amendments create new versions. Existing versions are never overwritten or deleted.

**Required behavior:**

```text
Version 1 â€” original terms â€” SUPERSEDED
Version 2 â€” corrected terms â€” ACTIVE
```

Version 2 stores a `supersedes` link to Version 1.

**Rationale:** Financial corrections must preserve the original announcement for auditability and dispute analysis.

**Consequences:** The database and frontend must display the complete version chain, not only the current active record.

### ADR-010 â€” Only the active version may execute

**Status:** `APPROVED`

**Decision:** A superseded or terminal version must always revert when execution is attempted. Only the latest active version may execute.

**Rationale:** This rule prevents a stale announcement from being paid after a correction.

**Consequences:** Version status and active-version pointer checks must be enforced on-chain. Frontend validation alone is insufficient.

### ADR-011 â€” Basis points and integer arithmetic

**Status:** `APPROVED`

**Decision:** Store rates as basis points and use integer arithmetic.

```text
100 basis points = 1%
500 basis points = 5%
400 basis points = 4%
```

**Rationale:** Solidity does not use native floating-point financial arithmetic. Basis points provide deterministic and testable calculations.

**Formula:**

```text
Holder payment = holder balance Ã— rateBps Ã· 10,000
```

**Consequences:** The implementation must document token and payment decimals and define rounding behavior explicitly.

## 7. Payment and Redemption Decisions

### ADR-012 â€” Direct push payments for the MVP

**Status:** `APPROVED`

**Decision:** The payment executor directly transfers payment currency to all non-zero-balance holders in one transaction for the demonstration.

**Rationale:** A push model makes the complete payment flow visible and easy to demonstrate with a small holder set.

**Known limitation:** Gas use grows with the number of holders and may exceed block limits at scale.

**Consequences:** The MVP must enforce a practical holder limit in demo scripts and document the scaling path.

### ADR-013 â€” Merkle claims as the scaling path

**Status:** `DEFERRED`

**Decision:** Use a Merkle snapshot and holder-claim model for production-scale distributions rather than extending the MVP push loop indefinitely.

**Proposed flow:**

1. Generate a holder entitlement snapshot.
2. Build a Merkle tree.
3. Store the Merkle root on-chain.
4. Allow each holder to claim with a proof.
5. Track claims per action and holder.

**Rationale:** Claim-based distribution avoids an unbounded on-chain loop.

**Open questions:** Record-date semantics, snapshot authority, amendment after root publication, unclaimed funds, expiry, and claim cancellation require a separate decision before implementation.

### ADR-014 â€” Mock ERC-20 payment currency

**Status:** `APPROVED`

**Decision:** Use a mock USDC-style ERC-20 token for development and Sepolia demonstration.

**Rationale:** A mock token provides deterministic balances, allowances, transfers, and test funding without representing real customer funds.

**Consequences:** The mock token is not a regulated stablecoin, bank deposit, or settlement rail. Production payment integration requires separate technical, legal, and operational review.

### ADR-015 â€” On-chain duplicate execution guard

**Status:** `APPROVED`

**Decision:** Store an execution guard keyed by the payable action version and set it as part of the successful execution transaction.

**Required behavior:**

```text
First execution â†’ succeeds
Second execution â†’ reverts
Superseded version â†’ reverts
```

**Rationale:** Idempotency must be enforced by the contract rather than by operator discipline or database state.

**Atomicity rule:** If funding or payment fails, the entire transaction must revert and the action must remain executable after the failure is corrected.

### ADR-016 â€” Explicit authorized redemption burn

**Status:** `APPROVED`

**Decision:** Redemption must use an explicit burn design that can burn tokens held by investors.

**Accepted implementation options:**

- An authorized `burnFromHolder(holder, amount)` function.
- A holder transfer to the executor followed by an authorized burn.
- Another explicitly tested role-controlled burn path.

**Rejected assumption:** The executor cannot call `burnFrom(address(this), amount)` to burn tokens that remain in investor wallets.

**Rationale:** Payment and token destruction must both be correct for redemption to close the asset.

## 8. Data and Audit Decisions

### ADR-017 â€” Blockchain events are the audit history

**Status:** `APPROVED`

**Decision:** Emit structured events for important state changes and treat confirmed blockchain events as the authoritative audit stream.

**Required event categories:**

- Asset transfers, mints, and burns.
- Allowlist changes.
- Announcement creation.
- Amendment and supersession.
- Action execution.
- Per-holder payment.
- Redemption.
- Journal or reconciliation entries.

**Rationale:** Events are independently verifiable and allow off-chain read models to be rebuilt.

### ADR-018 â€” Indexer as a rebuildable read model

**Status:** `APPROVED`

**Decision:** Use an Ethers.js or viem event indexer with PostgreSQL for persistent environments and SQLite for local development, unless the team later selects The Graph as the single indexing implementation.

**Rationale:** An indexed read model makes historical relationships and dashboard queries efficient without transferring financial authority off-chain.

**Required behavior:**

- Process events in deterministic order.
- Use transaction hash and log index for idempotency.
- Track deployment blocks and indexing progress.
- Support rebuild from an empty database.
- Verify critical state directly against contracts before financial writes.

### ADR-019 â€” Separate authoritative writes from indexed reads

**Status:** `APPROVED`

**Decision:** Wallet-signed transactions write to smart contracts. The indexer and database provide read projections only.

**Rationale:** An off-chain database must not be able to silently change ownership, action status, or execution state.

**Consequences:** The frontend must show pending and confirmed states and must not treat an unconfirmed indexed update as final.

### ADR-020 â€” IPFS-compatible document anchoring

**Status:** `APPROVED`

**Decision:** Store human-readable announcement documents in IPFS-compatible storage and record the content identifier in the on-chain version.

**Rationale:** The document hash connects the on-chain action to the announcement content without storing large documents directly in contract storage.

**Limitation:** A content identifier does not guarantee permanent gateway availability. Production deployments require a pinning and retention policy.

## 9. Application and Infrastructure Decisions

### ADR-021 â€” React frontend stack

**Status:** `APPROVED`

**Decision:** Use React, Vite, TypeScript, wagmi, viem, and Tailwind CSS for the dashboard.

**Rationale:** This stack provides a fast EVM wallet experience, typed contract integration, and a maintainable component-based frontend.

**Required views:**

- Asset overview.
- Holder registry.
- Announcement feed.
- Version history.
- Payment history.
- Redemption status.
- Guided demo control panel.

### ADR-022 â€” Hardhat local network and Sepolia

**Status:** `APPROVED`

**Decision:** Use Hardhat Network for local development and Ethereum Sepolia for the public demonstration.

**Rationale:** Hardhat provides deterministic local execution and time control. Sepolia provides public explorer-verifiable transactions without using production funds.

**Consequences:** Deployment scripts must validate the network and chain ID. A local demo fallback must remain available.

### ADR-023 â€” Three-member GitHub ownership model

**Status:** `APPROVED`

**Decision:** Use one GitHub repository with three area owners, short-lived branches, pull requests, protected `main`, and CI checks.

| Member   | Area                                                          |
| -------- | ------------------------------------------------------------- |
| Member A | Smart contracts, tests, security invariants                   |
| Member B | Registry integration, indexer, database, deployments, Sepolia |
| Member C | Frontend, demo flow, documentation, UI integration            |

**Rationale:** Clear ownership reduces merge conflicts while preserving cross-review for high-risk boundaries.

**Required review:** Payment, registry, redemption, role, database migration, and deployment changes require review from the relevant area owner.

### ADR-024 â€” Antigravity, Gemini CLI, and Claude models

**Status:** `APPROVED`

**Decision:** Use Antigravity IDE as the shared workspace, Gemini CLI for focused development assistance, and Claude models for independent review, threat modeling, and documentation critique.

**Rationale:** Different tools are assigned different responsibilities. Independent review reduces the risk of accepting one AI-generated solution without challenge.

**Controls:**

- AI output is a proposal until reviewed.
- Human approval is required before merge.
- Tests and CI are mandatory.
- AI tools must not receive private keys, seed phrases, or secrets.
- AI tools must not approve pull requests or deploy contracts autonomously.

### ADR-025 â€” Non-upgradeable baseline contracts

**Status:** `APPROVED`

**Decision:** Use non-upgradeable contracts for the MVP demonstration.

**Rationale:** Non-upgradeability keeps the deployed code easier to inspect and preserves the demonstrationâ€™s immutability story.

**Migration path:** If a critical defect is found, deploy corrected contracts and migrate through a documented process. Production may evaluate timelocked upgrade governance after a separate review.

## 10. Security and Governance Decisions

### ADR-026 â€” Role-based permissions

**Status:** `APPROVED`

**Decision:** Use OpenZeppelin `AccessControl` for minting, allowlist management, announcement creation, execution, treasury operations, and administrative control.

**Roles:**

```text
DEFAULT_ADMIN_ROLE
MINTER_ROLE
AGENT_ROLE
ANNOUNCER_ROLE
EXECUTOR_ROLE
TREASURY_ROLE
```

**Demo limitation:** One deployer wallet may hold multiple roles for convenience.

**Production direction:** Use separate operational accounts and multisignature governance with appropriate separation of duties.

### ADR-027 â€” Security baseline

**Status:** `APPROVED`

**Decision:** The MVP must use reentrancy protection, checked arithmetic, explicit role checks, allowlist restrictions, pause controls, execution guards, atomic transactions, and structured events.

**Required tests:**

- Unauthorized role actions.
- Reentrancy resistance.
- Duplicate execution.
- Superseded execution.
- Insufficient funding.
- Failed transaction rollback.
- Invalid burn attempts.
- Paused transfers.
- Arithmetic and rounding behavior.

## 11. Development and Quality Decisions

### ADR-028 â€” Local-first, test-first delivery

**Status:** `APPROVED`

**Decision:** Develop and validate locally before public testnet deployment. Implement the registry and contract invariants before the payment engine. Integrate the frontend after interfaces stabilize.

**Delivery order:**

```text
Repository foundation
    â†“
Token and payment currency
    â†“
Corporate-action registry
    â†“
Payment and redemption engine
    â†“
Indexer and database
    â†“
Frontend dashboard
    â†“
Local end-to-end demo
    â†“
Sepolia deployment
```

**Rationale:** This order isolates the highest-risk state transitions before UI and deployment complexity are introduced.

### ADR-029 â€” Prototype scope and production boundary

**Status:** `APPROVED`

**Decision:** AssetOps MVP is a technical prototype and public testnet demonstration, not a production-ready regulated securities platform.

**Excluded from MVP:**

- Legal offering approval.
- Real customer funds.
- Production KYC and AML.
- Tax and jurisdictional compliance.
- Regulated transfer-agent replacement.
- Production identity registry.
- Unlimited-holder payment scaling.

**Rationale:** Clear boundaries prevent technical demonstration claims from being mistaken for legal, regulatory, or production guarantees.

### ADR-030 â€” Develop-to-main Git workflow

**Status:** `APPROVED`

**Decision:** Use three area branchesâ€”`frontend`, `backend`, and `blockchain`â€”that integrate through pull requests into `develop`. Use `main` as the protected release branch.

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

**Branch responsibilities:**

| Branch       | Scope                                                                         |
| ------------ | ----------------------------------------------------------------------------- |
| `frontend`   | React dashboard, UI/UX, wallet flows, and demo interface                      |
| `backend`    | Indexer, database, query layer, and deployment scripts                        |
| `blockchain` | Solidity contracts, ABIs, contract tests, and security invariants             |
| `develop`    | Integrated development, end-to-end testing, and release-candidate preparation |
| `main`       | Stable release and approved deployment baseline                               |

**Rationale:** The model gives each team member a clear working area while ensuring that all areas are tested together before release.

**Rules:**

1. No direct commits to `frontend`, `backend`, `blockchain`, `develop`, or `main`.
2. Task branches are created from the relevant area branch.
3. Area pull requests must pass targeted tests and CI.
4. Area branches merge into `develop` only after area-owner review.
5. A release pull request from `develop` to `main` requires integrated lifecycle tests, frontend build checks, indexer checks, and demo rehearsal.
6. `main` must remain deployable and protected.

## 12. Change-Control Rules

A proposed change to an approved decision must include:

1. Decision ID being changed.
2. Current limitation or new requirement.
3. Alternatives considered.
4. Security and data implications.
5. Migration or deployment impact.
6. Affected contracts, APIs, schemas, and documents.
7. Test plan.
8. Rollback or recovery plan where applicable.
9. Review from the relevant area owner.
10. Updated status and date in this register.

Changes that require an updated decision record include:

- Changing the payment or holder-state model.
- Changing the announcement versioning model.
- Adding a proxy or upgrade mechanism.
- Replacing the ERC-20 baseline.
- Changing the indexerâ€™s authority or persistence model.
- Changing the redemption burn path.
- Adding real payment rails.
- Adding identity or compliance requirements.
- Changing deployment networks.
- Changing GitHub branch protection or AI review controls.

## 13. Decision Review Checklist

Before merging a change that affects an approved decision, reviewers should ask:

- Does the change preserve on-chain authority?
- Does it preserve auditability?
- Can a superseded announcement execute?
- Can an action execute twice?
- Can a failed transaction leave partial state?
- Can redemption burn only tokens that are actually held or explicitly authorized?
- Does the indexer remain rebuildable?
- Are integer arithmetic and rounding rules explicit?
- Are roles and trust boundaries still correct?
- Are the PRD, architecture, database, technology, and development documents still aligned?
- Are tests updated for the changed invariant?
- Are secrets excluded from the change?

## 14. References

[1]: ./PRD.md "AssetOps Product Requirements Document"
[2]: ./technology.md "AssetOps Master Technology Specification"
[3]: ./architecture.md "AssetOps System Architecture"
[4]: ./database.md "AssetOps Database and Data Model Specification"
[5]: ./development.md "AssetOps Development Plan and Workflow"
[6]: ./technicals.md "AssetOps Technical Specification"
[7]: https://docs.openzeppelin.com/contracts/5.x/ "OpenZeppelin Contracts Documentation"
[8]: https://hardhat.org/docs "Hardhat Documentation"
[9]: https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ "Ethereum ERC-20 Token Standard Documentation"
[10]: https://docs.github.com/en/pull-requests "GitHub Pull Request Documentation"
