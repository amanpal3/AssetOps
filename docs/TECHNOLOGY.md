# RWA Lifecycle Servicing — Master Technology Specification

**Project:** W3A — Make Tokenized Assets Work After Launch  
**Document:** Master Technology Specification  
**Status:** Project baseline  
**Primary development environment:** Antigravity IDE with Gemini CLI  
**Target blockchain:** Ethereum-compatible EVM network, initially Hardhat local and Sepolia testnet  
**Author:** Manus AI

## 1. Purpose

This document defines the technology stack, system boundaries, development workflow, security controls, testing standards, and deployment model for the RWA Lifecycle Servicing project.

The project provides lifecycle servicing for tokenized real-world assets. It supports current-holder payments, corrected corporate-action announcements, duplicate-payment prevention, and principal redemption. It does not attempt to implement a complete regulated securities infrastructure or a full ERC-1400 platform in the first release.

> **Core principle:** Token issuance is only the beginning. The system must continue to manage ownership, announcements, payments, amendments, redemption, and audit history after issuance.

## 2. Technology Summary

| Area                     | Selected technology                     | Responsibility                                                                          |
| ------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------- |
| Smart-contract language  | Solidity `^0.8.24`                      | Implement token, registry, payment, and redemption rules                                |
| Contract framework       | Hardhat                                 | Compile, test, deploy, debug, and manage contracts                                      |
| Contract libraries       | OpenZeppelin Contracts                  | Use established ERC-20, access-control, pausing, and reentrancy primitives              |
| Asset-token standard     | ERC-20 with ERC-1404-style restrictions | Represent the tokenized asset and restrict transfers to approved holders                |
| Payment-token standard   | ERC-20 mock stablecoin                  | Represent USDC-like payment currency during development and demonstration               |
| Local blockchain         | Hardhat Network                         | Fast deterministic development and integration testing                                  |
| Public test network      | Ethereum Sepolia                        | Public demonstration and explorer-verifiable transactions                               |
| Blockchain client        | Ethers.js or viem                       | Read blockchain state and submit signed transactions                                    |
| Frontend                 | React + Vite + TypeScript               | Build the lifecycle dashboard and demonstration interface                               |
| Wallet integration       | wagmi + viem                            | Connect EVM wallets and manage React blockchain state                                   |
| Styling                  | Tailwind CSS                            | Build the dashboard interface consistently                                              |
| Event history            | Ethers.js event indexer or The Graph    | Query announcements, versions, payments, and redemption events                          |
| Document anchoring       | IPFS-compatible storage                 | Store human-readable announcement documents and retain content hashes on-chain          |
| Development environment  | Antigravity IDE                         | Edit, inspect, run, and manage the project workspace                                    |
| AI development assistant | Gemini CLI                              | Support code exploration, implementation, testing, and documentation under human review |
| Source control           | Git and GitHub                          | Version control, collaboration, review, and CI                                          |
| Continuous integration   | GitHub Actions                          | Compile, test, lint, and validate pull requests                                         |

## 3. System Architecture

The system is divided into four on-chain contracts, one optional indexing layer, and one frontend application.

```text
┌──────────────────────────────────────────────────────┐
│ React + Vite + TypeScript Dashboard                  │
│ wagmi + viem + Tailwind CSS                          │
└─────────────────────────┬────────────────────────────┘
                          │ wallet reads and transactions
                          ▼
┌──────────────────────────────────────────────────────┐
│ EVM Blockchain                                       │
│                                                      │
│  SecurityToken                                       │
│       │ balances and holder state                    │
│       ▼                                              │
│  CorporateActionRegistry                             │
│       │ active-version validation                    │
│       ▼                                              │
│  PaymentExecutor                                     │
│       │ payment and redemption transfers             │
│       ▼                                              │
│  PaymentCurrency                                     │
└─────────────────────────┬────────────────────────────┘
                          │ emitted events
                          ▼
┌──────────────────────────────────────────────────────┐
│ Event Indexer                                        │
│ Ethers.js indexer or The Graph                       │
└─────────────────────────┬────────────────────────────┘
                          │ queryable history
                          ▼
┌──────────────────────────────────────────────────────┐
│ Announcement and payment history in the dashboard    │
└──────────────────────────────────────────────────────┘

Announcement documents are stored off-chain in IPFS-compatible storage.
The document hash is recorded in the corporate-action announcement.
```

## 4. Smart-Contract Layer

### 4.1 SecurityToken.sol

`SecurityToken.sol` is an OpenZeppelin-based ERC-20 token representing a tokenized bond, share, or other real-world asset.

The contract provides minting, transfers, approvals, `transferFrom`, balance queries, total-supply queries, and burning. It also maintains an allowlist and a holder list for the small-holder demonstration.

The token uses an ERC-1404-style restriction interface rather than implementing the full ERC-1400 family. The restriction layer is intentionally limited to the project’s demonstration needs: only approved holders may receive or transfer the asset, and authorized operators may pause activity.

The token balance is the authoritative value for ownership. The holder list is an enumeration aid for the demonstration and is not a separate financial source of truth.

### 4.2 PaymentCurrency.sol

`PaymentCurrency.sol` is a mock ERC-20 payment token. It represents a USDC-like stablecoin during local development and Sepolia demonstration.

The contract supports controlled minting for test funding. It does not model banking, foreign-exchange, settlement-finality, or regulated stablecoin issuance. In production, it could be replaced by an approved stablecoin, tokenized deposit, central-bank money, or an integrated bank payment rail.

### 4.3 CorporateActionRegistry.sol

`CorporateActionRegistry.sol` stores corporate-action announcements as append-only records.

It supports coupon, interest, and redemption actions. Each action contains the asset address, action type, financial parameters, record date, payable date, version number, superseded-version link, document hash, status, announcer, and creation timestamp.

An amendment never overwrites the previous announcement. It creates a new version, marks the previous active version as `SUPERSEDED`, and updates the active-version pointer.

The registry must enforce the following invariants:

| Invariant               | Required behavior                                                            |
| ----------------------- | ---------------------------------------------------------------------------- |
| Append-only history     | Existing announcement versions remain stored and queryable                   |
| Active-version control  | Only the latest active version may execute                                   |
| Superseded immutability | A superseded version cannot become active again                              |
| Execution finality      | An executed version cannot be executed again or amended into a payable state |
| Version linkage         | Every amendment points to the version it supersedes                          |
| Event visibility        | Creation, amendment, supersession, execution, and cancellation emit events   |

### 4.4 PaymentExecutor.sol

`PaymentExecutor.sol` validates and executes lifecycle payments.

For the demonstration, it uses a bounded push-payment model. The executor enumerates the token’s holder list, reads each holder’s current balance at execution time, calculates the entitlement, and transfers payment currency.

The executor must validate:

1. The announcement exists.
2. The action type matches the requested execution function.
3. The version is the active version.
4. The payable date has passed.
5. The action has not already executed.
6. The treasury has approved and funded the required amount.
7. The holder set and balances are readable.

The executor uses `ReentrancyGuard` and follows checks-effects-interactions ordering. A failed transaction must revert all state changes, including the execution flag.

For redemption, the executor pays the current holders and burns the redeemed asset tokens through an authorized token burn function. The implementation must not attempt to burn tokens from the executor address when the tokens are still held by investors.

## 5. Holder-State Model

The first release uses **live execution-time balances** as the authoritative holder state.

```text
Token balance at execution time = balance used for payment calculation
```

A holder list is maintained on-chain for the demonstration. The list may retain addresses whose balances later reach zero. Payment execution skips zero-balance addresses.

This model is deterministic and suitable for the planned demonstration size of approximately ten holders. It is not suitable for unbounded holder populations because a single transaction cannot safely iterate over an indefinitely large list.

The production scaling path is a snapshot-and-claim model:

1. Capture the eligible holder state off-chain or through a controlled snapshot process.
2. Build a Merkle tree containing holder addresses and entitlements.
3. Store the Merkle root on-chain.
4. Allow each holder to claim with a Merkle proof.
5. Track claims with an action-specific claim mapping.

The direct push model is therefore the demo implementation, while the Merkle model is the documented production scaling strategy.

## 6. Corporate-Action Lifecycle

The required lifecycle is:

```text
Create asset
    ↓
Distribute asset tokens
    ↓
Announce coupon or interest action
    ↓
Transfer tokens between holders
    ↓
Amend the announcement
    ↓
Mark the old version superseded
    ↓
Execute only the corrected active version
    ↓
Reject duplicate execution
    ↓
Announce redemption
    ↓
Pay principal and burn tokens
    ↓
Record the complete audit history
```

The demonstration must prove the following scenario:

| Stage                 | Expected state                                              |
| --------------------- | ----------------------------------------------------------- |
| Initial distribution  | Alice owns 500 tokens and Bob owns 500 tokens               |
| Mid-cycle transfer    | Bob transfers 200 tokens to Charlie                         |
| Current ownership     | Alice owns 500, Bob owns 300, and Charlie owns 200          |
| Original announcement | Coupon version 1 has a 5% rate                              |
| Amendment             | Coupon version 2 has a 4% rate and version 1 is superseded  |
| Payment               | Version 2 pays according to current balances                |
| Replay attempt        | The second execution reverts with an already-executed error |
| Redemption            | Principal is paid and redeemed asset tokens are burned      |

## 7. Roles and Permissions

The contracts use OpenZeppelin `AccessControl`. The demo may use a single deployer wallet for convenience, but this is a documented limitation and not a production recommendation.

| Role                 | Responsibility                                                       |
| -------------------- | -------------------------------------------------------------------- |
| `DEFAULT_ADMIN_ROLE` | Assign and revoke contract roles and manage administrative authority |
| `MINTER_ROLE`        | Mint asset tokens or payment currency according to contract policy   |
| `AGENT_ROLE`         | Manage the asset allowlist and operational token controls            |
| `ANNOUNCER_ROLE`     | Create and amend corporate actions                                   |
| `EXECUTOR_ROLE`      | Execute coupon, interest, and redemption actions                     |
| `TREASURY_ROLE`      | Control or authorize treasury funding operations                     |

For production, administrative authority should be moved to a multisignature wallet with an appropriate operational separation of duties. The project does not treat a single externally owned account as an adequate production security model.

## 8. Frontend Technology

The frontend is a React application built with Vite and TypeScript.

The frontend should expose five primary views:

| View               | Purpose                                                                         |
| ------------------ | ------------------------------------------------------------------------------- |
| Holder Registry    | Show token holders, balances, total supply, and ownership changes               |
| Announcements      | Show active actions and all announcement versions                               |
| History            | Show creation, amendment, supersession, payment, redemption, and failure events |
| Payment Detail     | Show per-holder entitlement calculations and payment transaction links          |
| Demo Control Panel | Guide the live scenario and provide a visible duplicate-payment test            |

The frontend must distinguish between read operations and write operations. Read operations query public blockchain state or indexed events. Write operations require a connected wallet and user signature.

The frontend should display transaction states explicitly:

```text
Idle → Wallet request → Pending → Confirmed → Failed
```

A failed duplicate execution is an expected demonstration result and should be presented as a successful security outcome rather than as an unexplained application error.

## 9. Development Environment: Antigravity IDE and Gemini CLI

### 9.1 Antigravity IDE

Antigravity IDE is the team’s primary workspace for editing and operating the project. It is used to inspect the repository, edit Solidity and TypeScript files, run commands, review test output, and manage the project documentation.

The IDE is a development tool, not a production runtime dependency. The deployed application must remain buildable and operable without requiring the IDE.

The repository should be organized so that Antigravity opens the project root and exposes the following areas:

```text
packages/contracts
packages/indexer
packages/frontend
docs
scripts
.github/workflows
```

### 9.2 Gemini CLI

Gemini CLI is used as an AI-assisted development tool for repository exploration, code generation, refactoring, test creation, debugging, and documentation assistance.

Gemini CLI must operate under the following project controls:

1. Read the relevant project documentation before proposing architecture changes.
2. Make small, reviewable changes instead of replacing large areas of the repository without explanation.
3. Run the relevant tests after contract changes.
4. Never treat generated code as trusted until a human reviews it.
5. Never expose private keys, seed phrases, API keys, or environment secrets in prompts, logs, commits, or generated documentation.
6. Do not deploy to a public network without reviewing the exact network, account, contract addresses, and deployment configuration.
7. Keep architectural changes documented in `docs/DESIGN_DECISIONS.md`.

Gemini CLI is an assistant in the development workflow. It does not replace Solidity review, security review, test execution, or deployment authorization.

### 9.3 Recommended AI-assisted workflow

```text
Read project documentation
        ↓
Inspect existing files and tests
        ↓
State the proposed change
        ↓
Implement the smallest coherent change
        ↓
Compile and run targeted tests
        ↓
Run the full test suite
        ↓
Review the diff manually
        ↓
Commit with a focused message
```

## 10. Project Repository Structure

```text
w3a-rwa-lifecycle/
├── README.md
├── technology.md
├── package.json
├── packages/
│   ├── contracts/
│   │   ├── contracts/
│   │   │   ├── SecurityToken.sol
│   │   │   ├── PaymentCurrency.sol
│   │   │   ├── CorporateActionRegistry.sol
│   │   │   ├── PaymentExecutor.sol
│   │   │   └── interfaces/
│   │   ├── test/
│   │   ├── scripts/
│   │   ├── hardhat.config.ts
│   │   └── package.json
│   ├── indexer/
│   │   ├── src/
│   │   ├── schema.graphql
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── lib/
│       └── package.json
├── docs/
│   ├── DESIGN_DECISIONS.md
│   ├── DEMO_SCRIPT.md
│   └── SECURITY_MODEL.md
├── scripts/
│   ├── deploy.ts
│   └── seed-demo.ts
└── .github/
    └── workflows/
        └── ci.yml
```

## 11. Testing Strategy

Testing is mandatory because payment and redemption contracts control financial state transitions.

| Test level        | Tools                                                    | Main objective                                                               |
| ----------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Unit tests        | Hardhat, Mocha, Chai, Ethers.js                          | Verify individual contract functions and permissions                         |
| Integration tests | Hardhat Network                                          | Verify the complete announcement-to-payment lifecycle                        |
| Invariant tests   | Hardhat or Foundry                                       | Verify that superseded actions cannot execute and actions cannot pay twice   |
| Frontend tests    | TypeScript test tooling selected by the frontend package | Verify calculation displays, transaction states, and expected error handling |
| Static analysis   | Solidity linting and optional Slither                    | Identify common contract defects before deployment                           |
| Deployment checks | Hardhat scripts and CI                                   | Confirm network, addresses, roles, and configuration                         |

The minimum integration test must execute:

```text
Mint → distribute → announce v1 → transfer → amend to v2 → execute v2 → verify payments → replay and revert → redeem → burn
```

Important security invariants include:

- A superseded version cannot execute.
- An executed version cannot execute again.
- A failed execution does not permanently set the executed flag.
- Total payments cannot exceed the funded amount.
- Redemption cannot burn more tokens than the holder owns.
- Unauthorized accounts cannot mint, amend, execute, or manage the allowlist.
- Paused transfers cannot move asset tokens.

## 12. Security Standards

The initial implementation must use the following controls:

| Control                  | Implementation                                                                 |
| ------------------------ | ------------------------------------------------------------------------------ |
| Reentrancy protection    | OpenZeppelin `ReentrancyGuard` on payment and redemption entry points          |
| Permission control       | OpenZeppelin `AccessControl` with explicit role checks                         |
| Arithmetic safety        | Solidity `^0.8.24` checked arithmetic and bounded financial parameters         |
| State-transition safety  | Checks-effects-interactions ordering and transaction atomicity                 |
| Transfer restriction     | Allowlist and pause controls on the asset token                                |
| Replay protection        | Action-specific execution mapping and terminal registry status                 |
| Treasury protection      | Allowance and balance validation before payout                                 |
| Auditability             | Structured events for all important state changes                              |
| Key protection           | Environment variables for RPC URLs and private deployment credentials          |
| Public deployment safety | Test locally and review the deployment configuration before Sepolia deployment |

Private keys and seed phrases must never be committed to Git, placed in Markdown files, or pasted into Gemini CLI prompts.

## 13. Deployment Model

### Local development

The local workflow uses Hardhat Network. It provides deterministic accounts, fast block production, time manipulation for payable dates, and repeatable integration tests.

### Sepolia demonstration

The public demonstration deploys the contracts to Ethereum Sepolia. The deployment script must record:

- Network name and chain ID.
- Contract addresses.
- Deployer address.
- Role assignments.
- Token configuration.
- Payment currency configuration.
- Transaction hashes.
- Block numbers.

The deployment artifact should be stored in a non-secret project file such as `demo-state.md` or a JSON deployment manifest. Private keys must not be included.

### Production direction

A production deployment would require additional review and infrastructure, including multisignature administration, timelocks, audited contracts, regulated identity and transfer controls, operational monitoring, treasury controls, recovery procedures, and a legally reviewed asset-servicing model.

## 14. CI/CD Requirements

Every pull request should run:

```text
Install dependencies
→ Compile contracts
→ Run contract unit tests
→ Run integration tests
→ Run frontend type checks
→ Run frontend build
→ Run linting
→ Check for accidental secrets
```

A public deployment should only be performed from a reviewed commit. Deployment scripts should fail if the selected network, chain ID, or required environment variables do not match the expected configuration.

## 15. Technology Decisions and Boundaries

### Why ERC-20 instead of full ERC-1400?

The project’s primary innovation is lifecycle servicing rather than partitioned security-token functionality. ERC-20 provides the required balance, transfer, approval, and burn primitives with significantly lower implementation complexity. ERC-1400 or ERC-3643 can be evaluated later if the project requires partitions, claims, identity registries, or multi-jurisdiction compliance.

### Why use a push-payment model for the demo?

A push-payment model makes the five-minute demonstration easy to understand because one authorized transaction pays every current holder. Its limitation is transaction-size growth as the holder population increases. A Merkle claim model is the intended scaling path.

### Why keep the holder list on-chain?

The direct executor needs a deterministic holder enumeration source for a small demonstration. The list is simple to query and works with the current token contract. It is not presented as a solution for unlimited holder populations.

### Why use a mock payment token?

A mock ERC-20 payment token makes local and Sepolia testing deterministic. It avoids representing a real stablecoin or bank settlement process while preserving the important behavior: allowance, treasury funding, transfers, and verifiable balances.

### Why use an indexer?

The blockchain is authoritative, but querying complex historical relationships directly from contract storage is inefficient for a dashboard. An indexer transforms emitted events into queryable announcement, version, holder, and payment records without changing on-chain truth.

## 16. Definition of Done

The technology implementation is ready for the first public demonstration when:

1. The contracts compile with the approved Solidity version.
2. All unit and integration tests pass.
3. The full lifecycle scenario works on Hardhat Network.
4. The amended version is the only version paid.
5. The original version remains queryable and is marked superseded.
6. A duplicate payment attempt reverts.
7. A superseded-version payment attempt reverts.
8. Redemption pays holders and burns the asset tokens.
9. The frontend displays balances, versions, payments, and audit events.
10. The Sepolia deployment addresses and transaction hashes are recorded without secrets.
11. The project can be opened and operated from Antigravity IDE.
12. Gemini CLI changes have been manually reviewed and validated by tests.

## 17. References

[1]: https://docs.soliditylang.org/en/latest/ "Solidity Documentation"
[2]: https://hardhat.org/docs "Hardhat Documentation"
[3]: https://docs.openzeppelin.com/contracts/5.x/ "OpenZeppelin Contracts Documentation"
[4]: https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ "Ethereum ERC-20 Token Standard Documentation"
[5]: https://docs.ethers.org/ "Ethers.js Documentation"
[6]: https://viem.sh/ "viem Documentation"
[7]: https://wagmi.sh/ "wagmi Documentation"
[8]: https://vite.dev/guide/ "Vite Documentation"
[9]: https://react.dev/ "React Documentation"
[10]: https://thegraph.com/docs/en/ "The Graph Documentation"
[11]: https://docs.ipfs.tech/ "IPFS Documentation"
[12]: https://docs.github.com/en/actions "GitHub Actions Documentation"
[13]: https://ai.google.dev/gemini-api/docs "Google Gemini Documentation"
