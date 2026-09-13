# AssetOps â€” Live Demonstration Flow

**Project:** AssetOps â€” The Operations Layer for Tokenized Assets  
**Document:** Master Demo Flow  
**Status:** MVP demonstration script  
**Audience:** Demo operator,=judges, team members, reviewers, and auditors

## 1. Demo Purpose

This demonstration proves that AssetOps manages the lifecycle of a tokenized asset after issuance.

The demonstration must show:

- Tokenized asset creation.
- Token distribution.
- Current holder state.
- Corporate-action announcement.
- Holder transfer before payment.
- Corrected announcement version.
- Payment using the active corrected version.
- Duplicate-payment rejection.
- Audit history.
- Principal redemption and token burning.

> **Demo message:** Issuing a token is only the beginning. AssetOps makes the lifecycle after issuance correct, visible, and auditable.

## 2. Demo Story

A bond token is issued and distributed to Alice and Bob. A coupon is announced at 5%. Before payment, Bob transfers 200 tokens to Charlie. The issuer corrects the coupon to 4%. AssetOps preserves the original 5% announcement, marks it superseded, and pays the current holders using the active 4% version. A second execution attempt is rejected. At maturity, the system pays principal and burns the redeemed tokens.

## 3. Demo Environment

### 3.1 Preferred environment

Use the local Hardhat Network for rehearsal and a reviewed Sepolia deployment for the public demonstration.

| Item             | Local                    | Sepolia                               |
| ---------------- | ------------------------ | ------------------------------------- |
| Network          | Hardhat Network          | Ethereum Sepolia                      |
| Payment currency | Mock ERC-20              | Mock ERC-20                           |
| Wallets          | Test accounts            | Dedicated testnet accounts            |
| Explorer         | Local transaction output | Sepolia explorer links                |
| Reset capability | Fresh deployment         | New demo state or reviewed deployment |

### 3.2 Required contract addresses

Before starting, confirm the deployment manifest contains:

```text
SecurityToken:             0x...
PaymentCurrency:            0x...
CorporateActionRegistry:    0x...
PaymentExecutor:            0x...
Network:                    hardhat or sepolia
Chain ID:                   ...
Deployment block:          ...
```

Do not begin the demo until the network and addresses are verified.

### 3.3 Required roles

```text
Admin:      deployer or governance account
Minter:     asset and mock-currency minting account
Agent:      allowlist and pause-management account
Announcer:  corporate-action issuer account
Treasury:   payment-currency funding account
Executor:   payment and redemption execution account
```

For the MVP, one account may hold multiple roles. State this limitation if presenting the demo to an external audience.

## 4. Demo Actors and Starting State

### 4.1 Actors

| Actor    | Role in story                           | Wallet label |
| -------- | --------------------------------------- | ------------ |
| Issuer   | Creates and amends corporate actions    | `Issuer`     |
| Treasury | Funds coupon and redemption payments    | `Treasury`   |
| Executor | Executes payable actions                | `Executor`   |
| Alice    | Initial bond holder                     | `Alice`      |
| Bob      | Initial bond holder and transfer sender | `Bob`        |
| Charlie  | Receives tokens from Bob                | `Charlie`    |
| Auditor  | Reviews history and receipts            | `Auditor`    |

### 4.2 Starting token state

```text
Asset name:      Demo Bond Token
Symbol:          DBT
Total supply:    1,000 DBT
Decimals:        18
```

Initial distribution:

```text
Alice:           500 DBT
Bob:             500 DBT
Charlie:           0 DBT
```

Payment currency:

```text
Treasury:        Sufficient mock payment currency
Executor:        Approved to spend treasury funds
```

## 5. Pre-Demo Checklist

Complete this checklist before presenting:

- [ ] Correct network selected.
- [ ] Wallets connected to the correct network.
- [ ] Contract addresses verified against the deployment manifest.
- [ ] Contract roles verified.
- [ ] Alice, Bob, and Charlie are whitelisted.
- [ ] Asset token is not unintentionally paused.
- [ ] Mock payment currency is available.
- [ ] Treasury allowance is sufficient.
- [ ] Frontend is connected to the correct deployment.
- [ ] Backend/indexer is synchronized.
- [ ] Explorer links work.
- [ ] Local fallback deployment is available.
- [ ] Screen recording or presentation capture is ready if required.

## 6. Demonstration Sequence

## Step 1 â€” Introduce the Problem

### Operator action

Open the AssetOps landing page or overview dashboard.

### Say

> Most tokenization demos stop after minting and transferring a token. AssetOps focuses on what happens next: ownership changes, corporate-action corrections, payments, redemption, duplicate prevention, and audit history.

### Show

The lifecycle summary:

```text
Issue â†’ Hold â†’ Announce â†’ Amend â†’ Pay â†’ Audit â†’ Redeem
```

### Expected result

The audience understands that the demo is about post-issuance operations, not only token creation.

## Step 2 â€” Create the Tokenized Asset

### Operator action

Open the asset creation or seeded asset view. If using the scripted deployment, show the deployed asset record.

### Values

```text
Name:       Demo Bond Token
Symbol:     DBT
Supply:     1,000 tokens
```

### Say

> We begin with a simplified ERC-20-style tokenized bond. The MVP intentionally uses a focused token model so that the main problemâ€”lifecycle servicingâ€”remains clear.

### Verify

- Asset name is `Demo Bond Token`.
- Symbol is `DBT`.
- Total supply is `1,000 DBT`.
- Asset contract address is visible.
- Transaction hash or deployment record is available.

## Step 3 â€” Distribute Tokens

### Operator action

Show the holder registry or distribution transaction.

### Expected state

```text
Alice:    500 DBT
Bob:      500 DBT
Charlie:    0 DBT
```

### Say

> Ownership is represented by on-chain token balances. The holder registry is a queryable view, but the token contract remains the authority.

### Verify

- Alice has 500 DBT.
- Bob has 500 DBT.
- Charlie is whitelisted but has zero balance.
- Total holder balances equal total distributed supply.

## Step 4 â€” Create Coupon Announcement Version 1

### Operator action

Open **Corporate Actions** and create a new action.

### Values

```text
Action ID:       CA-001
Asset:           Demo Bond Token / DBT
Type:            COUPON
Rate:            5%
Rate in basis points: 500
Record date:     Current demo date
Execution date:  Future payable date
Status:          ACTIVE
Version:         Version 1
```

### Say

> The issuer announces a 5% coupon. This is Version 1 of CA-001, and it is currently active.

### Verify

- Version 1 is stored.
- Status is `ACTIVE`.
- Rate is 5% or 500 basis points.
- Payable date is in the future.
- The announcement transaction is confirmed.
- The document hash or announcement reference is visible.

### Audit event

```text
Action created
Version 1 created
Version 1 active
```

## Step 5 â€” Demonstrate the Holder Transfer

### Operator action

Switch to Bobâ€™s wallet or use the transfer control.

Bob transfers 200 DBT to Charlie.

```text
From:   Bob
To:     Charlie
Amount: 200 DBT
```

### Expected state

```text
Alice:    500 DBT
Bob:      300 DBT
Charlie:  200 DBT
```

### Say

> Ownership changed after the announcement but before payment. This is the important lifecycle condition: the payment engine must use the projectâ€™s authoritative holder state at execution time rather than relying on a stale announcement-time list.

### Verify

- Bobâ€™s balance decreased from 500 to 300 DBT.
- Charlieâ€™s balance increased from 0 to 200 DBT.
- Total supply remains 1,000 DBT.
- The transfer is visible in the audit history.

### Audit event

```text
Holder transfer
Bob â†’ Charlie
200 DBT
```

## Step 6 â€” Amend the Coupon to Version 2

### Operator action

Return to CA-001 and select **Amend announcement**.

### New values

```text
Action ID:       CA-001
Previous rate:   5%
Corrected rate:  4%
Rate in basis points: 400
New version:     Version 2
```

Keep the same asset, action type, and record date unless the product requirements explicitly allow those fields to change.

### Say

> The issuer corrects the coupon from 5% to 4%. AssetOps does not overwrite Version 1. It creates Version 2, marks Version 1 as superseded, and updates the active-version pointer.

### Verify

The version chain displays:

```text
CA-001 Version 1 â€” 5% â€” SUPERSEDED
CA-001 Version 2 â€” 4% â€” ACTIVE
```

Also verify:

- Version 1 remains queryable.
- Version 2 points to Version 1.
- Only Version 2 is active.
- The amendment transaction is confirmed.

### Audit events

```text
Action amended
Version 2 created
Version 1 superseded
Version 2 active
```

## Step 7 â€” Prepare Treasury Funding

### Operator action

Open the treasury or payment preparation view.

Approve the `PaymentExecutor` to spend enough mock payment currency.

### Minimum coupon funding

```text
Alice:       20 payment tokens
Bob:         12 payment tokens
Charlie:      8 payment tokens
Total:       40 payment tokens
```

Fund the treasury with more than the required amount to demonstrate a valid balance and allowance.

### Verify

- Treasury balance is sufficient.
- Executor allowance is sufficient.
- Funding is shown as ready.
- The active version is Version 2.
- The action is payable or the demo clock is ready to advance.

## Step 8 â€” Advance Time to the Payable Date

### Local network

Use the Hardhat time-control script to advance beyond the payable date.

### Sepolia

Use an announcement with a payable date that has arrived or wait until the prepared demonstration date.

### Verify

The dashboard shows:

```text
Status:      READY TO EXECUTE
Version:     Version 2
Rate:        4%
Payable:     Payable now
```

## Step 9 â€” Preview the Corrected Payment

### Operator action

Open the payment preview for CA-001.

### Expected preview

| Holder    |   DBT balance | Rate |               Payment |
| --------- | ------------: | ---: | --------------------: |
| Alice     |       500 DBT |   4% |     20 payment tokens |
| Bob       |       300 DBT |   4% |     12 payment tokens |
| Charlie   |       200 DBT |   4% |      8 payment tokens |
| **Total** | **1,000 DBT** |      | **40 payment tokens** |

### Say

> The payment is calculated using the corrected Version 2 and the current holder state. Alice receives 20, Bob receives 12, and Charlie receives 8 payment tokens.

### Important point

The preview is for user understanding. The smart contract performs the authoritative checks and calculations during execution.

## Step 10 â€” Execute Version 2

### Operator action

Select the exact control:

```text
Execute CA-001 Version 2
```

Confirm the wallet transaction.

### Show transaction states

```text
Ready
  â†“
Wallet request
  â†“
Pending confirmation
  â†“
Confirmed
```

### Verify payment results

```text
Alice payment balance:    +20
Bob payment balance:      +12
Charlie payment balance:   +8
Total paid:               40
```

### Verify contract state

```text
CA-001 Version 2: EXECUTED
CA-001 Version 1: SUPERSEDED
Execution guard:   true
```

### Say

> Version 2 was executed. Version 1 was not paid. The payment used the corrected 4% rate and the current balances after Bobâ€™s transfer.

### Audit events

```text
Payment executed
Alice paid 20
Bob paid 12
Charlie paid 8
CA-001 Version 2 executed
```

## Step 11 â€” Attempt Duplicate Execution

### Operator action

Attempt to execute the same action again:

```text
Execute CA-001 Version 2
```

### Expected result

The transaction is rejected with an error similar to:

```text
ActionAlreadyExecuted
```

or:

```text
ACTION_ALREADY_EXECUTED
```

### Say

> The second attempt is rejected. This is not an application failure. It is the expected security behavior that prevents the same lifecycle action from paying twice.

### Verify

- No payment currency moves.
- Holder balances do not change.
- The execution guard remains true.
- The UI clearly identifies the rejection.
- The failed transaction or decoded error is visible.

## Step 12 â€” Attempt Superseded Version Execution

### Operator action

If the interface exposes historical execution controls, attempt to execute:

```text
CA-001 Version 1
```

If the interface correctly hides the control, demonstrate the contract rejection through a test or developer console instead.

### Expected result

```text
SupersededVersion
```

### Say

> Version 1 remains auditable, but it is no longer payable. The contract rejects any attempt to execute the superseded announcement.

### Verify

- No payment moves.
- Version 1 remains `SUPERSEDED`.
- Version 2 remains `EXECUTED`.

## Step 13 â€” Review the Audit History

### Operator action

Open the audit-history page.

### Required visible sequence

```text
Asset created
    â†“
Tokens distributed
    â†“
CA-001 Version 1 created
    â†“
Bob transferred 200 DBT to Charlie
    â†“
CA-001 amended
    â†“
Version 2 created at 4%
    â†“
Version 1 superseded
    â†“
Version 2 payment executed
    â†“
Alice paid 20
    â†“
Bob paid 12
    â†“
Charlie paid 8
    â†“
Duplicate execution rejected
```

### Say

> The audit history is not a replacement database record. It is a readable projection of confirmed blockchain events. The underlying history remains independently verifiable.

## Step 14 â€” Create the Redemption Action

### Operator action

Create a new redemption action for DBT.

### Example values

```text
Action ID:       RED-001
Asset:           Demo Bond Token / DBT
Type:            REDEMPTION
Principal/token: 1 payment token per DBT
Record date:     Maturity date
Execution date:  Current or future maturity date
Status:          ACTIVE
Version:         Version 1
```

### Say

> At maturity, AssetOps returns principal to the current holders and closes the asset by burning the redeemed tokens.

### Verify

- Redemption action is active.
- Principal amount is visible.
- Payable date is valid.
- Treasury funding is sufficient.
- Current holder balances are shown.

## Step 15 â€” Preview Redemption

### Expected calculation

At the time of redemption:

```text
Alice:    500 DBT â†’ 500 principal tokens
Bob:      300 DBT â†’ 300 principal tokens
Charlie:  200 DBT â†’ 200 principal tokens
Total:   1,000 DBT â†’ 1,000 principal tokens
```

The exact display depends on the configured token decimals and principal amount.

### Verify

- Total principal equals the sum of holder principal.
- The treasury is funded.
- The executor has the required allowance.
- The system identifies the tokens that will be burned.

## Step 16 â€” Execute Redemption

### Operator action

Select:

```text
Execute RED-001 Version 1
```

Confirm the wallet transaction.

### Expected result

```text
Alice receives principal.
Bob receives principal.
Charlie receives principal.
Redeemed DBT balances are burned.
Total supply decreases by 1,000 DBT.
RED-001 Version 1 becomes EXECUTED.
```

### Say

> Redemption is complete. Holders received principal, the redeemed asset tokens were burned, and the lifecycle reached a terminal state.

### Audit events

```text
Redemption payment executed
Holder principal recorded
Tokens burned
RED-001 Version 1 executed
```

## Step 17 â€” Final State Review

### Expected final state

```text
CA-001 Version 1: SUPERSEDED
CA-001 Version 2: EXECUTED
RED-001 Version 1: EXECUTED
Coupon duplicate attempt: REJECTED
Superseded version attempt: REJECTED
DBT redeemed: 1,000 tokens
DBT total supply: 0
Audit history: complete
```

### Final statement

> AssetOps demonstrates the operational layer that tokenized assets need after issuance: current ownership, corrected announcements, one-time payments, auditable history, and final redemption.

## 7. Failure Demonstrations

The following failures may be shown if time allows:

### 7.1 Execute before payable date

Expected result:

```text
NotPayableYet
```

No funds move and the action remains active.

### 7.2 Insufficient treasury funding

Expected result:

```text
InsufficientTreasuryBalance
```

No partial payments occur and the action remains executable after funding is corrected.

### 7.3 Unauthorized action creation

Expected result:

```text
AccessControlUnauthorizedAccount
```

No action is created.

### 7.4 Non-whitelisted transfer

Expected result:

```text
ReceiverNotWhitelisted
```

No balances change.

### 7.5 Redemption over-burn

Expected result:

```text
AmountExceedsBalance
```

No payment, burn, or execution state change occurs.

## 8. Recovery and Troubleshooting

### Wallet on wrong network

1. Stop the current action.
2. Show the network warning.
3. Switch to the configured network.
4. Refresh contract reads.
5. Recheck the deployment manifest.

### Transaction pending too long

1. Do not submit repeated transactions immediately.
2. Copy the transaction hash.
3. Check the configured explorer or local node.
4. Confirm whether the transaction is pending, confirmed, or reverted.
5. Refresh the dashboard only after the result is known.

### Indexer is behind

1. Show the latest indexed block.
2. Verify the blockchain receipt directly.
3. Explain that the read model is catching up.
4. Use direct contract reads for current balances and execution status.
5. Do not claim the event is missing until the indexer has synchronized.

### Sepolia demo fails

Use the local Hardhat fallback. Preserve the Sepolia transaction hash and error evidence for later review. Do not repeatedly spend testnet funds without diagnosing the failure.

## 9. Demo Timing

| Segment                            |    Target time |
| ---------------------------------- | -------------: |
| Problem and product introduction   |       1 minute |
| Asset creation and distribution    |      2 minutes |
| Announcement Version 1             |       1 minute |
| Holder transfer                    |       1 minute |
| Amendment to Version 2             |      2 minutes |
| Payment preview and execution      |      3 minutes |
| Duplicate and superseded rejection |      2 minutes |
| Audit history                      |       1 minute |
| Redemption                         |      3 minutes |
| Final summary                      |       1 minute |
| **Total**                          | **17 minutes** |

## 10. Demo Acceptance Checklist

The live demonstration is accepted when:

- [ ] The asset is identified as Demo Bond Token / DBT.
- [ ] Alice and Bob initially hold 500 DBT each.
- [ ] Bob transfers 200 DBT to Charlie.
- [ ] Current balances become Alice 500, Bob 300, Charlie 200.
- [ ] CA-001 Version 1 is created at 5%.
- [ ] CA-001 Version 2 is created at 4%.
- [ ] Version 1 remains visible and is marked `SUPERSEDED`.
- [ ] Version 2 is the only active payable version.
- [ ] Coupon payment uses the current holder state.
- [ ] Alice receives 20 payment tokens.
- [ ] Bob receives 12 payment tokens.
- [ ] Charlie receives 8 payment tokens.
- [ ] Duplicate execution is rejected.
- [ ] Superseded Version 1 execution is rejected.
- [ ] Audit history shows all important events.
- [ ] Redemption pays holders.
- [ ] Redeemed tokens are burned.
- [ ] Final execution status is visible.
- [ ] Explorer links or local transaction evidence are available.
- [ ] No real funds or private credentials are used.

## 11. References

[1]: ./PRD.md "AssetOps Product Requirements Document"
[2]: ./contract-design.md "AssetOps Master Smart-Contract Design"
[3]: ./API_CONTRACT.md "AssetOps API Contract"
[4]: ./TESTING_PLAN.md "AssetOps Master Testing Plan"
[5]: ./SECURITY.md "AssetOps Security Policy and Threat Model"
[6]: ./ui-ux.md "AssetOps Master UI/UX Specification"
[7]: ./development.md "AssetOps Development Plan and Workflow"
[8]: ./architecture.md "AssetOps System Architecture"
