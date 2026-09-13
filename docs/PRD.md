# AssetOps — Product Requirements Document

**Product name:** AssetOps  
**Product meaning:** Asset Operations  
**Product category:** Lifecycle operations platform for tokenized real-world assets  
**Document status:** MVP product requirements baseline  
**Previous working name:** W3A / RWA Lifecycle Servicing  
**Primary development environment:** Antigravity IDE with Gemini CLI  
**Author:** Manus AI

## 1. Executive Summary

AssetOps is an on-chain operations layer for tokenized real-world assets. It manages what happens after an asset is issued and distributed. The first release focuses on two lifecycle events: coupon or interest payments and principal redemption.

The product solves four operational problems that are often handled through disconnected spreadsheets, databases, emails, and payment instructions: identifying current holders, processing corrected corporate-action announcements, preventing duplicate payouts, and recording a complete audit history.

AssetOps is not primarily a token-minting product. Its central value is reliable post-issuance servicing.

> **AssetOps makes tokenized assets work after issuance.**

## 2. Product Naming and Story Analysis

### 2.1 Why AssetOps is a suitable name

“AssetOps” is short for **Asset Operations**. The term clearly describes the work performed by issuers, paying agents, transfer agents, treasury teams, and operations teams after an asset has been tokenized.

The name is broader than “BondFlow,” so the product can support bonds, shares, funds, real estate interests, and other tokenized assets. It is more professional and expandable than “AfterMint,” while retaining the same core story: the important operational work starts after minting.

### 2.2 Product story

A simple product explanation is:

> A token can be created in minutes. Managing its ownership, payments, corrections, redemption, and audit history is the difficult part. AssetOps brings those operations on-chain so that the correct holders are paid, corrected announcements remain visible, duplicate payments are rejected, and the asset can be closed properly at maturity.

### 2.3 Product positioning

| Positioning element | Definition                                                            |
| ------------------- | --------------------------------------------------------------------- |
| Product             | AssetOps                                                              |
| Category            | Tokenized-asset lifecycle operations                                  |
| Primary value       | Correct, auditable, duplicate-resistant servicing after issuance      |
| Initial asset       | Tokenized bond                                                        |
| Initial payment     | Coupon or interest payment                                            |
| Initial closeout    | Principal redemption and token burning                                |
| Main differentiator | Versioned announcements combined with execution-time holder state     |
| Initial users       | Issuers, treasury operators, asset-servicing operators, and investors |

## 3. Problem Statement

Tokenization platforms commonly demonstrate issuance and transfers but provide limited support for the operational lifecycle that follows. Real financial instruments require recurring and exceptional events, including coupon payments, corrected announcements, holder changes, maturity redemption, and audit reporting.

Without a lifecycle-servicing system, operators may rely on stale holder lists or manually reconciled records. An announcement correction may overwrite the original record. A payment retry may distribute funds twice. A redemption may pay investors without removing the redeemed asset from circulation.

These failures are costly because they affect investor entitlements, treasury balances, operational trust, and auditability.

## 4. Product Vision

AssetOps will become the programmable operations layer for tokenized assets.

The long-term vision is to provide a reliable lifecycle from issuance through final redemption:

```text
Issue asset
    ↓
Register holders
    ↓
Announce corporate action
    ↓
Amend when necessary
    ↓
Determine entitlement
    ↓
Execute payment
    ↓
Prevent replay
    ↓
Maintain audit history
    ↓
Redeem and close asset
```

The MVP will demonstrate this lifecycle using a simplified ERC-20 security token, mock payment currency, an on-chain corporate-action registry, and a web dashboard.

## 5. Goals and Non-Goals

### 5.1 Goals

The MVP must:

1. Represent a tokenized asset with an ERC-20-compatible smart contract.
2. Maintain a practical holder model for a small demonstration population.
3. Create coupon, interest, and redemption announcements.
4. Preserve original announcements when corrections are issued.
5. Mark replaced versions as superseded and make only the active version payable.
6. Calculate demonstration payments from current holder balances at execution time.
7. Prevent the same lifecycle action from executing twice.
8. Pay principal at maturity and burn redeemed asset tokens.
9. Emit structured events for an auditable history.
10. Present balances, announcement versions, payments, and failures through a dashboard.
11. Run locally and on the Sepolia testnet.

### 5.2 Non-goals for the MVP

The MVP will not:

- Provide legal or regulatory approval for a security offering.
- Replace a regulated transfer agent, custodian, bank, or paying agent.
- Implement full ERC-1400 or ERC-3643 functionality.
- Process real fiat payments or real customer funds.
- Support unlimited holder populations with a single push-payment transaction.
- Provide production-grade KYC, AML, tax, or jurisdictional compliance.
- Guarantee production suitability without independent smart-contract, legal, and operational review.
- Implement a generalized workflow engine for every possible corporate action.

## 6. Target Users and Roles

### 6.1 Issuer or asset administrator

The issuer creates the tokenized asset, distributes tokens, publishes corporate actions, and issues corrections when financial terms change.

### 6.2 Treasury or payment operator

The treasury operator funds the payment executor, verifies available payment currency, and executes approved actions on the payable date.

### 6.3 Investor or token holder

The holder owns asset tokens, transfers them when permitted, receives lifecycle payments, and receives principal at redemption.

### 6.4 Auditor or reviewer

The auditor reviews the complete sequence of announcements, amendments, executions, payments, transfers, and redemption events.

### 6.5 Demonstration operator

The demonstration operator uses the dashboard to run the complete scenario and intentionally show that duplicate and superseded payments are rejected.

## 7. Team and Collaboration Model

AssetOps is developed by three members in a shared GitHub repository. The team uses Antigravity IDE as the development workspace, Gemini CLI for implementation assistance, and Claude models for independent review, security critique, architecture reasoning, and documentation review.

AI-generated code is not considered trusted code. Human review, automated tests, and pull-request checks remain mandatory.

| Member                                      | Primary ownership                                                                               | Required review area                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Member A — Smart Contract Lead              | SecurityToken, PaymentCurrency, PaymentExecutor, contract tests, security invariants            | All Solidity and payment changes                                      |
| Member B — Protocol and Infrastructure Lead | CorporateActionRegistry co-ownership, indexer, database, deployment scripts, Sepolia operations | Registry integration, deployment, indexing, and data consistency      |
| Member C — Product and Frontend Lead        | React dashboard, user workflows, demo script, product documentation, integration from the UI    | Frontend behavior, usability, acceptance criteria, and demo readiness |

The team shall use short-lived feature branches and GitHub pull requests. The `main` branch shall be protected. Each pull request must contain a focused change, relevant tests, a clear description, and approval from the owner of the affected area.

Recommended branch names are:

```text
feature/security-token
feature/corporate-action-registry
feature/payment-executor
feature/indexer
feature/dashboard
fix/redemption-burn-path
docs/update-product-requirements
```

The collaboration sequence is:

```text
Create branch
    ↓
Implement in Antigravity IDE
    ↓
Use Gemini CLI for focused development support
    ↓
Use Claude models for independent review or threat modeling
    ↓
Run targeted tests and full CI checks
    ↓
Open GitHub pull request
    ↓
Area-owner review
    ↓
Merge after approval and passing CI
```

## 8. User Stories

| ID    | User story                                                                                                     | Priority    |
| ----- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| US-01 | As an issuer, I want to create a tokenized asset so that ownership can be represented on-chain.                | Must have   |
| US-02 | As an issuer, I want to distribute asset tokens to approved holders so that ownership is established.          | Must have   |
| US-03 | As an issuer, I want to publish a coupon announcement with a rate and payable date.                            | Must have   |
| US-04 | As a holder, I want to transfer tokens before payment so that ownership changes are reflected.                 | Must have   |
| US-05 | As an issuer, I want to amend an announcement without deleting the original version.                           | Must have   |
| US-06 | As an operator, I want to execute only the current active version.                                             | Must have   |
| US-07 | As an operator, I want a second execution attempt to fail automatically.                                       | Must have   |
| US-08 | As a holder, I want my payment to be calculated from the authoritative holder state selected by the MVP rules. | Must have   |
| US-09 | As an issuer, I want to redeem the asset at maturity and burn redeemed tokens.                                 | Must have   |
| US-10 | As an auditor, I want to inspect all original and amended announcements.                                       | Must have   |
| US-11 | As a demo operator, I want the dashboard to display successful and rejected transactions clearly.              | Should have |
| US-12 | As a future operator, I want a scalable claim-based payment model for large holder populations.                | Future      |

## 9. MVP Functional Requirements

### 8.1 Asset creation and distribution

The system shall allow an authorized minter to create or configure a tokenized asset with a name, symbol, decimals, and initial supply policy.

The asset token shall support minting, transfers, approvals, `transferFrom`, balance queries, total-supply queries, and burning. Only approved addresses may receive or transfer the asset in the MVP.

The demonstration asset shall use a configuration similar to:

```text
Name: Demo Bond Token
Symbol: DBT
Supply: 1,000 tokens
```

### 8.2 Holder registry

The system shall treat token balances as the authoritative ownership values for the MVP.

The system shall maintain a holder enumeration list sufficient for a small push-payment demonstration. The list may retain addresses with zero balances, but payment logic shall skip zero-balance holders.

The system shall expose or make available:

```text
getHolders()
getHolderCount()
isHolder(address)
balanceOf(address)
totalSupply()
```

### 8.3 Corporate-action announcements

The system shall support at least these action types:

```text
COUPON
INTEREST
REDEMPTION
```

An announcement shall contain, at minimum:

| Field                | Purpose                                    |
| -------------------- | ------------------------------------------ |
| Action identifier    | Identifies the corporate action            |
| Asset address        | Identifies the tokenized asset             |
| Action type          | Identifies coupon, interest, or redemption |
| Rate in basis points | Defines coupon or interest rate            |
| Amount per token     | Defines redemption value                   |
| Record date          | Stores the entitlement reference date      |
| Payable date         | Defines the earliest execution time        |
| Version              | Identifies the version number              |
| Supersedes           | Links to the previous version              |
| Document hash        | Anchors an announcement document           |
| Status               | Tracks lifecycle state                     |
| Announcer            | Records the creating account               |
| Creation time        | Records when the version was created       |

### 8.4 Versioning and amendments

An amendment shall create a new version rather than mutate the original record.

The previous active version shall become `SUPERSEDED`. The new version shall become `ACTIVE`. The original version shall remain stored and queryable.

A superseded version shall never be payable. Only the active version may be executed. After execution, the executed version shall be terminal.

The dashboard shall display the version chain clearly:

```text
CA-001 Version 1 — 5% — SUPERSEDED
CA-001 Version 2 — 4% — ACTIVE
```

### 8.5 Coupon and interest payments

The payment executor shall verify the action type, active status, payable date, execution state, treasury allowance, treasury balance, and holder state before paying.

The MVP formula shall use integer arithmetic and basis points:

```text
Holder payment = holder token balance × rateBps ÷ 10,000
```

For the primary demo:

```text
Alice:   500 × 4% = 20 payment tokens
Bob:     300 × 4% = 12 payment tokens
Charlie: 200 × 4% = 8 payment tokens
```

The payment transaction shall emit an overall execution event and per-holder payment events or equivalent auditable records.

### 8.6 Duplicate prevention

The system shall maintain an execution guard for each payable lifecycle action version.

A second execution attempt shall revert and shall not transfer payment currency. Attempting to execute a superseded version shall also revert.

The expected failure shall be visible in the dashboard and available through the transaction receipt or decoded contract error.

### 8.7 Principal redemption

The redemption executor shall:

1. Verify that the action is an active redemption action.
2. Verify that the payable date has passed.
3. Verify that the action has not already executed.
4. Read current holder balances.
5. Calculate the principal due for each holder.
6. Verify treasury funding.
7. Pay each holder.
8. Burn the redeemed asset tokens through an authorized burn path.
9. Mark the action executed.
10. Emit redemption and payment events.

The implementation shall not assume that the payment executor owns investor tokens. It shall either use a holder-authorized transfer-and-burn flow or an explicitly authorized administrative burn function.

### 8.8 Audit history

The system shall record and display:

```text
Asset created
Tokens distributed
Holder transfer
Action created
Version created
Action amended
Previous version superseded
Payment executed
Holder payment recorded
Duplicate attempt rejected
Redemption executed
Tokens burned
```

Blockchain events are the authoritative audit source. An indexer may provide a more convenient query interface for the dashboard.

## 10. Primary Demonstration Scenario

The primary demonstration shall follow this sequence:

1. Create the Demo Bond Token.
2. Distribute 500 tokens to Alice and 500 tokens to Bob.
3. Announce `CA-001` as a 5% coupon, Version 1.
4. Transfer 200 tokens from Bob to Charlie.
5. Confirm balances of Alice 500, Bob 300, and Charlie 200.
6. Amend `CA-001` to a 4% coupon, Version 2.
7. Confirm Version 1 is superseded and Version 2 is active.
8. Fund the payment executor.
9. Execute Version 2.
10. Verify that payments use the current balances and 4% rate.
11. Attempt to execute Version 2 again and show the rejection.
12. Attempt to execute Version 1 and show the superseded-version rejection.
13. Create a redemption action.
14. Execute redemption after the payable date.
15. Verify principal payments, token burns, and final supply.

## 11. Product Interfaces

### 10.1 Dashboard pages

| Page               | Required content                                                                |
| ------------------ | ------------------------------------------------------------------------------- |
| Overview           | Asset summary, total supply, current action, treasury status, and recent events |
| Holder Registry    | Holder addresses, balances, ownership changes, and total supply                 |
| Announcements      | Action list, active version, status, rate, payable date, and document link      |
| Version History    | Original and amended versions with supersedes relationships                     |
| Payment History    | Total paid, per-holder payments, action version, and transaction links          |
| Redemption         | Principal amount, holder entitlements, burn status, and final supply            |
| Demo Control Panel | Guided controls for the full scenario and duplicate test                        |

### 10.2 Transaction states

Every write action shall communicate these states:

```text
Ready
→ Wallet signature requested
→ Transaction pending
→ Transaction confirmed
→ Transaction failed
```

The dashboard shall show the blockchain explorer link after confirmation when the network supports it.

## 12. Business and Product Rules

| Rule | Requirement                                                        |
| ---- | ------------------------------------------------------------------ |
| R-01 | Asset balances are the authoritative ownership values for the MVP. |
| R-02 | Announcement versions are append-only.                             |
| R-03 | Amendments never delete or overwrite earlier versions.             |
| R-04 | Superseded versions cannot execute.                                |
| R-05 | Only the active version can execute.                               |
| R-06 | An executed action cannot execute twice.                           |
| R-07 | Coupon rates use basis points, not floating-point values.          |
| R-08 | Failed payment transactions must revert atomically.                |
| R-09 | Redemption must pay and burn through a valid authorized path.      |
| R-10 | Every important lifecycle transition must emit an event.           |
| R-11 | The MVP uses mock payment currency and testnet funds only.         |
| R-12 | Public deployment must not expose private keys or secrets.         |

## 13. Success Metrics

### 12.1 Functional success

The MVP succeeds when the complete primary demonstration passes on a local Hardhat network and on Sepolia without manual database correction.

### 12.2 Technical success

| Metric               | Target                                                           |
| -------------------- | ---------------------------------------------------------------- |
| Contract compilation | 100% success on the pinned Solidity and dependency versions      |
| Test execution       | All unit and integration tests pass in CI                        |
| Version integrity    | 100% of amendments preserve prior versions                       |
| Duplicate prevention | 100% of replay attempts revert                                   |
| Payment correctness  | Demonstrated holder amounts match deterministic integer formulas |
| Redemption integrity | Redeemed tokens are burned and total supply changes correctly    |
| Audit coverage       | All required lifecycle transitions emit queryable events         |
| Demo scale           | At least four holders supported in the scripted scenario         |

### 12.3 Product communication success

A new viewer should understand within one minute:

1. The problem is post-issuance asset operations.
2. AssetOps preserves corrected announcement history.
3. AssetOps pays the correct holder set under the documented MVP model.
4. AssetOps rejects duplicate payments.
5. AssetOps completes redemption.

## 14. Security and Trust Requirements

The MVP shall use role-based permissions, reentrancy protection, checked arithmetic, transfer restrictions, explicit execution guards, and atomic transaction behavior.

A single deployer wallet may be used for the demonstration, but production architecture shall separate administration, announcement, treasury, and execution permissions. Production use would require multisignature administration, independent contract review, compliance controls, operational monitoring, and legal validation.

AssetOps shall clearly distinguish between:

- A working technical prototype.
- A public testnet demonstration.
- A production-ready regulated financial product.

The MVP is the first category and demonstrates selected properties of the second. It is not the third.

## 15. Technical Dependencies

The MVP is implemented using:

```text
Solidity ^0.8.24
OpenZeppelin Contracts
Hardhat
Ethers.js or viem
React
Vite
TypeScript
wagmi
Tailwind CSS
Hardhat Network
Ethereum Sepolia
Ethers.js event indexer or The Graph
IPFS-compatible document storage
GitHub Actions
Antigravity IDE
Gemini CLI
Claude models for independent review, security analysis, and documentation critique
```

The master technical decisions are documented in [`technology.md`](./technology.md).

## 16. Delivery Phases

### Phase 1 — Foundation

Create the repository structure, configure Hardhat, implement the asset token and payment currency, and establish role and holder-state tests.

### Phase 2 — Corporate-action registry

Implement announcement creation, amendment versioning, status transitions, active-version lookup, event emission, and registry invariant tests.

### Phase 3 — Payment and redemption

Implement coupon execution, duplicate prevention, treasury funding, per-holder events, redemption, authorized token burning, and full lifecycle integration tests.

### Phase 4 — Dashboard and history

Implement wallet connection, holder registry, announcement feed, version history, payment history, redemption view, and visible error states.

### Phase 5 — Demonstration deployment

Deploy to Sepolia, seed the demonstration state, verify contract addresses and roles, connect the dashboard, and rehearse the full scenario.

### Phase 6 — Production-readiness research

Evaluate Merkle claims, record-date snapshots, ERC-3643 identity integration, multisignature governance, regulated payment rails, monitoring, and independent security review.

## 17. Risks and Mitigations

| Risk                                                                   | Impact                                          | Mitigation                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Holder list grows too large                                            | Payment transaction may exceed block gas limits | Limit MVP holder count and document Merkle claims as the scaling path         |
| Current-balance model differs from traditional record-date entitlement | Business rules may be misunderstood             | Clearly label the MVP model and evaluate record-date snapshots for production |
| Incorrect amendment logic pays an old rate                             | Financial loss and trust failure                | Test append-only versions, active pointers, and superseded-version rejection  |
| Redemption burn path is incorrectly implemented                        | Holders may be paid without asset closure       | Use an explicit authorized burn design and test balances and total supply     |
| Treasury underfunding                                                  | Payment execution fails                         | Validate allowance and balance, and require atomic reversion                  |
| AI-generated code contains defects                                     | Security or reliability failure                 | Require human review, targeted tests, full tests, and contract analysis       |
| Testnet or wallet failure during demo                                  | Demonstration interruption                      | Maintain local fallback, deployment records, and a scripted demo state        |
| Prototype is mistaken for regulated infrastructure                     | Legal and operational risk                      | State scope limitations prominently in product and technical documents        |

## 18. Acceptance Criteria

The MVP is accepted only when all of the following are true:

- [ ] An authorized user can create and distribute the asset token.
- [ ] Only approved holders can receive or transfer the asset token.
- [ ] The holder registry exposes current balances and holder enumeration.
- [ ] An authorized announcer can create a coupon or redemption action.
- [ ] An authorized announcer can amend an active action.
- [ ] The original version remains stored and queryable after amendment.
- [ ] The original version is marked `SUPERSEDED`.
- [ ] The amended version becomes the active version.
- [ ] A superseded version cannot execute.
- [ ] A payment before the payable date cannot execute.
- [ ] The active coupon version calculates payments using the documented MVP holder-state model.
- [ ] Treasury funding is validated before payment.
- [ ] A successful action cannot execute a second time.
- [ ] Failed execution does not permanently lock the action.
- [ ] Redemption pays holders and burns redeemed asset tokens.
- [ ] Lifecycle events are emitted and visible in the history view or indexer.
- [ ] The complete scenario passes in automated integration tests.
- [ ] The complete scenario can be demonstrated on Sepolia.
- [ ] No secrets are committed to the repository or exposed in project documentation.

## 19. Future Roadmap

After the MVP, AssetOps may expand to include:

1. Record-date snapshots with explicit entitlement semantics.
2. Merkle-root payment claims for large holder populations.
3. ERC-3643 identity and compliance integration.
4. Multiple asset classes and payment currencies.
5. Dividends, splits, calls, conversions, and tender events.
6. Multisignature governance and timelocked administration.
7. Treasury reconciliation and external payment-rail integration.
8. Subgraph or production indexer deployment.
9. Investor notifications and document delivery.
10. Reporting for auditors, administrators, and regulators.

## 20. References

[1]: ./overview.md "AssetOps Project Overview"
[2]: ./technicals.md "AssetOps Technical Specification"
[3]: ./RWA_Lifecycle_Blueprint.md "AssetOps Project Blueprint"
[4]: ./technology.md "AssetOps Master Technology Specification"
[5]: https://docs.openzeppelin.com/contracts/5.x/ "OpenZeppelin Contracts Documentation"
[6]: https://hardhat.org/docs "Hardhat Documentation"
[7]: https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ "Ethereum ERC-20 Token Standard Documentation"
