# AssetOps â€” System Architecture

**Project:** AssetOps  
**Purpose:** Lifecycle operations for tokenized real-world assets  
**Status:** MVP architecture baseline  
**Related documents:** `PRD.md`, `technology.md`, `database.md`

## 1. Architecture Summary

AssetOps is a hybrid blockchain application. Smart contracts maintain financial ownership, lifecycle state, authorization, execution guards, and audit events. A frontend provides operator and investor workflows. An indexer converts blockchain events into efficient history queries for the dashboard.

The architecture follows one central rule:

> **Blockchain state is authoritative for ownership, corporate-action status, payment execution, and redemption. Off-chain services improve queryability and presentation but cannot replace on-chain truth.**

The MVP supports a small holder population through direct push payments. The production scaling path uses snapshot-based Merkle claims for large holder populations.

## 2. High-Level Architecture

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        AssetOps Dashboard                   â”‚
â”‚  React + Vite + TypeScript + wagmi + viem + Tailwind CSS    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                wallet reads, signatures, transactions
                               â”‚
                               â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     EVM Blockchain Layer                    â”‚
â”‚                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ SecurityToken    â”‚â”€â”€â”€â”€â–¶â”‚ CorporateActionRegistry       â”‚  â”‚
â”‚  â”‚ ERC-20 asset     â”‚     â”‚ announcements and versions   â”‚  â”‚
â”‚  â”‚ holder balances  â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚                  â”‚
â”‚           â”‚                              â–¼                  â”‚
â”‚           â”‚              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶â”‚ PaymentExecutor               â”‚  â”‚
â”‚                          â”‚ coupon and redemption engine  â”‚  â”‚
â”‚                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                         â”‚                  â”‚
â”‚                                         â–¼                  â”‚
â”‚                          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚                          â”‚ PaymentCurrency              â”‚  â”‚
â”‚                          â”‚ mock USDC-style ERC-20       â”‚  â”‚
â”‚                          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚ events
                               â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         Indexer Layer                        â”‚
â”‚ Ethers.js event indexer or The Graph + query database        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚ read models
                               â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     API / Query Layer                        â”‚
â”‚ Optional REST or GraphQL service for dashboard queries       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                               â–¼
                         AssetOps Dashboard

Announcement documents are stored in IPFS-compatible storage.
Only the content hash and related metadata are anchored on-chain.
```

## 3. Architectural Principles

### 3.1 On-chain authority

The blockchain is the source of truth for token balances, total supply, corporate-action versions, status transitions, payment execution, and redemption state.

The indexer may be rebuilt from blockchain events. Rebuilding the index must reproduce the same financial history.

### 3.2 Append-only corporate actions

A correction creates a new version. It does not overwrite the original announcement. The new version points to the version it supersedes, and the registry updates the active-version pointer.

```text
CA-001 Version 1 â€” 5% â€” SUPERSEDED
       â”‚
       â””â”€â”€ superseded by

CA-001 Version 2 â€” 4% â€” ACTIVE
```

### 3.3 Explicit state transitions

Contracts shall reject invalid transitions rather than relying on frontend behavior. A superseded action cannot become active again. An executed action cannot execute again.

### 3.4 Atomic financial execution

A payment or redemption either completes as one blockchain transaction or reverts completely. The execution guard, treasury transfer, holder payments, and registry status update must not be left partially completed.

### 3.5 Separation of writes and reads

Write operations require a wallet signature and execute on-chain. Read operations can use direct contract calls or indexed data. The frontend shall not present an indexed record as final until the corresponding transaction is confirmed.

### 3.6 Small-holder MVP with documented scaling path

The MVP uses an on-chain holder list and push payments for a small demonstration. Large populations require a Merkle snapshot and claim model rather than a single transaction that loops through every holder.

## 4. Core Components

### 4.1 SecurityToken

The asset token is an OpenZeppelin ERC-20 extension with access control, pause capability, allowlist checks, and holder enumeration.

Responsibilities:

- Mint approved asset tokens.
- Transfer tokens between approved holders.
- Enforce pause and transfer restrictions.
- Track current balances.
- Track known holder addresses for MVP enumeration.
- Burn tokens during authorized redemption.
- Emit standard ERC-20 and project-specific events.

The contract should expose an explicit authorized burn path for redemption. The payment executor must not assume it can burn investor-owned tokens through `burnFrom` without the required allowance or role.

### 4.2 PaymentCurrency

The payment currency is an ERC-20 token used for coupon and principal payments in development and the Sepolia demonstration.

Responsibilities:

- Mint test payment currency to the treasury.
- Support allowance from the treasury to the executor.
- Transfer payment currency to holders.
- Expose balances for treasury validation.

### 4.3 CorporateActionRegistry

The registry is the lifecycle and versioning authority for announcements.

Responsibilities:

- Create corporate actions.
- Store each version permanently.
- Amend active actions by appending a new version.
- Track the active version.
- Mark previous versions superseded.
- Mark executed actions terminal.
- Allow the executor to mark the executed version.
- Emit structured lifecycle events.

### 4.4 PaymentExecutor

The executor performs coupon, interest, and redemption actions.

Responsibilities:

- Validate action type and active status.
- Validate payable date.
- Enforce one-time execution.
- Validate treasury funding.
- Read holder balances according to the MVP holder-state model.
- Calculate integer-based entitlements.
- Transfer payment currency.
- Burn redeemed asset tokens.
- Emit aggregate and per-holder payment events.

### 4.5 Indexer

The indexer listens to contract events and creates queryable read models.

Responsibilities:

- Index asset and holder events.
- Index announcement versions and relationships.
- Index payment and redemption events.
- Track transaction status and block references.
- Support history and dashboard queries.
- Rebuild state from a configured deployment block when necessary.

The indexer is not authorized to alter contract state and must not be treated as a financial authority.

### 4.6 Frontend

The frontend provides role-aware workflows for issuers, treasury operators, holders, auditors, and demo operators.

Primary areas:

- Asset overview.
- Holder registry.
- Announcement creation and amendment.
- Version history.
- Payment execution.
- Redemption execution.
- Audit timeline.
- Transaction status and explorer links.

## 5. Contract Dependency Graph

```text
SecurityToken
    â”‚
    â”‚ asset address and balances
    â–¼
CorporateActionRegistry
    â”‚
    â”‚ active announcement and financial parameters
    â–¼
PaymentExecutor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ PaymentCurrency
    â”‚                                  â”‚
    â”‚ authorized burn                  â”‚ payment transfers
    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

The registry does not transfer funds. The payment executor does not create or amend announcements. The token does not decide corporate-action terms. This separation reduces responsibility overlap and makes each component easier to test.

## 6. Main Data Flows

### 6.1 Create and distribute an asset

```text
Issuer wallet
    â†“ mint transaction
SecurityToken
    â†“ Transfer events and balance updates
Holder registry
    â†“ indexed read model
AssetOps dashboard
```

### 6.2 Create an announcement

```text
Issuer prepares announcement document
    â†“ document uploaded to IPFS-compatible storage
Document hash returned
    â†“ announce transaction
CorporateActionRegistry
    â†“ AnnouncementCreated event
Indexer
    â†“
Dashboard displays Version 1 as ACTIVE
```

### 6.3 Amend an announcement

```text
Issuer submits correction
    â†“ amend transaction
Registry appends Version 2
    â”œâ”€â”€ Version 1 becomes SUPERSEDED
    â”œâ”€â”€ Version 2 becomes ACTIVE
    â””â”€â”€ supersedes link is stored
             â†“ events
        Indexer and dashboard
```

### 6.4 Execute a coupon

```text
Treasury approves executor
    â†“
Executor validates active version and payable date
    â†“
Executor reads current holder balances
    â†“
Executor calculates integer entitlements
    â†“
PaymentCurrency transfers to holders
    â†“
Registry marks exact version EXECUTED
    â†“
Payment and journal events are emitted
```

If any required step fails, the transaction reverts atomically.

### 6.5 Execute redemption

```text
Executor validates redemption action
    â†“
Executor reads current holder balances
    â†“
Executor calculates principal
    â†“
Treasury funding is validated
    â†“
PaymentCurrency transfers to holders
    â†“
Authorized asset-token burn occurs
    â†“
Registry marks redemption EXECUTED
    â†“
Redemption and burn events are indexed
```

## 7. State Machines

### 7.1 Corporate-action state machine

```text
                    announce()
                        â”‚
                        â–¼
                  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                  â”‚ ACTIVE   â”‚
                  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
                       â”‚
          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
          â”‚ amend()                 â”‚ execute()
          â–¼                         â–¼
   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚ SUPERSEDED   â”‚          â”‚ EXECUTED     â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       terminal                  terminal
```

Cancellation may be supported only while the action is active and before execution. The final implementation must define whether cancellation is required for the MVP; it must not create an undocumented path that bypasses version or execution rules.

### 7.2 Transaction state machine

```text
Ready
  â†“ wallet signature
Submitted
  â†“ mined
Confirmed

Submitted â”€â”€ failure/revert â”€â”€â–¶ Failed
```

The UI must distinguish a rejected duplicate payment from an infrastructure failure. A duplicate rejection is an expected security behavior.

## 8. Roles and Trust Boundaries

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Admin / governance â”‚ assigns roles and emergency authority
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
          â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Issuer / announcer â”‚   â”‚ Treasury / executor  â”‚
â”‚ create and amend   â”‚   â”‚ fund and execute     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
          â”‚                         â”‚
          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â–¼
                Smart contracts
                       â”‚
                       â–¼
                    Holders
```

For the demonstration, one deployer account may hold multiple roles. Production deployment should separate administrative, announcement, treasury, and execution authority and should use multisignature governance.

## 9. Security Architecture

The MVP shall apply the following controls:

| Threat                         | Control                                              |
| ------------------------------ | ---------------------------------------------------- |
| Unauthorized minting           | `MINTER_ROLE`                                        |
| Unauthorized announcements     | `ANNOUNCER_ROLE`                                     |
| Unauthorized payment execution | `EXECUTOR_ROLE`                                      |
| Unauthorized allowlist changes | `AGENT_ROLE`                                         |
| Reentrancy during payouts      | OpenZeppelin `ReentrancyGuard`                       |
| Duplicate payout               | Action-version execution mapping and terminal status |
| Old-version payout             | Active-version validation and superseded status      |
| Partial financial state        | Atomic transaction reversion                         |
| Arithmetic errors              | Solidity checked arithmetic and basis points         |
| Transfer to unknown holder     | Allowlist restriction                                |
| Emergency transfer activity    | Pausable control                                     |
| Secret leakage                 | Environment variables and secret scanning            |
| Indexer corruption             | Rebuildable event-derived read model                 |

## 10. Deployment Topology

### Local

```text
Antigravity IDE / Gemini CLI
        â†“
Hardhat scripts and tests
        â†“
Hardhat Network
        â†“
Local frontend and optional local indexer
```

### Sepolia

```text
Developer environment
        â†“ RPC provider
Ethereum Sepolia
        â”œâ”€â”€ AssetOps contracts
        â”œâ”€â”€ explorer-visible transactions
        â””â”€â”€ testnet payment currency
                â†“ events
           indexer and dashboard
```

The deployment manifest must record chain ID, contract addresses, deployment blocks, role assignments, and seed transactions without recording private keys.

## 11. Architecture Decisions

| Decision                   | Rationale                                                             |
| -------------------------- | --------------------------------------------------------------------- |
| ERC-20 asset token         | Sufficient for the MVP and keeps focus on lifecycle servicing         |
| On-chain registry          | Makes versions and status transitions independently verifiable        |
| Live balance model for MVP | Demonstrates ownership changes between announcement and execution     |
| Push payments for MVP      | Easy to demonstrate with a small holder population                    |
| Merkle claims for scale    | Avoids unbounded on-chain iteration for large holder sets             |
| Event-derived indexer      | Provides efficient history queries without moving authority off-chain |
| Mock payment currency      | Enables deterministic local and testnet demonstrations                |
| Non-upgradeable baseline   | Keeps the demo contracts auditable and avoids proxy complexity        |

## 12. Architecture Acceptance Criteria

The architecture is accepted when:

- Each core contract has one clearly defined responsibility.
- The registry stores all versions without overwriting prior records.
- The executor can pay only the active payable version.
- A replay attempt cannot transfer funds.
- Redemption uses a valid authorized burn path.
- The indexer can be rebuilt from emitted events.
- The frontend can display both current state and historical state.
- Local and Sepolia deployments use the same contract interfaces.
- No off-chain component can silently change financial state.

## 13. Team Delivery Architecture

AssetOps is maintained by three contributors in a shared GitHub repository. The source-control workflow is part of the delivery architecture because contract, indexer, frontend, and documentation changes must remain synchronized.

| Area                                                     | Primary owner | Required collaborator                                                  |
| -------------------------------------------------------- | ------------- | ---------------------------------------------------------------------- |
| Smart contracts and security tests                       | Member A      | Member B for registry and integration review                           |
| Registry integration, indexer, database, and deployments | Member B      | Member A for contract interfaces and Member C for dashboard data needs |
| Frontend, demo workflow, and product documentation       | Member C      | Member A and B for end-to-end integration                              |

The team uses Antigravity IDE for workspace operations, Gemini CLI for focused implementation assistance, and Claude models for independent review, threat modeling, and design critique. AI tools may propose or generate changes, but only human-reviewed code that passes CI may be merged.

The GitHub branch flow is:

```text
Feature branch
    â†“
Focused implementation
    â†“
Targeted tests
    â†“
Independent Gemini or Claude review
    â†“
Pull request
    â†“
Area-owner approval
    â†“
CI checks
    â†“
Protected-branch merge
```

No contributor or AI tool may bypass review for changes involving payment calculations, corporate-action state transitions, redemption burns, role permissions, database migrations, or deployment configuration.

## 14. Architecture References

[1]: ./PRD.md "AssetOps Product Requirements Document"
[2]: ./technology.md "AssetOps Master Technology Specification"
[3]: ./database.md "AssetOps Database and Data Model Specification"
[4]: ./technicals.md "AssetOps Technical Specification"

## 13. References

[1]: ./PRD.md "AssetOps Product Requirements Document"
[2]: ./technology.md "AssetOps Master Technology Specification"
[3]: ./database.md "AssetOps Database and Data Model Specification"
[4]: ./technicals.md "AssetOps Technical Specification"
[5]: https://docs.openzeppelin.com/contracts/5.x/ "OpenZeppelin Contracts Documentation"
[6]: https://hardhat.org/docs "Hardhat Documentation"
[7]: https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ "Ethereum ERC-20 Token Standard Documentation"
