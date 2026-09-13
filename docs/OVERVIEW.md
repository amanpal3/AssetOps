# W3A — Make Tokenized Assets Work After Launch

## Project Overview

---

### The Problem in One Paragraph

Issuing a tokenized share or bond on-chain is the easy part. The harder, usually-ignored part is keeping payments and ownership records correct for the asset's entire lifecycle afterward — interest/coupon payments, redemptions at maturity, and corrections when a corporate-action announcement needs to be revised after the fact. Most tokenization demos stop at "mint the token" and never touch this lifecycle problem. The biggest players in the industry (BlackRock's BUIDL via Securitize, Ondo, Centrifuge) deliberately route around it — baking yield into NAV, batching into epochs, or handling corporate actions off-chain through traditional transfer agents. No deployed, public, on-chain system treats a corporate-action announcement — including amendments — as a first-class auditable object with duplicate-proof execution. That gap is our opportunity.

---

### What We Are Building

A corporate-action servicing engine for tokenized assets. It treats announcements as **versioned, first-class on-chain objects** in an append-only registry. Every announcement and its amendments live on-chain permanently; payments execute against the **live holder registry at execution time** (not a stale snapshot); and an idempotency guard makes duplicate payouts structurally impossible — the second attempt reverts on-chain.

We implement two lifecycle actions end-to-end:

1. **Coupon / interest payment** — pro-rata distribution to all current holders
2. **Principal redemption at maturity** — pay principal and burn the corresponding tokens

And we handle the corrected-announcement scenario: the amended version must be the one actually paid, and both the original and the correction remain in an auditable record.

---

### One-Line Pitch

> Corporate actions as first-class on-chain objects — versioned announcements, snapshot-accurate payouts, and provably no double payments, replicating DTC-grade asset servicing without the depository.

---

### Why This Matters (Industry Context)

Citi's Tokenization 2030 report identifies "lack of native issuance and end-to-end lifecycle support" as a primary reason early tokenization platforms failed, specifically calling out the absence of managing "everything from initial issuance and distribution to servicing complex corporate actions... and finally, redemption or maturity."

A 2026 standards report by RedStone/Credora/Gauntlet/Dune surveyed every major deployment and concluded that corporate actions are "where tokenisation promises the most and, so far, delivers the least on the contract side." The report documents how incumbents dodge the problem:

- **Ondo** avoids distribution events entirely — yield is baked into NAV/token price
- **Securitize** (powers BlackRock's $2B+ BUIDL) handles most corporate actions off-chain through its SEC-registered transfer agent
- **Centrifuge** batches everything into epochs processed at verified NAV
- **WisdomTree** lets investors elect payouts in its USDW stablecoin — one of the few real distribution mechanisms

In BlackRock's BUIDL — the most fully documented lifecycle in the category — the on-chain surface is literally just "mint, transfer, burn," while identity checks, wires, cutoff windows, NAV strikes, and custody are all off-chain and contractual.

The honest answer to "does this solution exist in real life?" is: **partially, and mostly off-chain.** There is no deployed, public, on-chain system that treats a corporate-action announcement (including amendments) as a first-class auditable object with duplicate-proof execution. That is our opening.

---

### How TradFi Models This (Our Design Mirrors It)

Traditional markets solved this decades ago with a precise pipeline at the depository (DTC/DTCC) level:

1. **Issuer announces** a corporate action (coupon, dividend, redemption)
2. **Paying agent validates** the announcement
3. **Record date** snapshot determines entitlements — who holds what at a specific moment
4. **Payment runs** on the payable date against the record-date entitlements
5. **Corrections** flow through amended announcements with full audit trails — the original is never overwritten, the amendment is a new version

Our architecture replicates this pipeline's invariants on-chain:

- **Record date ≠ payment date.** Entitlement is fixed at a snapshot, but payment computes against the registry at execution time. We understand both models and implement record-date semantics with on-chain enforcement.
- **Announcements are immutable, amendments are new versions.** A corrected announcement doesn't overwrite the original — both live in the on-chain audit record, linked by a `supersedes` pointer.
- **Idempotency.** DTC guarantees no double payment per event. On-chain we get this natively via a `mapping(bytes32 actionId => bool executed)` — this is where smart contracts are actually stronger than TradFi batch files.

---

### Requirements Satisfaction Matrix

| #       | Requirement                                                             | How We Satisfy It                                                                                                          |
| ------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1       | Payments computed against current holder registry at execution time     | Token contract balances ARE the registry; PaymentExecutor reads live balances inside the payout transaction                |
| 2       | ≥ 2 lifecycle actions end-to-end                                        | Coupon/interest payment + principal redemption (burn-on-pay)                                                               |
| 3       | Corrected announcement is the one paid; original + correction auditable | Append-only version chain: amendments never mutate, they append with `supersedes` link; only the ACTIVE version is payable |
| 4       | No duplicate payouts                                                    | `executed[actionId]` flag set atomically with payout; second call reverts on-chain                                         |
| 5       | Live demo: announce → correct → pay correctly once → duplicate rejected | Seeded Sepolia demo with visible revert on replay attack                                                                   |
| Bonus 1 | Holder transfers between announcement & payment                         | Registry read at execution time; demo includes a mid-cycle transfer                                                        |
| Bonus 2 | Public queryable history of all announcements & corrections             | Event log + subgraph/REST API + dashboard "Announcement History" page                                                      |

---

### Key Differentiators

1. **Versioned announcements as first-class on-chain objects** — the DTC-grade amendment workflow, on-chain, append-only. Nobody else builds the amendment graph.
2. **Idempotency by construction** — duplicate payouts revert at the protocol level, not by operator discipline. One action = one payout, enforced on-chain.
3. **Registry-accurate payments** — computed against live balances at execution, surviving mid-cycle holder transfers.
4. **Double-entry payout accounting** — every distribution emits balanced journal entries (debit InterestExpense, credit HoldersPayable, then debit Payable, credit Cash per holder). Auditor-friendly. Only Centrifuge does anything comparable in production.
5. **A visible failure** — the demo intentionally shows a rejected attack. Judges remember the revert.
6. **Honest standards rationale** — ERC-1404 now for pragmatism, documented ERC-3643 upgrade path for multi-jurisdiction identity. We explain why we chose pragmatism over the fanciest standard.

---

### Architecture at a Glance

Four core smart contracts:

```
SecurityToken (ERC-20 + allowlist)   ← the holder registry (balances = truth)
        │
CorporateActionRegistry             ← append-only versioned announcements
        │                               announce / amend / getActiveVersion
        │
PaymentExecutor                     ← idempotent payout engine
        │                               coupon push + redemption burn-on-pay
        │
PaymentCurrency (mock USDC)          ← actual payout token transfers
```

Announcements are append-only structs with a `supersedes` pointer. `amend()` never mutates — it appends a new version, marks the old one `SUPERSEDED`, and updates the active-version pointer. Only the ACTIVE version can ever reach `EXECUTED`. A `SUPERSEDED` version is permanently unpayable. An `EXECUTED` version is terminal and re-entry reverts.

---

### Live Demo Flow (5 minutes)

1. **Setup (30s):** Sepolia dashboard — 4 whitelisted holders with token balances; treasury wallet holding mock USDC.
2. **Announce (45s):** Issue coupon announcement v1 — "pay 5% interest on date Y". Visible on the Announcement feed and on Etherscan.
3. **Transfer mid-cycle (45s, bonus):** Holder 2 transfers half their tokens to Holder 4. Registry page updates live.
4. **Amend (45s):** Announcement corrected to 4%. Feed shows `v1 SUPERSEDED` (strikethrough) and `v1.1 ACTIVE` — both clickable, both immutable.
5. **Pay (60s):** Execute. Per-holder amounts computed at 4% against current balances — Holder 4 (new holder) received payment, Holder 2's reduced balance paid correctly. Journal events visible in History page.
6. **Attack (45s):** Press the red "Attempt duplicate payout" button. Show the reverted transaction with `ALREADY_EXECUTED` reason on Etherscan. Try paying the superseded v1 — also reverts.
7. **Redemption (45s):** Announce maturity redemption → execute → holders paid principal, tokens burned, supply drops to zero.
8. **Close (15s):** "Minting the token was the easy part — everything you just saw is the part everyone else skips."

---

### Technology Stack Summary

| Layer                  | Choice                                                         |
| ---------------------- | -------------------------------------------------------------- |
| Language               | Solidity ^0.8.24                                               |
| Framework              | Hardhat + hardhat-toolbox                                      |
| Base token             | OpenZeppelin ERC-20 + AccessControl + Pausable                 |
| Transfer control       | ERC-1404-style allowlist (upgrade path to ERC-3643 documented) |
| Payments               | Mock ERC-20 stablecoin (PaymentCurrency)                       |
| Idempotency / snapshot | Mapping guards + OpenZeppelin MerkleProof                      |
| Tests                  | chai + ethers, optional Foundry fuzz on invariants             |
| Network                | Sepolia testnet (+ Hardhat local for CI)                       |
| Indexer                | The Graph subgraph (or ethers.js event indexer)                |
| Frontend               | React + Vite + viem/wagmi, Tailwind                            |
| Docs/anchoring         | IPFS (announcement PDF/text hash)                              |

---

### Team Structure (3 Members)

| Member   | Role                | Owns                                                                    |
| -------- | ------------------- | ----------------------------------------------------------------------- |
| Member A | Smart Contract Lead | Contracts, tests, security invariants                                   |
| Member B | Protocol/Infra Lead | Registry design co-owner, deploy pipeline, indexer/API, Sepolia ops     |
| Member C | Product/Demo Lead   | React dashboard, demo script, README/pitch, integration testing from UI |

The highest-risk component — `CorporateActionRegistry` versioning — is pair-programmed between A and B in Phase 1.

---

### Project Structure

```
w3a-rwa-lifecycle/
├── README.md
├── packages/
│   ├── contracts/                  # Hardhat project
│   ├── indexer/                    # event indexer / subgraph
│   └── frontend/                   # React dashboard
├── docs/
│   ├── DESIGN_DECISIONS.md
│   └── DEMO_SCRIPT.md
└── .github/workflows/ci.yml
```

---

_See `technicals.md` for the full technical specification — contract interfaces, data models, state machines, and security considerations._
