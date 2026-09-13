# AssetOps â€” Security Policy and Threat Model

**Project:** AssetOps â€” The Operations Layer for Tokenized Assets  
**Document:** Master Security Policy  
**Status:** MVP security baseline  
**Audience:** Blockchain, backend, frontend, QA, release, and operations teams

## 1. Purpose

This document defines the security model, trust boundaries, threats, controls, operational rules, testing expectations, and incident procedures for AssetOps.

AssetOps manages tokenized-asset ownership, corporate-action announcements, coupon payments, amendments, principal redemption, and token burning. A security failure could produce incorrect payments, duplicate payouts, unauthorized transfers, incorrect redemption, loss of auditability, or exposure of deployment credentials.

> **Security principle:** Financial state must be enforced by smart contracts, validated through tests, and supported by transparent audit evidence. The frontend and backend must never be treated as security boundaries for financial rules.

## 2. Security Scope

### 2.1 Protected assets

AssetOps must protect:

- Token-holder balances.
- Payment-currency treasury funds.
- Corporate-action terms and version history.
- Action execution status.
- Redemption and burn correctness.
- Role assignments.
- Private keys, seed phrases, and RPC credentials.
- Deployment manifests and contract addresses.
- Indexed audit records.
- User wallet and transaction context.

### 2.2 MVP security boundary

The MVP is a technical prototype using mock payment tokens on Hardhat and Sepolia. It is not a production regulated securities platform and must not be used with real customer funds without independent smart-contract, legal, compliance, and operational review.

The MVP does not provide:

- Production KYC or AML.
- Investor eligibility verification.
- Tax or jurisdictional compliance.
- Banking or fiat settlement security.
- Unlimited-holder payment scalability.
- Production-grade multisignature governance unless separately configured.

## 3. Security Architecture

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Human operators         â”‚
â”‚ issuer / treasury / QA  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
            â”‚ wallet signatures and approvals
            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Frontend                â”‚
â”‚ presentation boundary   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
            â”‚ signed transactions and reads
            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Smart contracts         â”‚
â”‚ financial authority     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
            â”‚ confirmed events
            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Backend / indexer       â”‚
â”‚ rebuildable read model  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3.1 Trust boundaries

| Boundary                    | Trust assumption                            | Security control                                           |
| --------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| User to wallet              | User controls or approves the wallet action | Clear transaction preview and network display              |
| Frontend to contract        | Frontend may be modified or malicious       | Contract validates every permission and state rule         |
| Contract to payment token   | Token may not behave exactly as expected    | Safe ERC-20 interactions, funding checks, atomic reversion |
| Blockchain to indexer       | Events are confirmed but may be reprocessed | Idempotent event keys and rebuildable projections          |
| AI tool to repository       | AI output may contain defects               | Human review, tests, static analysis, protected branches   |
| Developer machine to GitHub | Credentials or secrets may leak             | Environment variables, secret scanning, branch protections |
| Deployer to public network  | Configuration may target the wrong chain    | Chain-ID and deployment-manifest validation                |

## 4. Security Principles

### 4.1 On-chain authority

Balances, active versions, execution guards, payment transfers, redemption, and burns must be enforced on-chain. The database and frontend may improve queryability and usability but cannot authorize a financial state transition.

### 4.2 Least privilege

Accounts and contracts receive only the roles and permissions required for their work. A role must not be granted broadly when a narrower role is sufficient.

### 4.3 Fail closed

Invalid, ambiguous, stale, unauthorized, or insufficiently funded operations must revert or be rejected. The system must not guess a payment amount or silently select a stale action version.

### 4.4 Atomic financial execution

A payment or redemption must complete fully or revert completely. Partial payment, partial burn, and partially updated action status are not acceptable states.

### 4.5 Append-only auditability

Corporate-action versions must never be overwritten or deleted. Corrections create a new version and mark the previous version as superseded.

### 4.6 Explicit user consent

Every wallet write must identify the network, contract operation, action ID, version, and expected effect before signature.

### 4.7 Secret minimization

Private keys, seed phrases, API keys, RPC credentials, and sensitive environment values must never be committed, logged, pasted into AI prompts, or included in documentation.

## 5. Role and Permission Model

### 5.1 Contract roles

```text
DEFAULT_ADMIN_ROLE
MINTER_ROLE
AGENT_ROLE
BURNER_ROLE
ANNOUNCER_ROLE
EXECUTOR_ROLE
TREASURY_ROLE
```

### 5.2 Role responsibilities

| Role                 | Capability                                                | Main risk                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| `DEFAULT_ADMIN_ROLE` | Grant and revoke roles, administrative configuration      | Complete system compromise                       |
| `MINTER_ROLE`        | Mint asset tokens or mock payment currency as configured  | Unauthorized supply creation                     |
| `AGENT_ROLE`         | Manage allowlist and pause asset transfers                | Unauthorized holder access or denial of transfer |
| `BURNER_ROLE`        | Burn holder asset tokens through approved redemption path | Destructive unauthorized burn                    |
| `ANNOUNCER_ROLE`     | Create and amend corporate actions                        | Incorrect or malicious financial terms           |
| `EXECUTOR_ROLE`      | Execute payments and redemption                           | Incorrect or duplicate payout                    |
| `TREASURY_ROLE`      | Control funding and allowance operations                  | Treasury misdirection or underfunding            |

### 5.3 Role rules

- Every privileged function must enforce its role on-chain.
- The frontend must not be the only permission check.
- Role grants and revocations must emit events where supported.
- Role assignments must be recorded in the deployment manifest.
- The demo may use one deployer for convenience, but this limitation must be visible in documentation.
- Production deployments should separate roles across controlled accounts and multisignature governance.

## 6. Smart-Contract Security Controls

### 6.1 SecurityToken

The asset token must:

- Use OpenZeppelin ERC-20 primitives.
- Use `AccessControl` for privileged actions.
- Use `Pausable` for emergency transfer control.
- Enforce allowlist restrictions for sender and receiver.
- Reject transfers while paused according to the configured policy.
- Track holder addresses for the bounded MVP.
- Expose an explicit authorized burn path.
- Reject burns above the holder balance.
- Use the transfer/update hook compatible with the installed OpenZeppelin version.
- Emit standard and project-specific events.

The executor must not assume it can burn investor-owned tokens through an allowance intended for the payment token. The asset token must explicitly authorize the redemption path.

### 6.2 PaymentCurrency

The mock payment currency must:

- Restrict minting to the configured minter role.
- Use safe ERC-20 transfers and allowance handling.
- Be clearly labelled as test currency.
- Never be presented as a real stablecoin, bank deposit, or settlement asset.

### 6.3 CorporateActionRegistry

The registry must:

- Reject duplicate action IDs.
- Preserve every version.
- Store a supersedes link.
- Maintain one active version per action family.
- Reject amendment of executed, cancelled, or otherwise terminal actions.
- Reject execution of superseded versions.
- Allow only the active version to be executed.
- Require executor authorization to mark an action executed.
- Emit creation, amendment, supersession, execution, and cancellation events.

### 6.4 PaymentExecutor

The executor must:

- Use `ReentrancyGuard` on payment and redemption entry points.
- Validate the action type and active version.
- Validate the payable date.
- Validate the execution guard.
- Read current balances according to the MVP model.
- Calculate with checked integer arithmetic.
- Validate treasury balance and allowance.
- Use safe ERC-20 methods.
- Set execution state atomically with successful execution.
- Emit aggregate and per-holder payment events.
- Burn the exact redeemed balance.
- Revert the entire transaction if any holder payment or burn fails.

## 7. Corporate-Action Threats and Controls

| Threat                               | Impact                          | Control                                                      |
| ------------------------------------ | ------------------------------- | ------------------------------------------------------------ |
| Old version is paid after correction | Incorrect financial entitlement | Active-version check and superseded status enforced on-chain |
| Original version is overwritten      | Loss of audit evidence          | Append-only version storage                                  |
| Action is executed twice             | Duplicate payout                | Executor guard and terminal registry status                  |
| Action executes too early            | Premature payment               | `block.timestamp >= payableDate` validation                  |
| Unauthorized announcement            | False financial instruction     | `ANNOUNCER_ROLE`                                             |
| Amendment after execution            | Conflicting terms and history   | Terminal action cannot be amended                            |
| Incorrect action type                | Wrong execution path            | Type validation before execution                             |
| Stale holder snapshot                | Wrong holder payments           | Current balance reads at execution time for MVP              |
| Unbounded holder loop                | Gas denial of service           | Small-holder limit and documented Merkle-claim path          |

## 8. Payment and Treasury Security

### 8.1 Funding controls

Before execution, validate:

```text
Treasury balance >= total required payment
Treasury allowance >= total required payment
```

The frontend may display a funding preview, but only the contract can authorize execution.

### 8.2 Payment calculation controls

Use:

```text
holderPayment = holderBalance Ã— rateBps Ã· 10,000
```

Use integer arithmetic only. Define rounding down explicitly. Test zero values, small values, large values, and boundary values.

### 8.3 Payment reconciliation

After execution, verify:

```text
Sum of HolderPaid amounts = ActionPaymentExecuted total
Treasury reduction = total payment transferred
Holder payment balances increased by expected amounts
```

The indexer must reconcile event totals with direct token reads for important release checks.

### 8.4 Failed execution

A failed execution must not:

- Set the execution guard.
- Mark the action executed.
- Transfer partial funds.
- Burn partial asset tokens.
- Remove the action from the active history.

## 9. Redemption Security

Redemption is a destructive lifecycle operation and requires stronger controls.

The redemption flow must:

1. Confirm the action is an active redemption.
2. Confirm the payable date has passed.
3. Confirm the action has not executed.
4. Read current holder balances.
5. Calculate principal.
6. Validate treasury funding.
7. Pay each holder.
8. Burn the exact redeemed asset amount.
9. Mark the redemption executed.
10. Emit payment, burn, and redemption events.

The implementation must not burn an amount based on a stale balance. The payment calculation and burn amount must derive from the same execution-time balance read within the atomic transaction.

## 10. Frontend Security

### 10.1 Wallet safety

The frontend must:

- Display the active network.
- Reject or warn on an unsupported network.
- Display the connected wallet address.
- Identify the contract operation before signing.
- Identify the action ID and version before payment execution.
- Never request a private key or seed phrase.
- Never claim success before confirmation.
- Link only to the configured chain explorer.

### 10.2 Transaction safety

Before a payment transaction, display:

- Action ID.
- Version number.
- Action type.
- Rate or principal amount.
- Payable date.
- Current holder balances.
- Estimated holder payments.
- Treasury funding status.
- Exact primary action label.

Use a precise label:

```text
Execute CA-001 Version 2
```

Do not use an unclear label such as `Confirm`.

### 10.3 Error handling

Distinguish:

```text
Wallet rejection
Contract revert
Network failure
Indexer delay
Expected duplicate rejection
```

A duplicate rejection must be explained as a successful security control:

> **Action already executed.** No second payment was transferred.

### 10.4 Frontend data trust

The frontend must not trust user-editable browser state for:

- Holder balances.
- Action status.
- Active version.
- Execution status.
- Treasury funding.

Critical values must come from direct contract reads or confirmed indexed data.

## 11. Backend, API, and Indexer Security

### 11.1 Backend authority

The backend is a read-only projection service for financial state. It must not provide a hidden endpoint that changes ownership, action status, payment execution, or redemption state without a wallet-signed blockchain transaction.

### 11.2 Input validation

Validate:

- Addresses.
- Chain IDs.
- Action IDs.
- Version IDs.
- Pagination values.
- Event-type filters.
- Block ranges.
- Sort and filter values.

Reject malformed values before database or RPC calls.

### 11.3 Event ingestion

Use the event identity key:

```text
(chainId, transactionHash, logIndex)
```

The indexer must:

- Be idempotent.
- Store block number and timestamp.
- Preserve historical versions.
- Track the latest indexed block.
- Handle configured confirmation depth.
- Support rebuild from deployment block.
- Detect or safely handle reorganization behavior.

### 11.4 API protection

The MVP query API may be public for local and testnet demonstration, but it must still implement:

- Request validation.
- Reasonable rate limits.
- Maximum page size.
- Safe error responses.
- No secret or private data exposure.
- No unrestricted database query execution.
- No arbitrary RPC method forwarding.

If authenticated operational endpoints are added later, use wallet-based authorization or an approved identity model rather than trusting a client-provided role string.

## 12. Secrets and Key Management

### 12.1 Prohibited storage

Never commit or share:

- Private keys.
- Seed phrases.
- Wallet recovery phrases.
- RPC provider secrets.
- API keys.
- Database passwords.
- Cloud credentials.
- Unredacted `.env` files.
- Production deployment credentials.

### 12.2 Approved handling

Use:

- Environment variables.
- Local `.env` files excluded by `.gitignore`.
- GitHub Actions encrypted secrets.
- Hardware wallets or multisignature wallets for public deployments.
- Separate development and deployment accounts.
- Rotated testnet credentials when exposure is suspected.

### 12.3 AI-tool handling

Do not paste secrets into Antigravity, Gemini CLI, Claude models, GitHub issues, pull requests, logs, or generated documentation.

AI-generated code must be treated as untrusted until reviewed, tested, and approved by the area owner.

## 13. GitHub and Supply-Chain Security

The team must use:

- Protected `main` and `develop` branches.
- Pull requests for all code changes.
- Required area-owner reviews.
- Required CI checks.
- Dependency lockfiles.
- Dependency update review.
- Secret scanning.
- Code-owner rules where practical.
- No unsigned or unreviewed deployment scripts.

### 13.1 Branch security gates

| Branch       | Required security gate                                                     |
| ------------ | -------------------------------------------------------------------------- |
| `frontend`   | Typecheck, lint, dependency checks, accessibility checks                   |
| `backend`    | API validation, dependency checks, migration review, secret scan           |
| `blockchain` | Compile, contract tests, static analysis, permission review                |
| `develop`    | Full integration tests, indexer rebuild, end-to-end lifecycle test         |
| `main`       | Release review, deployment review, Sepolia smoke test, manifest validation |

### 13.2 Dependency controls

Before upgrading OpenZeppelin, Hardhat, viem, wagmi, or other security-sensitive dependencies:

1. Review the changelog.
2. Review breaking changes.
3. Run the complete test suite.
4. Run static analysis.
5. Review generated ABI differences.
6. Test the local lifecycle again.
7. Document material changes in the decisions register.

## 14. Security Testing Requirements

Security testing must include:

- Unauthorized role calls.
- Role revocation behavior.
- Allowlist bypass attempts.
- Pause bypass attempts.
- Superseded-version execution attempts.
- Duplicate execution attempts.
- Early execution attempts.
- Insufficient funding.
- Insufficient allowance.
- Reentrancy attempts.
- Arithmetic boundary tests.
- Failed transaction rollback.
- Invalid burn attempts.
- Holder-state transfer tests.
- Event and audit reconciliation.
- Indexer replay and rebuild tests.
- Frontend network and wallet rejection tests.
- Secret scanning and dependency auditing.

Critical invariant examples:

```text
A superseded version cannot execute.
An executed version cannot execute again.
A failed execution does not lock the action.
Payment totals match per-holder records.
Redemption burn equals redeemed token balance.
Unauthorized users cannot mint, amend, execute, or burn.
```

## 15. Threat Model

### 15.1 Unauthorized issuer

**Threat:** An account creates or amends a false corporate action.

**Controls:** `ANNOUNCER_ROLE`, role separation, multisignature production governance, visible version history, pull-request review for deployment configuration.

### 15.2 Malicious executor

**Threat:** An executor attempts to pay a stale version, pay twice, or execute before the payable date.

**Controls:** Active-version validation, status checks, payable-date validation, execution guard, registry terminal state, event audit trail.

### 15.3 Treasury compromise

**Threat:** Payment-currency funds or allowances are redirected.

**Controls:** Separate treasury role, explicit allowance review, limited testnet funds, multisignature production governance, transaction previews, deployment manifest review.

### 15.4 Malicious holder

**Threat:** A holder attempts to bypass allowlist restrictions or manipulate transfer behavior.

**Controls:** On-chain allowlist checks, paused transfer control, contract-level validation, no frontend-only enforcement.

### 15.5 Frontend compromise

**Threat:** A malicious frontend displays incorrect amounts or requests a dangerous transaction.

**Controls:** Contract authority, exact transaction previews, independent wallet confirmation, direct contract reads, verified deployment addresses, protected release branch.

### 15.6 Backend compromise

**Threat:** An attacker alters indexed history or API responses.

**Controls:** Backend is non-authoritative, event-derived rebuilds, direct contract verification, immutable blockchain evidence, idempotent ingestion, API validation.

### 15.7 AI-generated vulnerability

**Threat:** AI-generated code introduces an access-control, arithmetic, reentrancy, or state-machine defect.

**Controls:** Human area-owner review, independent Claude review, targeted tests, full tests, static analysis, protected branches, no autonomous merge or deploy.

### 15.8 RPC or network failure

**Threat:** A stale or unavailable RPC causes incorrect UI state or incomplete indexing.

**Controls:** Network health indicator, latest indexed block, pending state, retry policy, direct confirmation checks, local fallback, no claim of success before confirmation.

## 16. Incident Response

### 16.1 Severity levels

| Severity | Example                                                                              | Immediate action                                                    |
| -------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Critical | Unauthorized payment, duplicate payout, private-key exposure, privilege bypass       | Stop deployment and payment activity; notify all owners immediately |
| High     | Incorrect action version, invalid burn, material indexer divergence                  | Pause affected workflow; investigate before further execution       |
| Medium   | API data error, frontend transaction-state error, non-critical role misconfiguration | Create incident issue and fix before release where practical        |
| Low      | Cosmetic security copy or minor usability issue                                      | Track and prioritize                                                |

### 16.2 Immediate response procedure

When a critical or high issue is suspected:

1. Stop the affected deployment or payment operation.
2. Do not attempt repeated transactions without preserving evidence.
3. Record network, chain ID, contract addresses, action IDs, version IDs, wallet addresses, transaction hashes, and timestamps.
4. If credentials may be exposed, revoke or rotate them immediately.
5. If operationally available, pause affected token transfers.
6. Determine whether any funds or tokens moved incorrectly.
7. Preserve logs, receipts, and event data.
8. Notify the team through the approved private channel.
9. Open a private GitHub security report rather than a public issue.
10. Agree on remediation, redeployment, or migration before resuming.

### 16.3 Recovery options

Depending on the issue, recovery may include:

- Pausing transfers.
- Revoking a compromised role.
- Rotating treasury allowances.
- Stopping the executor.
- Deploying corrected non-upgradeable contracts.
- Migrating the demonstration state.
- Rebuilding the indexer.
- Publishing a clear incident note.

The MVP does not promise recovery of real funds. Recovery decisions must be documented and reviewed.

## 17. Responsible Disclosure

Do not publicly disclose an exploitable vulnerability before the team has had an opportunity to investigate and remediate it.

A security report should include:

- A concise description.
- Affected contract, API, or package.
- Network and deployment address.
- Reproduction steps or proof of concept.
- Expected behavior.
- Actual behavior.
- Potential impact.
- Suggested mitigation, if known.
- Reporter contact information.

Do not include private keys, seed phrases, or unrelated personal data.

## 18. Security Review Checklist

Before a contract or release is approved, reviewers must confirm:

- Roles are explicitly defined.
- Every privileged function checks the correct role.
- No `tx.origin` authorization exists.
- External token calls use safe methods.
- Payment and redemption functions use reentrancy protection.
- Checks occur before interactions.
- Execution guards are atomic.
- Superseded versions cannot execute.
- Executed versions cannot execute again.
- Failed execution does not lock the action.
- Treasury balance and allowance are checked.
- Holder balances are read from the authoritative token.
- Redemption burns the correct holder amount.
- Events contain action, version, holder, amount, and transaction context.
- Indexer rebuild behavior is tested.
- Frontend displays network and transaction state.
- No secrets exist in the diff or artifacts.
- Deployment addresses and chain ID are reviewed.
- The local lifecycle test passes.
- Sepolia smoke-test evidence is recorded.

## 19. Security Acceptance Criteria

AssetOps meets the MVP security baseline when:

- Unauthorized privileged operations revert.
- Token transfers enforce allowlist and pause controls.
- Corporate-action history is append-only.
- Superseded actions cannot execute.
- Duplicate execution cannot transfer funds twice.
- Failed payment and redemption transactions revert atomically.
- Treasury funding is validated.
- Redemption burns only valid holder balances through an authorized path.
- Contract events provide a complete lifecycle audit trail.
- The indexer is idempotent and rebuildable.
- The frontend does not claim success before confirmation.
- CI includes contract tests, integration tests, static checks, and secret scanning.
- `develop` and `main` are protected.
- Deployment manifests contain no secrets.
- The team has a documented incident-response path.
- The product is clearly presented as a prototype and testnet demonstration, not regulated financial infrastructure.

## 20. References

[1]: ./contract-design.md "AssetOps Master Smart-Contract Design"
[2]: ./TESTING_PLAN.md "AssetOps Master Testing Plan"
[3]: ./API_CONTRACT.md "AssetOps API Contract"
[4]: ./decisions.md "AssetOps Master Decisions Register"
[5]: ./development.md "AssetOps Development Plan and Workflow"
[6]: ./architecture.md "AssetOps System Architecture"
[7]: ./database.md "AssetOps Database and Data Model Specification"
[8]: ./PRD.md "AssetOps Product Requirements Document"
[9]: https://docs.openzeppelin.com/contracts/5.x/ "OpenZeppelin Contracts Documentation"
[10]: https://hardhat.org/docs "Hardhat Documentation"
[11]: https://owasp.org/www-project-top-ten/ "OWASP Top 10"
[12]: https://docs.github.com/en/code-security "GitHub Code Security Documentation"
