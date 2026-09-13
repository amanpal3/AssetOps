# AssetOps â€” Master Testing Plan

**Project:** AssetOps â€” The Operations Layer for Tokenized Assets  
**Document:** Master Testing Plan  
**Status:** MVP quality baseline  
**Audience:** Blockchain, backend, frontend, QA, and release reviewers

## 1. Purpose

This document defines how AssetOps will be tested before merging code into `develop` and before releasing `develop` into `main`.

AssetOps handles token ownership, corporate-action announcements, payments, amendments, redemption, and token burning. Testing must therefore verify not only that individual functions work, but also that the complete financial lifecycle is correct, atomic, auditable, and resistant to duplicate execution.

> **Quality principle:** No payment or redemption feature is complete until its successful path, failed path, replay path, authorization path, and audit path are tested.

## 2. Testing Objectives

The testing program must prove that:

1. Only authorized accounts can perform privileged operations.
2. Asset balances remain the authoritative holder state.
3. Allowlisted transfers behave correctly.
4. Announcement versions are append-only.
5. Superseded versions cannot execute.
6. Only the active version can execute.
7. Payment calculations use the documented current-balance model.
8. Treasury balance and allowance are validated before payment.
9. A successful action cannot execute twice.
10. A failed transaction does not permanently lock an action.
11. Redemption pays holders and burns redeemed tokens.
12. Blockchain events contain sufficient audit information.
13. The backend indexer is idempotent and rebuildable.
14. The frontend shows accurate transaction states and errors.
15. The complete CA-001 demonstration works from a clean deployment.

## 3. Testing Scope

### 3.1 In scope

- Solidity smart contracts.
- Contract interfaces and events.
- Role and permission behavior.
- ERC-20 token behavior used by the MVP.
- Corporate-action versioning.
- Coupon and interest payments.
- Duplicate execution prevention.
- Redemption and authorized burning.
- Backend event ingestion.
- Database projections and rebuilds.
- REST query endpoints.
- Frontend read and write flows.
- Wallet and network states.
- Local Hardhat demonstration.
- Sepolia release verification.
- Security and static analysis checks.

### 3.2 Out of scope for MVP

- Production banking settlement.
- Real customer funds.
- Full KYC, AML, tax, and jurisdictional compliance.
- Unlimited-holder payout performance.
- Full ERC-1400 or ERC-3643 behavior.
- Formal verification of every contract path.
- Production disaster recovery beyond documented testnet procedures.

## 4. Testing Strategy

AssetOps uses layered testing:

```text
Static checks
    â†“
Unit tests
    â†“
Contract integration tests
    â†“
Backend and database tests
    â†“
Frontend component and flow tests
    â†“
End-to-end local demo
    â†“
Sepolia smoke test
    â†“
Release review
```

Each layer has a different purpose. Passing one layer does not replace the others.

## 5. Test Environments

| Environment            | Purpose                                                          | Data source                 | Release authority |
| ---------------------- | ---------------------------------------------------------------- | --------------------------- | ----------------- |
| Local static checks    | Formatting, type checks, linting, secret scanning                | Repository files            | Pull request      |
| Hardhat Network        | Fast deterministic contract tests and full lifecycle integration | Fresh local deployment      | `develop` merge   |
| Local indexer database | Event ingestion, queries, rebuild tests                          | Hardhat events              | `develop` merge   |
| Local frontend         | Wallet flows and dashboard behavior                              | Local contracts and indexer | `develop` merge   |
| Sepolia                | Public smoke test and demonstration                              | Reviewed deployment         | `main` release    |

Tests must use isolated accounts and reset state between scenarios unless a test explicitly verifies sequential lifecycle behavior.

## 6. Test Data and Actors

### 6.1 Demo actors

| Actor                | Purpose                            | Expected authority                          |
| -------------------- | ---------------------------------- | ------------------------------------------- |
| Deployer/Admin       | Deploy contracts and assign roles  | Administrative roles during demo            |
| Issuer               | Create and amend actions           | `ANNOUNCER_ROLE`                            |
| Treasury             | Fund payment execution             | Payment-currency holder and allowance owner |
| Executor             | Execute payments and redemption    | `EXECUTOR_ROLE`                             |
| Alice                | Initial holder                     | Whitelisted holder                          |
| Bob                  | Initial holder and transfer sender | Whitelisted holder                          |
| Charlie              | Transfer recipient                 | Whitelisted holder                          |
| Unauthorized account | Negative tests                     | No privileged roles                         |

A single deployer may hold multiple roles in the demonstration, but tests should use separate signers whenever role separation is being verified.

### 6.2 Primary demo balances

```text
Total supply: 1,000 DBT
Alice:        500 DBT
Bob:          500 DBT
Charlie:        0 DBT
```

After transfer:

```text
Alice:        500 DBT
Bob:          300 DBT
Charlie:      200 DBT
```

After the corrected 4% coupon:

```text
Alice:         20 payment tokens
Bob:           12 payment tokens
Charlie:        8 payment tokens
Total:         40 payment tokens
```

## 7. Test Naming and Organization

Use descriptive test names that identify the actor, action, and expected result.

```text
should allow an announcer to amend an active coupon
should preserve version one after amendment
should reject execution of a superseded version
should calculate payments from balances at execution time
should revert duplicate execution without transferring funds
```

Recommended structure:

```text
packages/contracts/test/
â”œâ”€â”€ SecurityToken.test.ts
â”œâ”€â”€ PaymentCurrency.test.ts
â”œâ”€â”€ CorporateActionRegistry.test.ts
â”œâ”€â”€ PaymentExecutor.test.ts
â”œâ”€â”€ lifecycle.integration.test.ts
â”œâ”€â”€ redemption.integration.test.ts
â””â”€â”€ invariants.test.ts

packages/indexer/test/
â”œâ”€â”€ event-handlers.test.ts
â”œâ”€â”€ projections.test.ts
â”œâ”€â”€ rebuild.test.ts
â””â”€â”€ api.test.ts

packages/frontend/src/
â”œâ”€â”€ components/**/*.test.tsx
â””â”€â”€ flows/**/*.test.tsx
```

## 8. Smart-Contract Unit Testing

### 8.1 SecurityToken tests

Test the following:

| Area         | Required tests                                                                 |
| ------------ | ------------------------------------------------------------------------------ |
| Deployment   | Name, symbol, decimals, initial roles, and total supply configuration          |
| Minting      | Authorized mint succeeds; unauthorized mint reverts                            |
| Allowlist    | Add, remove, query, and event emission                                         |
| Transfers    | Whitelisted sender and receiver can transfer                                   |
| Restrictions | Non-whitelisted sender or receiver is rejected                                 |
| Pause        | Transfers, minting, or configured operations behave correctly while paused     |
| Approvals    | `approve` and `transferFrom` work under allowlist rules                        |
| Holder list  | New holders are registered once; zero-balance holders are handled consistently |
| Burning      | Authorized burn succeeds; unauthorized burn reverts; over-burn reverts         |
| Events       | Standard ERC-20 and project-specific events are emitted                        |
| Diagnostics  | Transfer restriction codes and messages are correct                            |

Required assertions include:

```text
Only approved recipients receive tokens.
Total supply increases only through authorized minting.
Total supply decreases only through valid burns.
A failed transfer does not change balances.
```

### 8.2 PaymentCurrency tests

Test the following:

- Authorized minting.
- Unauthorized minting rejection.
- Standard transfer behavior.
- Allowance behavior.
- `transferFrom` behavior.
- Optional burn behavior.
- Zero-address and insufficient-balance handling.

### 8.3 CorporateActionRegistry tests

Test the following:

| Area              | Required tests                                                      |
| ----------------- | ------------------------------------------------------------------- |
| Creation          | Valid action creates Version 1 as `ACTIVE`                          |
| Uniqueness        | Duplicate action IDs revert                                         |
| Types             | Coupon, interest, and redemption terms are validated                |
| Amendments        | Amendment creates a new version                                     |
| Preservation      | Version 1 remains queryable and unchanged                           |
| Supersession      | Version 1 becomes `SUPERSEDED`                                      |
| Pointer           | Version 2 becomes the active version                                |
| Links             | Version 2 stores the Version 1 supersedes link                      |
| Permissions       | Only `ANNOUNCER_ROLE` can create or amend                           |
| Terminal state    | Executed or cancelled actions cannot be amended                     |
| Execution marking | Only the active version can be marked executed                      |
| Events            | Creation, amendment, supersession, and execution events are emitted |

Required versioning assertions:

```text
Version 1 rate = 5%.
Version 2 rate = 4%.
Version 1 status = SUPERSEDED.
Version 2 status = ACTIVE.
Version 1 remains stored.
Version 2 points to Version 1.
```

### 8.4 PaymentExecutor tests

Test the following:

- Authorized executor can execute a payable action.
- Unauthorized executor is rejected.
- Execution before the payable date reverts.
- Unsupported action types revert.
- Non-active versions revert.
- Superseded versions revert.
- Already executed versions revert.
- Insufficient treasury balance reverts.
- Insufficient treasury allowance reverts.
- Zero-balance holders are skipped.
- Current balances are used.
- Payment amounts use basis-point arithmetic.
- Payment events contain correct holders and amounts.
- Reentrancy protection is active.
- Failed payment does not set the execution guard.
- Successful payment sets the execution guard once.
- Registry status changes only after successful execution.

### 8.5 Redemption tests

Test the following:

- Active redemption action can execute after the payable date.
- Principal is calculated from current balances.
- Treasury funding is checked.
- Each holder receives the correct principal.
- Each redeemed token is burned through the authorized path.
- Total supply decreases by the redeemed amount.
- A holder cannot be burned above their balance.
- Duplicate redemption reverts.
- Failed funding leaves balances, supply, and action status unchanged.
- Redemption and burn events are emitted.

## 9. Contract Integration Testing

### 9.1 Primary lifecycle test

The mandatory scenario is:

```text
1. Deploy SecurityToken.
2. Deploy PaymentCurrency.
3. Deploy CorporateActionRegistry.
4. Deploy PaymentExecutor.
5. Configure contract roles.
6. Whitelist Alice, Bob, and Charlie.
7. Mint 1,000 DBT.
8. Distribute 500 DBT to Alice and 500 DBT to Bob.
9. Create CA-001 Version 1 at 5%.
10. Transfer 200 DBT from Bob to Charlie.
11. Amend CA-001 to Version 2 at 4%.
12. Advance time beyond the payable date.
13. Fund the treasury and approve the executor.
14. Execute Version 2.
15. Verify Alice receives 20 payment tokens.
16. Verify Bob receives 12 payment tokens.
17. Verify Charlie receives 8 payment tokens.
18. Verify Version 1 remains superseded and unpaid.
19. Attempt duplicate execution and expect rejection.
20. Attempt Version 1 execution and expect rejection.
21. Create a redemption action.
22. Fund the redemption.
23. Execute redemption.
24. Verify payments, burns, total supply, and audit events.
```

### 9.2 Atomicity tests

For each external interaction that can fail, verify that the transaction reverts all state changes:

- Payment currency transfer failure.
- Treasury allowance failure.
- Treasury balance failure.
- Holder payment failure.
- Authorized burn failure.
- Registry execution-marking failure.

After a reverted transaction, verify:

```text
Execution guard remains false.
Action remains executable if otherwise valid.
No holder received partial payment.
No tokens were partially burned.
Registry status remains unchanged.
```

### 9.3 Time tests

Use Hardhat time controls to verify:

- Execution before payable date fails.
- Execution exactly at payable date succeeds if that is the selected rule.
- Execution after payable date succeeds.
- Amendment before execution changes the active terms.
- Amendment after execution is rejected.

## 10. Invariant and Property Testing

The following invariants must be checked across generated or repeated scenarios:

1. Total supply equals minted amount minus burned amount.
2. Sum of holder balances never exceeds total supply.
3. Transfers conserve total supply.
4. Burns reduce total supply by exactly the burned amount.
5. Only one active version exists for an action family.
6. A superseded version never becomes active again.
7. An executed action never becomes active again.
8. Each action version executes at most once.
9. A failed execution does not consume the execution right.
10. Total successful payments equal the sum of holder payment events.
11. Total redemption payments correspond to total redeemed token balances.
12. Unauthorized actors cannot change protected state.
13. A holder transfer before execution changes the payment distribution under the MVP model.

## 11. Backend and Indexer Testing

### 11.1 Event-handler tests

For every supported event, test that the handler:

- Creates the correct entity.
- Updates the correct projection.
- Preserves transaction hash and log index.
- Stores block number and timestamp.
- Handles repeated delivery idempotently.
- Handles events in the expected order.
- Does not overwrite historical versions.

### 11.2 Idempotency tests

Process the same event multiple times and verify that:

```text
No duplicate payment record is created.
No duplicate version is created.
No duplicate holder transfer is created.
No duplicate audit record is created.
```

The event identity key is:

```text
(chainId, transactionHash, logIndex)
```

### 11.3 Rebuild tests

The rebuild test must:

1. Deploy contracts to a clean local network.
2. Run the full lifecycle.
3. Index all events.
4. Record the read-model state.
5. Delete the database.
6. Restart indexing from the deployment block.
7. Compare the rebuilt state with the original state and direct contract reads.

The rebuilt model must contain:

- Current balances.
- Holder list.
- All action versions.
- Active and terminal statuses.
- Successful executions.
- Per-holder payments.
- Redemption and burn records.
- Transaction and block references.

### 11.4 API tests

Test:

- Health endpoint.
- Network endpoint.
- Asset queries.
- Holder queries.
- Action and version queries.
- Payment queries.
- Redemption queries.
- Audit queries.
- Pagination.
- Filters.
- Not-found responses.
- Invalid parameter responses.
- Indexer stale-state reporting.
- Amount serialization as strings.

## 12. Frontend Testing

### 12.1 Component tests

Test:

- Status badges.
- Data tables.
- Address truncation and copy controls.
- Explorer links.
- Version-chain display.
- Timeline rendering.
- Payment preview calculations and formatting.
- Redemption summary.
- Empty states.
- Error states.
- Responsive navigation.

### 12.2 Wallet and transaction tests

Mock wallet and blockchain states for:

- Wallet disconnected.
- Wrong network.
- Wallet signature rejected.
- Transaction pending.
- Transaction confirmed.
- Transaction reverted.
- Duplicate action rejection.
- Superseded version rejection.
- Insufficient treasury funding.

The UI must distinguish:

```text
Wallet rejection = user did not sign or approve.
Transaction revert = contract rejected the requested state transition.
Expected duplicate rejection = security control worked correctly.
Infrastructure failure = RPC, indexer, or network problem.
```

### 12.3 Accessibility tests

Verify:

- Keyboard navigation.
- Focus visibility.
- Accessible names for buttons and icons.
- Form labels.
- Table semantics.
- Status announcements.
- Color contrast.
- Reduced-motion behavior.
- Mobile touch-target size.

### 12.4 UI acceptance flow

A user should be able to:

1. Connect a wallet.
2. Confirm the network.
3. View the asset and holder balances.
4. Open CA-001.
5. See Version 1 and Version 2.
6. See Version 1 marked `SUPERSEDED`.
7. Preview Version 2 payments.
8. Execute Version 2.
9. View the confirmed payment receipt.
10. Attempt execution again.
11. Understand the duplicate rejection.
12. View the redemption process and token burn result.

## 13. End-to-End Testing

### 13.1 Local E2E scenario

Run the frontend against a fresh Hardhat deployment and local indexer. The test must complete:

```text
Create asset â†’ Distribute â†’ Announce â†’ Transfer â†’ Amend â†’ Execute â†’ Replay rejection â†’ Redeem
```

Verify both blockchain state and visible UI state after each step.

### 13.2 Sepolia smoke test

The Sepolia smoke test must verify:

- Correct chain ID.
- Correct deployed contract addresses.
- Correct role assignments.
- Wallet connection.
- Asset and holder reads.
- Action history reads.
- One successful testnet payment.
- One expected duplicate rejection.
- Explorer links.
- Indexer synchronization.

Do not use real customer funds. Use only the configured test tokens.

## 14. Security Testing

### 14.1 Permission testing

Attempt every privileged operation from an unauthorized signer:

- Mint.
- Whitelist.
- Pause.
- Create action.
- Amend action.
- Execute action.
- Mark executed.
- Burn holder tokens.
- Grant and revoke roles.

Every unauthorized attempt must revert without changing state.

### 14.2 Reentrancy testing

Use a malicious token or receiver test double where applicable to verify that payment and redemption entry points cannot be re-entered.

### 14.3 Replay testing

Verify that:

- The same action version cannot execute twice.
- A superseded version cannot execute.
- A transaction retry after confirmation cannot pay twice.
- Reprocessing an event cannot create duplicate read-model records.

### 14.4 Financial-math testing

Test:

- Zero rate.
- Maximum permitted rate.
- Small balances.
- Large valid balances.
- Rounding down.
- Decimal conversion.
- Overflow boundaries.
- Total-payment reconciliation.

### 14.5 Static and dependency checks

Run:

- Solidity compiler warnings.
- TypeScript type checks.
- ESLint or selected linter.
- Dependency audit.
- Secret scanning.
- Slither or equivalent Solidity static analysis where available.
- ABI and deployment-manifest consistency checks.

Warnings require either remediation or a documented review decision.

## 15. CI/CD Testing Gates

### 15.1 Pull-request checks

Every pull request must run the relevant checks for its changed area.

```text
Install dependencies
    â†“
Format check
    â†“
Lint
    â†“
Compile contracts
    â†“
Contract unit tests
    â†“
Integration tests
    â†“
Backend tests
    â†“
Frontend typecheck
    â†“
Frontend build
    â†“
Secret scan
```

### 15.2 Branch gates

| Branch       | Required gate                                                                   |
| ------------ | ------------------------------------------------------------------------------- |
| `frontend`   | Frontend tests, typecheck, build, accessibility checks where configured         |
| `backend`    | Indexer tests, API tests, migration checks, typecheck                           |
| `blockchain` | Compile, contract tests, integration tests, static analysis                     |
| `develop`    | Full cross-package CI and local lifecycle E2E                                   |
| `main`       | Release candidate CI, reviewed deployment manifest, Sepolia smoke-test evidence |

### 15.3 Merge rules

No pull request may merge when:

- Required checks fail.
- A contract test is removed without explanation.
- A financial calculation changes without updated tests.
- An ABI or event changes without backend and frontend review.
- A secret appears in the diff.
- The affected area owner has not reviewed the change.

## 16. Test Evidence

Every release candidate should retain:

- CI run URL or identifier.
- Contract test summary.
- Integration-test output.
- Backend rebuild result.
- Frontend build result.
- Static-analysis summary.
- Deployment manifest checksum.
- Sepolia transaction hashes.
- Known limitations and failed non-blocking checks.

Do not store private keys or secret environment values in test evidence.

## 17. Defect Severity

| Severity | Definition                                                                                                  | Response                                 |
| -------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Critical | Incorrect payment, duplicate payout, unauthorized burn, privilege bypass, or unrecoverable state corruption | Block merge and release immediately      |
| High     | Core lifecycle action fails, audit history is incorrect, or indexer materially diverges from chain          | Fix before `develop` merge               |
| Medium   | Important workflow or UI behavior is incorrect but financial state remains safe                             | Fix before `main` release when practical |
| Low      | Cosmetic, copy, minor responsive, or non-critical usability issue                                           | Track and prioritize                     |

## 18. Definition of Test Completion

Testing is complete for a change when:

- Relevant unit tests pass.
- Relevant integration tests pass.
- No critical or high defects remain open.
- The full affected-package CI checks pass.
- The diff has been reviewed by the area owner.
- New events, ABI changes, and API changes have corresponding tests.
- Contract state and indexer projections reconcile.
- Frontend transaction states are verified.
- No secrets are present.

The MVP test plan is complete when the primary lifecycle scenario passes from a clean local deployment and the Sepolia smoke test confirms the reviewed release candidate.

## 19. References

[1]: ./contract-design.md "AssetOps Master Smart-Contract Design"
[2]: ./API_CONTRACT.md "AssetOps API Contract"
[3]: ./development.md "AssetOps Development Plan and Workflow"
[4]: ./decisions.md "AssetOps Master Decisions Register"
[5]: ./PRD.md "AssetOps Product Requirements Document"
[6]: ./architecture.md "AssetOps System Architecture"
[7]: ./database.md "AssetOps Database and Data Model Specification"
[8]: https://hardhat.org/docs "Hardhat Documentation"
[9]: https://docs.openzeppelin.com/contracts/5.x/ "OpenZeppelin Contracts Documentation"
[10]: https://www.w3.org/WAI/standards-guidelines/wcag/ "W3C Web Accessibility Initiative Guidelines"
