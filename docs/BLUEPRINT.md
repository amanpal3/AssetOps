# W3A — Make Tokenized Assets Work After Launch

## Project Blueprint, Architecture, Tech Stack & Team Plan

---

## 1. Project Overview

**Problem:** Issuing a tokenized share or bond on-chain is the easy part. The hard part is keeping payments and ownership records correct for the asset's entire lifecycle — interest/coupon payments, redemptions at maturity, and corrections when a corporate-action announcement is revised after the fact.

**Our solution:** A corporate-action servicing engine that treats announcements as **versioned, first-class on-chain objects**. Every announcement (and its amendments) lives on-chain in an append-only registry, payments execute against the **live holder registry at execution time**, and an idempotency guard makes duplicate payouts structurally impossible.

**One-line pitch:**

> Corporate actions as first-class on-chain objects — versioned announcements, snapshot-accurate payouts, and provably no double payments, replicating DTC-grade asset servicing without the depository.

### What we deliver (mapped to judging requirements)

| #       | Requirement                                                             | How we satisfy it                                                                                                          |
| ------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1       | Payments computed against current holder registry at execution time     | Token contract balances ARE the registry; PaymentExecutor reads live balances inside the payout transaction                |
| 2       | ≥ 2 lifecycle actions end-to-end                                        | Coupon/interest payment + principal redemption (burn-on-pay)                                                               |
| 3       | Corrected announcement is the one paid; original + correction auditable | Append-only version chain: amendments never mutate, they append with `supersedes` link; only the ACTIVE version is payable |
| 4       | No duplicate payouts                                                    | `executed[actionId]` flag set atomically with payout; second call reverts on-chain                                         |
| 5       | Live demo: announce → correct → pay correctly once → duplicate rejected | Seeded Sepolia demo with visible revert on replay attack                                                                   |
| Bonus 1 | Holder transfers between announcement & payment                         | Registry read at execution time; demo includes a mid-cycle transfer                                                        |
| Bonus 2 | Public queryable history of all announcements & corrections             | Event log + subgraph/REST API + dashboard "Announcement History" page                                                      |

---

## 2. Architecture Blueprint

### 2.1 Core Design Principles

1. **The token is the registry.** No separate off-chain holder database. Every payment reads token balances at the moment of execution — no stale snapshots.
2. **Announcements are immutable and versioned.** An amendment never overwrites; it appends a new version linked via `supersedes`. The active version is resolved by pointer. This mirrors how DTCC processes corrected announcements in traditional markets.
3. **Idempotency by construction.** One action = one payout, enforced by an on-chain flag written in the same transaction as the distribution loop.
4. **Everything auditable.** Every state change emits structured events; original and amended announcements remain queryable forever.

### 2.2 Contract Architecture (4 core contracts)

```
┌─────────────────────────────────────────────────────────────────┐
│                        SecurityToken                            │
│  ERC-20 + transfer hooks + allowlist (ERC-1404 style)           │
│  Balances = live holder registry                                │
│  Roles: MINTER_ROLE, AGENT_ROLE (PAUSER, upgrade path noted)    │
└──────────────┬──────────────────────────────────────────────────┘
               │ reads balances / receives burns
┌──────────────▼──────────────────────────────────────────────────┐
│                  CorporateActionRegistry                        │
│  append-only announcements:                                     │
│  {actionId, asset, type, rate, recordDate, payableDate,         │
│   amountPerToken, version, supersedes, ipfsHash, status}        │
│  ANNOUNCED → SUPERSEDED / ACTIVE                                │
│  amend() appends new version, marks old SUPERSEDED              │
│  getActiveVersion(actionId) resolves the payable version        │
└──────────────┬──────────────────────────────────────────────────┘
               │ validates version & date & idempotency
┌──────────────▼──────────────────────────────────────────────────┐
│                      PaymentExecutor                            │
│  executeCoupon(actionId):                                       │
│    - require ACTIVE version (not superseded)                    │
│    - require payableDate passed                                 │
│    - require !executed[actionId]  ← duplicate guard             │
│    - pull payment currency from issuer treasury                 │
│    - Option A (demo): push loop, payment = balance × rate       │
│    - Option B (scale): Merkle root snapshot + holder claims     │
│  executeRedemption(actionId):                                   │
│    - payment = balance × amountPerToken                         │
│    - burn tokens as it pays → registry self-updates             │
└──────────────┬──────────────────────────────────────────────────┘
               │ transfers
┌──────────────▼──────────────────────────────────────────────────┐
│              PaymentCurrency (mock USDC, ERC-20)                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 The Announcement Lifecycle (state machine)

```
   announce(v1: coupon 5%)
        │
        ▼
   [ANNOUNCED / ACTIVE v1] ──── amend() ────► [SUPERSEDED v1] (kept forever, queryable)
        ▲                                          │
        │                                          ▼
        └──────────────────────────── [ACTIVE v1.1: coupon 4%]
                                                   │
                                    payableDate reached,
                                    issuer funds executor
                                                   │
                                                   ▼
                                          [EXECUTED v1.1]
                                    (payout = 4%, paid ONCE)
                                                   │
                                    any replay / payment
                                    of v1 or v1.1 → REVERT
```

### 2.4 Amended-Announcement Data Model

```solidity
struct Announcement {
    bytes32 id;            // unique action id
    address asset;         // security token
    ActionType kind;       // COUPON, REDEMPTION
    uint256 rateBps;       // e.g. 400 = 4%  (for coupons)
    uint256 amountPerToken;// for redemptions
    uint64 recordDate;     // entitlement snapshot reference
    uint64 payableDate;
    uint16 version;        // 1, 2, 3 ...
    bytes32 supersedes;    // id of the version this replaces (0 if original)
    string docHash;        // IPFS hash of human-readable announcement
    Status status;         // ACTIVE, SUPERSEDED, EXECUTED, CANCELLED
    address announcedBy;
    uint64 announcedAt;
}
```

**Invariant (tested):** only the latest version in the chain can ever reach `EXECUTED`; a `SUPERSEDED` version is permanently unpayable; `EXECUTED` is terminal and re-entry reverts.

### 2.5 Gas / Scale Strategy (say this to judges)

- Demo mode: push loop to ≤ ~200 holders.
- Production mode: Merkle-root snapshot at payment time; holders claim via `MerkleProof.verify`. Handles 100k+ holders and the "holders changed between announcement and payment" case cleanly.

### 2.6 Double-Entry Accounting (differentiator)

Every payout emits balanced journal events — auditors' language, and only Centrifuge does anything comparable in production:

```
PaymentAccrued:   debit InterestExpense        credit HoldersPayable
PaymentExecuted:  debit HoldersPayable         credit PaymentCurrency (per holder)
Redemption:       debit PrincipalPayable       credit PaymentCurrency + burn tokens
```

---

## 3. Project Structure

```
w3a-rwa-lifecycle/
├── README.md                       # pitch + demo walkthrough + judging-matrix mapping
├── packages/
│   ├── contracts/                  # Hardhat project
│   │   ├── contracts/
│   │   │   ├── SecurityToken.sol          # ERC-20 + allowlist + hooks
│   │   │   ├── PaymentCurrency.sol        # mock USDC
│   │   │   ├── CorporateActionRegistry.sol# versioned announcements
│   │   │   ├── PaymentExecutor.sol        # idempotent payout engine
│   │   │   └── mocks/                     # test helpers
│   │   ├── test/
│   │   │   ├── SecurityToken.test.ts
│   │   │   ├── Registry.test.ts           # versioning / amendment invariants
│   │   │   ├── Executor.test.ts           # payout math, duplicate reverts
│   │   │   └── integration.test.ts        # full lifecycle scenario
│   │   ├── scripts/
│   │   │   ├── deploy.ts
│   │   │   └── seed-demo.ts               # mints holders, funds treasury,
│   │   │                                  # announces, amends, transfers
│   │   └── hardhat.config.ts
│   ├── indexer/                    # event indexer / subgraph
│   │   ├── subgraph.yaml
│   │   └── schema.graphql          # Announcement, Version, Payment, Holder
│   └── frontend/                   # React dashboard
│       └── src/
│           ├── pages/
│           │   ├── Registry.tsx        # live holder table
│           │   ├── Announcements.tsx   # feed w/ version badges
│           │   ├── History.tsx         # audit explorer (bonus 2)
│           │   └── Demo.tsx            # guided live-demo control panel
│           ├── components/
│           └── hooks/
├── docs/
│   ├── DESIGN_DECISIONS.md         # record-date vs pay-date, push vs pull,
│   │                               # why not full ERC-3643 (upgrade path)
│   └── DEMO_SCRIPT.md              # minute-by-minute live demo plan
└── .github/workflows/ci.yml        # lint + test on PR
```

---

## 4. Technology Stack

| Layer                  | Choice                                                        | Why                                                                                |
| ---------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Language               | Solidity ^0.8.24                                              | Industry standard, best tooling                                                    |
| Framework              | Hardhat + hardhat-toolbox                                     | Fast iteration, chai tests, deploy scripts                                         |
| Base token             | OpenZeppelin ERC-20 + AccessControl + Pausable                | Audited primitives                                                                 |
| Transfer control       | ERC-1404-style allowlist (`detectTransferRestriction`)        | Pragmatic 80%; documented upgrade path to ERC-3643 for multi-jurisdiction identity |
| Payments               | Mock ERC-20 stablecoin (PaymentCurrency)                      | Payouts are real token transfers, provable in explorer                             |
| Idempotency / snapshot | `mapping` guards + OpenZeppelin MerkleProof                   | Duplicate-proof; scale story for judges                                            |
| Tests                  | chai + ethers, optional Foundry fuzz on invariants            | Proof, not promises                                                                |
| Network                | Sepolia testnet (+ Hardhat local for CI)                      | Required by brief; free, public, verifiable                                        |
| RPC                    | Alchemy / Infura                                              | Reliable Sepolia access                                                            |
| Indexer                | The Graph subgraph (or ethers.js event indexer + simple REST) | Bonus: public queryable history                                                    |
| Frontend               | React + Vite + viem/wagmi, Tailwind                           | Fast, modern wallet UX                                                             |
| Docs/anchoring         | IPFS (announcement PDF/text hash)                             | "On-chain-anchored" legal-grade provenance                                         |

**Wallets for demo:** 5–6 funded burner wallets (issuer, treasury, 4 holders) seeded by faucet.

---

## 5. Team Plan — 3 Members

### Roles

| Member   | Role                    | Owns                                                                    |
| -------- | ----------------------- | ----------------------------------------------------------------------- |
| Member A | **Smart Contract Lead** | Contracts, tests, security invariants                                   |
| Member B | **Protocol/Infra Lead** | Registry design co-owner, deploy pipeline, indexer/API, Sepolia ops     |
| Member C | **Product/Demo Lead**   | React dashboard, demo script, README/pitch, integration testing from UI |

> Pair-program the `CorporateActionRegistry` versioning logic between A and B during Phase 1 — it is the highest-risk component and both need to understand it.

### Timeline (48-hour hackathon)

#### Phase 1 — Foundation (Hour 0–10)

| Task                                                                                           | Owner |
| ---------------------------------------------------------------------------------------------- | ----- |
| Hardhat scaffold, OZ imports, CI, repo + branch rules                                          | A     |
| `SecurityToken.sol` + allowlist + roles + tests                                                | A     |
| `PaymentCurrency.sol` mock USDC + tests                                                        | B     |
| `CorporateActionRegistry.sol` — announce/amend/getActiveVersion + versioning tests (pair w/ A) | B     |
| Frontend scaffold, wallet connect, contract bindings                                           | C     |
| Write `DESIGN_DECISIONS.md` (record-date vs pay-date, push vs pull, why not ERC-3643)          | C     |

**Checkpoint (H10):** can announce + amend an announcement on local node, invariants tested.

#### Phase 2 — Execution Engine (Hour 10–24)

| Task                                                                      | Owner |
| ------------------------------------------------------------------------- | ----- |
| `PaymentExecutor.sol` — coupon push loop + duplicate guard + tests        | A     |
| `executeRedemption` — pay + burn path + tests                             | A     |
| Integration test: announce → transfer → amend → pay → replay-revert       | B     |
| Foundry fuzz (optional): "total paid ≤ funded" under arbitrary call order | A/B   |
| Subgraph schema + indexing Announcement/Payment events                    | B     |
| Dashboard: Holder Registry + Announcement feed with version badges        | C     |

**Checkpoint (H24):** full lifecycle passes in one integration test on local network.

#### Phase 3 — Deploy + Demo (Hour 24–40)

| Task                                                                                                                     | Owner         |
| ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| Sepolia deployment + contract verification (etherscan)                                                                   | B             |
| `seed-demo.ts` — full scenario: mint 4 holders, announce 5% coupon, transfer between holders, amend to 4%, fund treasury | B             |
| Dashboard: History/audit page + Demo control panel with "Attempt duplicate payout" button that surfaces the revert       | C             |
| Rehearse live demo end-to-end, record backup video                                                                       | C             |
| README: pitch, judging-matrix mapping, architecture diagram                                                              | C (A reviews) |
| Security pass: reentrancy (ReentrancyGuard), input bounds, role matrix review                                            | A             |

**Checkpoint (H40):** demo works on Sepolia from the dashboard, backup video recorded.

#### Phase 4 — Polish + Buffer (Hour 40–48)

| Task                                                                                                                          | Owner               |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Fix demo friction, gas tuning, UI polish                                                                                      | all                 |
| Practice pitch (3 min) + Q&A prep ("what about 100k holders?", "why not ERC-3643?", "what if issuer funds are insufficient?") | C leads, all answer |
| Freeze code; no new features                                                                                                  | all                 |

### Ownership rules (avoids merge pain)

- `packages/contracts/**` — A merges; B co-owns registry files
- `packages/indexer/**`, scripts, deploy — B merges
- `packages/frontend/**`, docs — C merges
- Nobody edits another's area without a PR review — even at 3 AM.
- One shared `demo-state.md` in repo root tracking the live-demo wallet addresses and tx hashes so any member can drive the demo if needed.

### Risk register

| Risk                                       | Mitigation                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| Registry versioning bug pays wrong version | Fuzz/invariant tests in Phase 2; only ACTIVE version payable by code, not by convention |
| Sepolia congestion / faucet delays         | Fund wallets on Day 1; keep local-network demo as fallback                              |
| Push loop exceeds block gas                | Demo uses ≤ 10 holders; Merkle claim path as scale answer                               |
| Frontend integration slips                 | C starts bindings in Phase 1, not after contracts are "done"                            |
| Demo-day wallet issues                     | Hardware-independent: any member can drive via `demo-state.md`; backup video            |

---

## 6. Live Demo Script (5 minutes)

1. **Setup (30s):** Sepolia dashboard — show 4 whitelisted holders with token balances; treasury wallet holding mock USDC.
2. **Announce (45s):** Issue coupon announcement v1 — "pay 5% interest on date Y". Show it on the Announcement feed and on Etherscan.
3. **Transfer mid-cycle (45s, bonus):** Holder 2 transfers half their tokens to Holder 4. Registry page updates live.
4. **Amend (45s):** Announcement corrected to 4%. Feed now shows `v1 SUPERSEDED` (strikethrough) and `v1.1 ACTIVE` — both clickable, both immutable.
5. **Pay (60s):** Execute. Dashboard shows per-holder amounts computed at 4% against **current** balances — Holder 4 (new holder) received payment, Holder 2's reduced balance paid correctly. Journal events visible in History page.
6. **Attack (45s):** Press the red **"Attempt duplicate payout"** button. Show the reverted transaction with the `ALREADY_EXECUTED` reason on Etherscan. Then try paying the _superseded_ v1 — also reverts.
7. **Redemption (45s):** Announce maturity redemption → execute → holders paid principal, tokens burned, supply drops to zero on the registry page.
8. **Close (15s):** "Minting the token was the easy part — everything you just saw is the part everyone else skips."

---

## 7. Key Differentiators (recap for the pitch)

1. **Versioned announcements as first-class on-chain objects** — the DTC-grade amendment workflow, on-chain, append-only.
2. **Idempotency by construction** — duplicate payouts revert at the protocol level, not by operator discipline.
3. **Registry-accurate payments** — computed against live balances at execution, surviving mid-cycle transfers.
4. **Double-entry payout accounting** — every distribution emits balanced journal entries; auditor-friendly, Centrifuge is the only major platform doing this.
5. **A visible failure** — the demo intentionally shows a rejected attack. Judges remember the revert.
6. **Honest standards rationale** — ERC-1404 now for pragmatism, documented ERC-3643 upgrade path for multi-jurisdiction identity; we explain why, rather than chasing the fanciest standard.

---

_Prepared for team W3A — Aman Pal + 2 teammates. Adapt member names and timeline to your actual hackathon length._
