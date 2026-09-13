# AssetOps: Three-Member, Eight-Hour Hackathon Guide

## 1. What AssetOps does, explained simply

Imagine that a company sells 1,000 digital bond certificates. The blockchain can record who owns the certificates, but the difficult work starts afterward.

Someone must announce an interest payment. Someone must correct the announcement if the interest rate is wrong. Someone must calculate who should receive money. Someone must stop the same payment from being made twice. At the end of the bond, someone must pay back the principal and destroy the digital certificates.

**AssetOps is the operations machine for these jobs.**

A simple way to remember the system is:

```text
Blockchain = the official notebook
Backend    = the librarian who copies and organizes the notebook
Frontend   = the control panel people use
Wallet     = the user's signature pen
Database   = a searchable copy of the notebook
IPFS       = a place for announcement documents
```

The database and frontend are helpful, but they are not the official financial authority. The blockchain is the authority for balances, action status, payment execution, redemption, and burning.

## 2. The three members

The hackathon has three people. Each person owns one major area, but the areas must connect during integration.

| Member   | Area                | Main job                                                                | Easy explanation              |
| -------- | ------------------- | ----------------------------------------------------------------------- | ----------------------------- |
| Member 1 | Backend and indexer | Read blockchain events, save searchable data, and expose APIs           | The librarian                 |
| Member 2 | Frontend            | Build the dashboard, forms, wallet connection, and transaction feedback | The control panel builder     |
| Member 3 | Blockchain          | Build and test the smart contracts and deploy them                      | The official notebook builder |

### Important team rule

The blockchain member does not decide the UI alone. The frontend member does not invent financial calculations. The backend member does not create a second financial ledger. Each member follows the same contract and API rules.

## 3. Technology used by the whole project

| Part                   | Technology                                                                   | Why it is used                                                         |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Smart contracts        | Solidity `^0.8.24`                                                           | Writes the official financial rules                                    |
| Contract framework     | Hardhat                                                                      | Compiles, deploys, and tests contracts                                 |
| Smart-contract library | OpenZeppelin Contracts 5.x                                                   | Provides safe ERC-20, roles, pause controls, and reentrancy protection |
| Blockchain client      | viem or Ethers.js                                                            | Lets the backend and frontend talk to the blockchain                   |
| Frontend               | React + Vite + TypeScript                                                    | Builds a fast web dashboard                                            |
| Frontend styling       | Tailwind CSS                                                                 | Creates a clean responsive interface quickly                           |
| Wallet connection      | wagmi + viem                                                                 | Connects MetaMask or another EVM wallet                                |
| Backend API            | A small TypeScript API service, or the repository's existing FastAPI service | Provides read endpoints and health checks                              |
| Indexer                | viem or Ethers.js event listener                                             | Copies confirmed blockchain events into the database                   |
| Database               | SQLite for the hackathon; PostgreSQL for deployment                          | Stores searchable read models and history                              |
| Local blockchain       | Hardhat Network                                                              | Gives the team a fast private blockchain                               |
| Public demo blockchain | Ethereum Sepolia                                                             | Lets judges see a real public testnet transaction                      |
| Documents              | IPFS-compatible storage                                                      | Stores the announcement document while its hash is anchored on chain   |
| Source control         | GitHub                                                                       | Merges the three members' work through pull requests                   |

## 4. What the blockchain part means

The blockchain is a shared computer that many people can inspect. A smart contract is a program living on that computer. Once a valid transaction changes the contract, everyone can verify the result.

For AssetOps, the blockchain contains four important contracts.

| Contract                  | Job                                                                                           | Child-friendly explanation                  |
| ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `SecurityToken`           | Stores asset balances, transfers, allowlist rules, holder list, minting, pausing, and burning | The digital bond certificate counter        |
| `PaymentCurrency`         | Mock USDC-style token used to pay coupons and principal                                       | The fake money used in the demo             |
| `CorporateActionRegistry` | Stores action families, versions, dates, rates, statuses, and document hashes                 | The official calendar and announcement book |
| `PaymentExecutor`         | Calculates and sends payments, prevents duplicates, and burns tokens for redemption           | The payment machine                         |

### Blockchain authority rules

- The contract balance is the real token balance.
- The contract status is the real action status.
- An old superseded version stays visible but cannot be paid.
- A payable version executes only once.
- A failed payment reverts everything.
- Redemption pays principal and burns the exact tokens used for the calculation.
- A frontend preview is only an estimate.
- A backend database row is only a copy of confirmed events.

### Member 3 technology

Member 3 uses:

- Solidity `^0.8.24`.
- Hardhat for compilation, local deployment, and tests.
- OpenZeppelin Contracts 5.x.
- TypeScript deployment scripts.
- viem or Ethers.js for deployment helpers and direct contract reads.
- Hardhat Network for local testing.
- Ethereum Sepolia for the public demo.
- GitHub pull requests and CI for review.

### Member 3 implementation steps

#### Step 1: Create the project

Member 3 creates the Hardhat project, installs Solidity and OpenZeppelin dependencies, and creates folders for contracts, tests, and deployment scripts.

#### Step 2: Build `SecurityToken`

The contract should:

1. Behave like an ERC-20 token.
2. Use `AccessControl`.
3. Support `MINTER_ROLE`.
4. Support a pause mechanism.
5. Check allowlist restrictions.
6. Maintain a monotonic holder list for the small-holder MVP.
7. Use the OpenZeppelin 5.x `_update` hook for transfer restrictions.
8. Expose `burnFromHolder(holder, amount)` for the authorized redemption path.
9. Emit clear transfer, holder, mint, pause, and burn events.

#### Step 3: Build `PaymentCurrency`

Member 3 creates a simple mock USDC-style ERC-20. The treasury receives tokens and approves the `PaymentExecutor` to spend them.

#### Step 4: Build `CorporateActionRegistry`

The registry stores:

- `CA-001` or another action-family identifier.
- Version number.
- Action type: `COUPON`, `INTEREST`, or `REDEMPTION`.
- Status: `DRAFT`, `ACTIVE`, `SUPERSEDED`, `EXECUTED`, or `CANCELLED`.
- Record date and payable date.
- Rate or principal terms.
- Document hash or content identifier.
- Announcer address.
- Superseded version.

An amendment never edits Version 1. It creates Version 2 and marks Version 1 `SUPERSEDED`.

#### Step 5: Build `PaymentExecutor`

Member 3 implements:

1. Active-version validation.
2. Action-type validation.
3. Payable-date validation.
4. Duplicate-execution protection.
5. Live-balance calculation.
6. Treasury balance validation.
7. Treasury allowance validation.
8. Safe payment-currency transfers.
9. Exact redemption burns.
10. `ReentrancyGuard` protection.
11. Atomic revert behavior.
12. Aggregate and per-holder events.

#### Step 6: Write tests

The minimum tests are:

- A normal transfer succeeds for allowed holders.
- A restricted transfer fails.
- Unauthorized users cannot mint, announce, execute, or burn.
- Version 2 supersedes Version 1.
- Version 1 cannot execute after supersession.
- A 4% coupon pays Alice 20, Bob 12, and Charlie 8 in the required example.
- A second execution fails.
- Insufficient treasury balance fails.
- Insufficient allowance fails.
- A failed holder payment reverts all payments.
- Redemption pays principal and burns exact balances.
- Final token supply becomes zero after all holders redeem.

#### Step 7: Deploy and give the team addresses

Member 3 deploys locally, grants the required roles, funds the payment treasury, and sends the team a manifest containing:

- Network name.
- Chain ID.
- Contract addresses.
- Deployment block.
- Explorer URL.
- ABI version.
- Role assignments.

Private keys never go into the manifest.

### Member 3 AI prompts

#### Prompt A: contract architecture

```text
You are the blockchain engineer for AssetOps. Build an MVP Solidity architecture using Solidity ^0.8.24, Hardhat, and OpenZeppelin Contracts 5.x. The system has SecurityToken, PaymentCurrency, CorporateActionRegistry, and PaymentExecutor. The blockchain is the only financial source of truth. The backend and frontend are not authorities. Explain storage, roles, events, state transitions, and external calls before writing code. Do not use the obsolete _beforeTokenTransfer hook; use the OpenZeppelin 5.x-compatible _update hook.
```

#### Prompt B: security review

```text
Review this AssetOps smart-contract design as a security auditor. Check AccessControl, least privilege, pause behavior, reentrancy protection, SafeERC20 handling, checks-effects-interactions, duplicate execution, treasury balance and allowance validation, superseded action versions, atomic rollback, and exact holder burns. List every vulnerability or missing test. Do not assume the database or frontend is trustworthy.
```

#### Prompt C: payment logic

```text
Implement or review PaymentExecutor for AssetOps. Coupon and interest actions must use live SecurityToken balances at execution time. Redemption must pay principal and call an explicit role-authorized burnFromHolder for exactly the balance used in the calculation. A failed transfer or burn must revert the full transaction. Include custom errors, events, duplicate guards, rounding rules, and tests for Alice 500, Bob 300, Charlie 200 at 4%, producing 20, 12, and 8 payment tokens.
```

#### Prompt D: deployment

```text
Create a Hardhat deployment plan for AssetOps on Hardhat Network and Ethereum Sepolia. Output deployment order, constructor arguments, role grants, treasury funding, allowance setup, manifest fields, verification checks, and rollback or recovery steps. Never place private keys in source code or deployment manifests.
```

## 5. What the backend and indexer part means

The backend has two related jobs.

The **indexer** watches confirmed blockchain events. It copies those events into a database so people can search quickly.

The **API** answers questions for the frontend, such as:

- What assets exist?
- What is Alice's current indexed balance?
- Which action version is active?
- What payment history exists?
- Is the indexer synchronized?

The backend does not type a new balance into the database to make a payment happen. It reads the chain and records what the chain already confirmed.

### Member 1 technology

Member 1 uses:

- TypeScript with a small API framework, or the repository's existing Python FastAPI service.
- viem or Ethers.js for the blockchain client and event listener.
- SQLite for the eight-hour local demo.
- PostgreSQL as the persistent deployment database.
- REST API under `/api/v1`.
- Schema validation for every request.
- GitHub and automated tests.

For an eight-hour build, Member 1 should choose one backend runtime and avoid building multiple services. If the existing project already uses FastAPI, keep FastAPI. If starting a clean AssetOps service, a small TypeScript API with viem reduces language switching with the frontend.

### Member 1 implementation steps

#### Step 1: Read the deployment manifest

The backend reads the network name, chain ID, deployment block, explorer URL, ABI version, and contract addresses. It checks that the configured chain matches the RPC endpoint.

#### Step 2: Create the database tables

The minimum tables or collections are:

- Assets.
- Holders.
- Balances.
- Transfers.
- Actions.
- Action versions.
- Executions.
- Payments.
- Redemptions.
- Audit events.
- Indexer checkpoints.

All amounts are stored as integer base units. For example, a token amount is stored as a string in the API, not as a JavaScript floating-point number.

#### Step 3: Build the indexer

The indexer starts at the deployment block and reads contract events. For every event it stores:

- Chain ID.
- Contract address.
- Transaction hash.
- Block number.
- Block timestamp.
- Log index.
- Event name.
- Event arguments.

The unique event key is:

```text
(chainId, transactionHash, logIndex)
```

This means that if the same event is delivered twice, the database ignores the second copy.

#### Step 4: Build projections

When the indexer sees a `Transfer` event, it updates the transfer history and the latest balance projection.

When it sees an action-created event, it creates an action-version row.

When it sees a supersession event, it marks the old version `SUPERSEDED` and the new version `ACTIVE`.

When it sees a payment event, it adds a payment row for the holder.

When it sees a burn event, it adds a redemption row and updates the projected supply.

#### Step 5: Build the API

The important endpoints are:

| Endpoint                           | What it says                                             |
| ---------------------------------- | -------------------------------------------------------- |
| `GET /api/v1/health`               | Is the API, database, RPC, and indexer working?          |
| `GET /api/v1/network`              | Which chain and contracts are configured?                |
| `GET /api/v1/assets`               | What token assets exist?                                 |
| `GET /api/v1/holders`              | Who are the holders and what are their indexed balances? |
| `GET /api/v1/actions`              | What action families and active versions exist?          |
| `GET /api/v1/actions/:id/versions` | What is the complete immutable version history?          |
| `GET /api/v1/actions/:id/preview`  | What is the estimated payment using current data?        |
| `GET /api/v1/payments`             | What payments have been confirmed?                       |
| `GET /api/v1/redemptions`          | What redemptions and burns have been confirmed?          |
| `GET /api/v1/audit`                | What is the event history?                               |

Every response that comes from the indexer should include `indexedBlock`, `chainHead`, and `isSynced`.

#### Step 6: Handle indexer failure

If the backend stops, the blockchain keeps working. When the backend restarts, it reads the last checkpoint and continues. If the database is deleted, Member 1 rebuilds it from the deployment block.

For the hackathon, document reorganization awareness and use a small confirmation depth. The important lesson is that the indexer is rebuildable.

### Member 1 AI prompts

#### Prompt A: indexer

```text
You are the backend and blockchain-indexer engineer for AssetOps. Build a rebuildable event indexer using viem or Ethers.js. It must start from a configured deployment block, consume confirmed events from SecurityToken, CorporateActionRegistry, PaymentExecutor, and PaymentCurrency, and deduplicate using (chainId, transactionHash, logIndex). The database is a read model only. Define tables, event handlers, checkpoints, replay behavior, and reorganization awareness before writing code.
```

#### Prompt B: API

```text
Design a minimal REST API under /api/v1 for AssetOps. Include health, network, assets, holders, actions, action versions, payment preview, payment history, redemption history, and audit history. All blockchain amounts must be serialized as strings in base units. Every indexed response must include indexedBlock, chainHead, and isSynced. Do not create endpoints that directly write financial state into the database.
```

#### Prompt C: database

```text
Create a simple SQLite schema for an eight-hour AssetOps MVP that can later migrate to PostgreSQL. Store assets, holders, balances, transfers, action families, immutable action versions, executions, payments, redemptions, audit events, and indexer checkpoints. Add a unique event identity on (chainId, transactionHash, logIndex). Explain which rows are projections and which contract events rebuild them.
```

#### Prompt D: test and repair

```text
Test this AssetOps indexer by delivering the same blockchain log twice, stopping and restarting at a checkpoint, and replaying from the deployment block. Verify that balances, action versions, payments, redemptions, and audit events are not duplicated. Show how the API reports indexer lag and how a deleted database is rebuilt.
```

## 6. What the frontend part means

The frontend is a website. It gives people buttons, forms, tables, and explanations. It does not decide whether a payment is correct.

For example, the frontend may show that Alice should receive 20 tokens. When the operator clicks Execute, the smart contract calculates the amount again. If the frontend was showing old information, the contract remains safe.

### Member 2 technology

Member 2 uses:

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- wagmi for wallet connection and transaction state.
- viem for contract reads and writes.
- API client for backend queries.
- MetaMask or another EVM wallet.
- Sepolia explorer links for confirmed transactions.

### Member 2 implementation steps

#### Step 1: Create the application shell

Member 2 creates a responsive layout with:

- Header.
- Wallet connection button.
- Network indicator.
- Navigation.
- Main content area.
- Toast or status area.
- Synchronization banner.

The screen should look professional and trustworthy. Do not use a 3D background. Keep the important numbers readable.

#### Step 2: Connect the wallet

The frontend displays:

- Connected wallet address.
- Current chain.
- Required chain.
- Wrong-network warning.
- Role-based buttons.

If a user rejects a signature, show `Wallet rejected`. If the transaction reverts, show `Transaction failed`. These are different problems.

#### Step 3: Build the asset overview

Show:

- Token name and symbol.
- Token address.
- Total supply.
- Network.
- Deployment block.
- Contract explorer link.
- Indexer synchronization state.

#### Step 4: Build the holder registry

Show each holder, indexed balance, transfer history, and explorer links. The balance is a read projection. For critical actions, the application can also read the contract directly.

#### Step 5: Build action pages

The action page lets an authorized user:

- Create a coupon, interest, or redemption action.
- Upload or link a document.
- Enter record and payable dates.
- Enter the rate or principal terms.
- See the active version.
- Create an amendment.
- View all old versions.

For `CA-001`, the page must make it clear that Version 1 at 5% was superseded by Version 2 at 4%, not edited.

#### Step 6: Build the preview and execution flow

The payment preview shows:

- Action family and version.
- Status.
- Payable date.
- Current indexed block.
- Current chain head.
- Each holder's estimated balance.
- Each estimated payment.
- Treasury readiness if available.
- A clear statement that the contract recalculates live balances during execution.

The Execute button opens the wallet. After the user signs, the screen shows:

```text
Waiting for wallet -> Transaction pending -> Confirmed -> Indexer updating -> History refreshed
```

#### Step 7: Build audit history

The audit table shows event name, action version, holder, amount, block, time, transaction hash, and explorer link. The table must not claim an event is confirmed before the chain receipt is confirmed.

### Member 2 AI prompts

#### Prompt A: dashboard design

```text
You are the frontend engineer for AssetOps, a tokenized-asset lifecycle dashboard. Build a clean professional React + Vite + TypeScript interface styled with Tailwind CSS. Include asset overview, holder registry, corporate-action creation and amendments, version history, payment preview, redemption review, audit history, wallet connection, network validation, explorer links, and indexer synchronization status. Use restrained animation only for useful state changes. Do not use 3D backgrounds.
```

#### Prompt B: wallet states

```text
Implement the AssetOps wallet transaction UX using wagmi and viem. Distinguish idle, wallet connection, wrong network, awaiting signature, wallet rejected, pending transaction, confirmed receipt, on-chain revert, RPC timeout, indexer lag, and final synchronized state. Never display a submitted transaction as a completed payment before confirmation.
```

#### Prompt C: action history

```text
Create a corporate-action version-history component for AssetOps. Show CA-001 Version 1 at 5% as SUPERSEDED and Version 2 at 4% as ACTIVE or EXECUTED. Make it clear that Version 1 remains queryable but is permanently unpayable. Use data from the API and show transaction hashes and explorer links.
```

#### Prompt D: payment preview

```text
Build a payment preview for AssetOps using live indexed balances. For Alice 500 DBT, Bob 300 DBT, and Charlie 200 DBT at a 4% coupon, show 20, 12, and 8 payment tokens. Clearly label the result as a preview and explain that PaymentExecutor recalculates from live on-chain balances at execution time. Amounts must remain exact strings in base units.
```

## 7. How the three members connect their work

The team should agree on four shared contracts before coding:

1. **Contract addresses and ABI format.** Member 3 provides the ABI and deployment manifest.
2. **API response shapes.** Member 1 writes the endpoint examples.
3. **Events.** Member 3 defines event names and arguments; Member 1 indexes them.
4. **Screen behavior.** Member 2 uses the API and contract functions without changing financial rules.

### Shared handoff table

| From     | To             | What is handed over                                                           |
| -------- | -------------- | ----------------------------------------------------------------------------- |
| Member 3 | Member 1       | ABI, deployment manifest, contract addresses, event list, deployment block    |
| Member 3 | Member 2       | ABI, contract addresses, role requirements, function arguments, explorer URLs |
| Member 1 | Member 2       | API base URL, endpoint schemas, sample JSON, synchronization fields           |
| Member 2 | Member 1 and 3 | UI bugs, missing fields, transaction errors, confusing labels                 |
| Member 1 | Member 3       | Event-indexing mismatch, missing event fields, reorg or replay issues         |
| Member 3 | Whole team     | Local and Sepolia demo script, funded accounts, test balances                 |

## 8. Eight-hour hackathon schedule

The team should not spend the first four hours making every feature perfect. The goal is a small, connected, working story.

### Hour 0 to 0.5: agree on the story

All three members meet for 30 minutes.

They agree that the demo will show:

1. Token deployment.
2. Alice, Bob, and Charlie receiving DBT.
3. Bob transferring 200 DBT to Charlie.
4. `CA-001` Version 1 at 5% being amended to Version 2 at 4%.
5. Version 2 paying Alice 20, Bob 12, and Charlie 8.
6. A duplicate execution failing.
7. Redemption paying principal and burning all DBT.
8. The dashboard showing the history.

They create one shared `.env.example`, one deployment manifest format, one event list, and one API sample file.

### Hour 0.5 to 2: work in parallel

| Member   | Goal                                                                     |
| -------- | ------------------------------------------------------------------------ |
| Member 3 | Build contract skeletons and deploy a first local version                |
| Member 1 | Create database schema, API skeleton, and sample responses               |
| Member 2 | Create dashboard shell, wallet button, navigation, and mock data screens |

At the end of this period, the team should have three rough pieces, not three isolated perfect pieces.

### Hour 2 to 4: connect the first working path

| Member   | Goal                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| Member 3 | Finish token, registry, payment, and first tests                              |
| Member 1 | Read contract events and expose assets, holders, actions, and audit endpoints |
| Member 2 | Replace mock data with API data and connect wallet reads                      |

At Hour 4, prove one simple path: deploy token, mint balances, index them, and display them in the frontend.

### Hour 4 to 5.5: implement the business story

| Member   | Goal                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| Member 3 | Add amendment, live-balance coupon, duplicate guard, redemption, and burn                  |
| Member 1 | Index action versions, payments, redemptions, and execution status                         |
| Member 2 | Add create/amend forms, preview, execute button, redemption screen, and transaction states |

### Hour 5.5 to 6.5: full integration

The team runs the complete story together. They do not add unrelated features during this hour.

They check:

- Does the wallet connect?
- Does the correct network appear?
- Does the transfer change Bob and Charlie's balances?
- Does Version 2 become active?
- Does the preview show 20, 12, and 8?
- Does the contract recalculate the same values?
- Does the second execution fail?
- Does redemption burn exact balances?
- Does the API update after events are indexed?
- Does the UI show explorer links?

### Hour 6.5 to 7.5: bug fixing and demo hardening

Each member fixes bugs in their own area. The team freezes new features.

- Member 3 checks roles, revert messages, treasury funds, allowance, and deployment addresses.
- Member 1 checks duplicate events, missing rows, API errors, and indexer lag.
- Member 2 checks loading states, wallet rejection, wrong network, mobile layout, and readable numbers.

### Hour 7.5 to 8: final demo

The team prepares:

- A clean local reset script.
- A Sepolia manifest if available.
- Test wallets and balances.
- A short demo script.
- Screenshots or explorer links as backup.
- A list of known limitations.

The presenter should explain what is on chain and what is indexed off chain.

## 9. Exact demo story for judges

Use simple language:

1. “This is Alice, Bob, and Charlie. They own digital bond tokens called DBT.”
2. “The company announces a 5% coupon as `CA-001` Version 1.”
3. “The company discovers a correction and creates Version 2 at 4%. Version 1 is still visible, but it can never be paid.”
4. “Bob transfers 200 DBT to Charlie before the payment date.”
5. “The payment contract reads current balances, not an old list.”
6. “Alice has 500, Bob has 300, and Charlie has 200.”
7. “At 4%, the contract pays 20, 12, and 8.”
8. “A second payment attempt fails because Version 2 already executed.”
9. “At redemption, the contract pays principal and burns the exact DBT balances.”
10. “The database and dashboard show the confirmed event history, but the blockchain remains the authority.”

## 10. What not to build in an eight-hour hackathon

Do not spend the limited time on:

- A complete exchange or trading system.
- Complex user identity verification.
- A production custody service.
- A large-holder Merkle claim system.
- A full notification platform.
- A complicated microservice architecture.
- Custom blockchain infrastructure.
- A fancy 3D website background.
- AI-generated legal advice.
- A second off-chain financial ledger.

The winning demo is a small, complete, trustworthy lifecycle. It is better to show one payment correctly than ten unfinished screens.

## 11. Simple explanation of AI use

AI is a helper, not the project owner. Each member can use AI to draft code, tests, diagrams, API schemas, and explanations. The member who owns the area must review every generated change.

Use this common instruction in every prompt:

```text
Work only on the requested AssetOps area. Follow the architecture rule that smart contracts are the financial source of truth. Do not invent fields or behavior that conflicts with the contract, API, or event design. Explain the plan first, show the files to change, write small testable changes, and list risks and tests. Never include private keys or secrets. Assume a human engineer will review every line before merge.
```

AI must not:

- Invent a database balance and call it authoritative.
- Skip contract tests.
- Put a private key into code.
- Change payment amounts in the frontend.
- Modify a superseded action version instead of creating a new version.
- Use an obsolete OpenZeppelin hook without checking version compatibility.
- Claim a transaction succeeded before confirmation.

## 12. Final definition of done

The team is done when:

- Member 3's contracts compile, deploy, and pass the important tests.
- Member 1 can rebuild the database from blockchain events.
- Member 2 can connect a wallet and run the dashboard flow.
- The full payment example produces Alice 20, Bob 12, and Charlie 8.
- A duplicate execution is rejected on chain.
- Redemption pays principal and burns exact balances.
- The UI shows pending, confirmed, failed, rejected, and indexer-lag states.
- No private key or secret is committed.
- The demo works from a clean local reset.
- All three members review the final integrated branch before the presentation.

## 13. One-sentence summary for each member

- **Member 1, backend/indexer:** “I listen to confirmed blockchain events, organize them in a searchable database, and provide read APIs.”
- **Member 2, frontend:** “I build the safe and understandable dashboard where users connect wallets, review actions, and see confirmed history.”
- **Member 3, blockchain:** “I build the contracts that enforce balances, versions, payments, duplicate prevention, redemption, and burning.”

## 14. Related documents

- [AssetOps system architecture](system-architecture.md)
- [API contract](API_CONTRACT.md)
- [Database design](DATABASE.md)
- [Security policy](SECURITY.md)
- [Testing plan](TESTING_PLAN.md)
- [Deployment guide](DEPLOYMENT.md)
- [Contributing and branch workflow](../CONTRIBUTING.md)
