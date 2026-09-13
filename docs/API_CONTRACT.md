# AssetOps â€” API Contract

**Project:** AssetOps â€” The Operations Layer for Tokenized Assets  
**Document:** Shared API Contract  
**Status:** MVP integration baseline  
**Audience:** Blockchain, backend, frontend, and QA teams

## 1. Purpose

This document defines the integration contract between the AssetOps smart contracts, backend/indexer, and frontend application. It standardizes contract reads, write operations, indexed API responses, event payloads, transaction states, errors, and versioning rules.

The API contract does not move financial authority away from the blockchain.

> **Authority rule:** Smart contracts are authoritative for balances, action status, active versions, execution, payments, and redemption. Backend APIs provide queryable projections. Frontend writes require wallet-signed blockchain transactions.

## 2. System Boundaries

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Frontend             â”‚
â”‚ React + wagmi + viem â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
           â”‚ reads and wallet-signed writes
           â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       events       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ EVM Smart Contracts â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶â”‚ Backend / Indexer   â”‚
â”‚ source of truth     â”‚                    â”‚ read model          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                       â”‚ query API
                                                       â–¼
                                              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                              â”‚ Dashboard views     â”‚
                                              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2.1 Frontend responsibilities

The frontend must:

- Read current contract state for critical actions.
- Display indexed history and query results.
- Request wallet signatures for writes.
- Display pending, confirmed, failed, and rejected states.
- Decode known contract errors.
- Show transaction hashes and explorer links.

### 2.2 Backend/indexer responsibilities

The backend must:

- Index confirmed blockchain events.
- Provide query endpoints for dashboard data.
- Preserve historical action versions.
- Track transaction and block references.
- Be idempotent when processing the same event twice.
- Be rebuildable from the deployment block.
- Never modify contract state as a substitute for a blockchain transaction.

### 2.3 Blockchain responsibilities

The smart contracts must:

- Validate roles and permissions.
- Maintain token balances and holder state.
- Store action versions and status.
- Calculate and execute payments.
- Prevent duplicate execution.
- Execute redemption and authorized burns.
- Emit structured events.

## 3. Network and Address Configuration

The frontend and backend must load network configuration from deployment manifests rather than hardcoding addresses in components.

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "contracts": {
    "securityToken": "0x...",
    "paymentCurrency": "0x...",
    "corporateActionRegistry": "0x...",
    "paymentExecutor": "0x..."
  },
  "deploymentBlock": 0,
  "explorerBaseUrl": "https://sepolia.etherscan.io"
}
```

Required fields:

| Field             | Type   | Description                                       |
| ----------------- | ------ | ------------------------------------------------- |
| `network`         | string | Network identifier such as `hardhat` or `sepolia` |
| `chainId`         | number | EVM chain ID                                      |
| `contracts`       | object | Deployed contract addresses                       |
| `deploymentBlock` | number | First block indexed by the backend                |
| `explorerBaseUrl` | string | Explorer URL prefix                               |

Private keys, seed phrases, and RPC secrets must never be returned by this API or committed to the repository.

## 4. Smart-Contract Read Contract

The following read methods are required for frontend and backend integration.

### 4.1 SecurityToken reads

```solidity
function name() external view returns (string memory);
function symbol() external view returns (string memory);
function decimals() external view returns (uint8);
function totalSupply() external view returns (uint256);
function balanceOf(address account) external view returns (uint256);
function getHolders() external view returns (address[] memory);
function getHolderCount() external view returns (uint256);
function isHolder(address account) external view returns (bool);
function isWhitelisted(address account) external view returns (bool);
function paused() external view returns (bool);
```

### 4.2 PaymentCurrency reads

```solidity
function name() external view returns (string memory);
function symbol() external view returns (string memory);
function decimals() external view returns (uint8);
function balanceOf(address account) external view returns (uint256);
function allowance(address owner, address spender) external view returns (uint256);
```

### 4.3 CorporateActionRegistry reads

```solidity
function getAction(bytes32 actionId)
    external view returns (CorporateAction memory);

function getVersion(bytes32 versionId)
    external view returns (ActionVersion memory);

function getActiveVersion(bytes32 actionId)
    external view returns (ActionVersion memory);

function getHistory(bytes32 actionId)
    external view returns (ActionVersion[] memory);

function isActiveVersion(bytes32 actionId, bytes32 versionId)
    external view returns (bool);
```

### 4.4 PaymentExecutor reads

```solidity
function isExecuted(bytes32 actionId, bytes32 versionId)
    external view returns (bool);

function previewCoupon(bytes32 actionId)
    external view returns (
        address[] memory holders,
        uint256[] memory amounts,
        uint256 total
    );

function previewRedemption(bytes32 actionId)
    external view returns (
        address[] memory holders,
        uint256[] memory amounts,
        uint256 total
    );
```

## 5. Wallet Write Contract

Frontend write operations must be sent through the wallet using the generated ABI. The backend must not impersonate a user wallet.

### 5.1 SecurityToken writes

```solidity
mint(address to, uint256 amount)
setWhitelisted(address account, bool status)
burnFromHolder(address account, uint256 amount)
transfer(address to, uint256 amount)
approve(address spender, uint256 amount)
transferFrom(address from, address to, uint256 amount)
pause()
unpause()
```

### 5.2 CorporateActionRegistry writes

```solidity
createAction(
    bytes32 actionId,
    address assetToken,
    ActionType actionType,
    uint256 rateBps,
    uint256 amountPerToken,
    uint64 recordDate,
    uint64 payableDate,
    string documentHash
)

amendAction(
    bytes32 actionId,
    uint256 newRateBps,
    uint256 newAmountPerToken,
    uint64 newPayableDate,
    string newDocumentHash
)

markExecuted(bytes32 actionId, bytes32 versionId)
```

`markExecuted` is normally called by `PaymentExecutor`, not directly by the frontend.

### 5.3 PaymentCurrency writes

```solidity
mint(address to, uint256 amount)
approve(address spender, uint256 amount)
transfer(address to, uint256 amount)
```

### 5.4 PaymentExecutor writes

```solidity
executeAction(bytes32 actionId)
```

The frontend must display the resolved active version before requesting the wallet signature. The transaction label must identify both the action and version, such as `Execute CA-001 Version 2`.

## 6. Data Types

### 6.1 Action type

```text
COUPON
INTEREST
REDEMPTION
```

### 6.2 Action status

```text
DRAFT
ACTIVE
SUPERSEDED
EXECUTED
CANCELLED
```

### 6.3 Transaction status

```text
READY
WALLET_REQUEST
PENDING
CONFIRMED
FAILED
REJECTED
```

### 6.4 Address format

Addresses are returned as EIP-55 checksummed hexadecimal strings where supported. The frontend may display shortened addresses but must preserve the complete value for copy and explorer links.

### 6.5 Amount format

Blockchain responses use base-unit strings to avoid JavaScript number precision loss.

```json
{
  "raw": "500000000000000000000",
  "display": "500",
  "decimals": 18,
  "symbol": "DBT"
}
```

Rates are returned as basis-point integers and may include a display percentage.

```json
{
  "rateBps": 400,
  "displayRate": "4%"
}
```

Timestamps are returned as Unix seconds in raw responses and ISO-8601 strings in query responses.

## 7. Backend Query API

The backend API is a read-only query API for indexed blockchain data. The API prefix is:

```text
/api/v1
```

All responses must include the network context.

### 7.1 Health

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "ok",
  "network": "sepolia",
  "chainId": 11155111,
  "indexer": {
    "status": "synced",
    "latestIndexedBlock": 6500000,
    "updatedAt": "2026-09-13T12:00:00Z"
  }
}
```

### 7.2 Networks

```http
GET /api/v1/networks
```

Response:

```json
{
  "data": [
    {
      "name": "sepolia",
      "chainId": 11155111,
      "explorerBaseUrl": "https://sepolia.etherscan.io"
    }
  ]
}
```

### 7.3 Assets

```http
GET /api/v1/assets
GET /api/v1/assets/:assetAddress
```

Query parameters:

```text
network=sepolia
status=ACTIVE|PAUSED|REDEEMED
page=1
limit=25
```

Response item:

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "address": "0xAsset...",
  "name": "Demo Bond Token",
  "symbol": "DBT",
  "decimals": 18,
  "totalSupply": "1000000000000000000000",
  "totalSupplyDisplay": "1000",
  "holderCount": 3,
  "status": "ACTIVE",
  "createdAt": "2026-09-13T10:00:00Z",
  "createdTxHash": "0x..."
}
```

### 7.4 Holders

```http
GET /api/v1/assets/:assetAddress/holders
GET /api/v1/assets/:assetAddress/holders/:holderAddress
```

Query parameters:

```text
network=sepolia
includeZeroBalance=false
page=1
limit=50
sort=balance_desc|balance_asc|address
```

Response:

```json
{
  "data": [
    {
      "address": "0xAlice...",
      "balance": "500000000000000000000",
      "balanceDisplay": "500",
      "ownershipBps": 5000,
      "isWhitelisted": true,
      "lastTransferAt": null,
      "updatedAt": "2026-09-13T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3
  }
}
```

### 7.5 Corporate actions

```http
GET /api/v1/actions
GET /api/v1/actions/:actionId
GET /api/v1/actions/:actionId/versions
```

Query parameters:

```text
network=sepolia
asset=0xAsset...
type=COUPON|INTEREST|REDEMPTION
status=ACTIVE|SUPERSEDED|EXECUTED|CANCELLED
page=1
limit=25
```

Action response:

```json
{
  "actionId": "0xCA001...",
  "actionReference": "CA-001",
  "assetAddress": "0xAsset...",
  "actionType": "COUPON",
  "activeVersionId": "0xVersion2...",
  "activeVersion": 2,
  "status": "ACTIVE",
  "createdAt": "2026-09-13T10:00:00Z",
  "activeVersionData": {
    "rateBps": 400,
    "displayRate": "4%",
    "recordDate": "2026-09-13T10:00:00Z",
    "payableDate": "2026-09-18T10:00:00Z",
    "documentHash": "ipfs://...",
    "status": "ACTIVE",
    "supersedesVersionId": "0xVersion1..."
  },
  "execution": null
}
```

Version response:

```json
{
  "versionId": "0xVersion1...",
  "actionId": "0xCA001...",
  "version": 1,
  "rateBps": 500,
  "displayRate": "5%",
  "amountPerToken": "0",
  "recordDate": "2026-09-13T10:00:00Z",
  "payableDate": "2026-09-18T10:00:00Z",
  "supersedesVersionId": null,
  "documentHash": "ipfs://...",
  "status": "SUPERSEDED",
  "announcedBy": "0xIssuer...",
  "createdAt": "2026-09-13T10:00:00Z",
  "createdTxHash": "0x..."
}
```

### 7.6 Payment preview

```http
GET /api/v1/actions/:actionId/preview
```

The backend preview is for display only. The contract remains authoritative and may reject execution if state changes between preview and transaction confirmation.

Response:

```json
{
  "actionId": "0xCA001...",
  "versionId": "0xVersion2...",
  "actionType": "COUPON",
  "status": "READY",
  "rateBps": 400,
  "calculationModel": "CURRENT_BALANCE_AT_EXECUTION",
  "holders": [
    {
      "address": "0xAlice...",
      "assetBalance": "500000000000000000000",
      "paymentAmount": "20000000000000000000",
      "paymentAmountDisplay": "20"
    },
    {
      "address": "0xBob...",
      "assetBalance": "300000000000000000000",
      "paymentAmount": "12000000000000000000",
      "paymentAmountDisplay": "12"
    },
    {
      "address": "0xCharlie...",
      "assetBalance": "200000000000000000000",
      "paymentAmount": "8000000000000000000",
      "paymentAmountDisplay": "8"
    }
  ],
  "totalPayment": "40000000000000000000",
  "totalPaymentDisplay": "40",
  "treasury": {
    "address": "0xTreasury...",
    "balance": "1000000000000000000000",
    "allowance": "1000000000000000000000",
    "funded": true
  }
}
```

### 7.7 Payments

```http
GET /api/v1/payments
GET /api/v1/actions/:actionId/payments
GET /api/v1/holders/:holderAddress/payments
```

Response item:

```json
{
  "actionId": "0xCA001...",
  "versionId": "0xVersion2...",
  "actionType": "COUPON",
  "holderAddress": "0xAlice...",
  "assetBalanceAtExecution": "500000000000000000000",
  "amount": "20000000000000000000",
  "amountDisplay": "20",
  "paymentCurrency": "0xPaymentCurrency...",
  "transactionHash": "0x...",
  "blockNumber": 6500001,
  "executedAt": "2026-09-18T10:00:00Z"
}
```

### 7.8 Redemptions

```http
GET /api/v1/redemptions
GET /api/v1/actions/:actionId/redemption
```

Response:

```json
{
  "actionId": "0xRedemption...",
  "versionId": "0xRedemptionVersion...",
  "status": "EXECUTED",
  "totalPrincipal": "1000000000000000000000",
  "totalPrincipalDisplay": "1000",
  "totalTokensBurned": "1000000000000000000000",
  "holderCount": 3,
  "transactionHash": "0x...",
  "executedAt": "2026-10-01T10:00:00Z"
}
```

### 7.9 Audit history

```http
GET /api/v1/audit
GET /api/v1/assets/:assetAddress/audit
GET /api/v1/actions/:actionId/audit
```

Query parameters:

```text
network=sepolia
fromBlock=6500000
toBlock=latest
eventType=ACTION_CREATED|ACTION_AMENDED|PAYMENT|REDEMPTION|TRANSFER
page=1
limit=50
```

Response item:

```json
{
  "eventId": "0xTransactionHash:3",
  "eventType": "ACTION_AMENDED",
  "description": "CA-001 Version 1 was superseded by Version 2",
  "actor": "0xIssuer...",
  "actionId": "0xCA001...",
  "versionId": "0xVersion2...",
  "transactionHash": "0x...",
  "blockNumber": 6500000,
  "logIndex": 3,
  "timestamp": "2026-09-13T11:00:00Z",
  "explorerUrl": "https://sepolia.etherscan.io/tx/0x..."
}
```

## 8. Event Contract

The indexer must process these events.

### 8.1 SecurityToken events

```text
Transfer
Approval
WhitelistUpdated
HolderRegistered
TransferRestrictionFailure
AuthorizedBurn
```

### 8.2 CorporateActionRegistry events

```text
ActionCreated
ActionAmended
VersionSuperseded
ActionExecuted
ActionCancelled
```

### 8.3 PaymentExecutor events

```text
ActionPaymentExecuted
HolderPaid
HolderRedeemed
```

Events must retain:

- Transaction hash.
- Block number.
- Block timestamp.
- Log index.
- Chain ID.
- Contract address.
- Indexed identifiers.

The event key for idempotent ingestion is:

```text
(chainId, transactionHash, logIndex)
```

## 9. Error Contract

### 9.1 HTTP response format

```json
{
  "error": {
    "code": "ACTION_ALREADY_EXECUTED",
    "message": "CA-001 Version 2 has already been executed.",
    "details": {
      "actionId": "0xCA001...",
      "versionId": "0xVersion2..."
    },
    "requestId": "req_123"
  }
}
```

### 9.2 HTTP status mapping

| Status | Meaning                                                                 |
| -----: | ----------------------------------------------------------------------- |
|  `400` | Invalid request parameters                                              |
|  `401` | Authentication required, if an API-authenticated endpoint is introduced |
|  `403` | User or wallet lacks permission                                         |
|  `404` | Asset, action, version, or holder not found                             |
|  `409` | Conflicting state, such as already executed                             |
|  `422` | Valid request but contract or business validation failed                |
|  `429` | Rate limit exceeded                                                     |
|  `500` | Unexpected backend failure                                              |
|  `503` | Indexer or blockchain dependency unavailable                            |

### 9.3 Contract error codes

The frontend should decode these known errors:

```text
ACTION_ALREADY_EXISTS
ACTION_NOT_FOUND
VERSION_NOT_FOUND
ACTION_NOT_ACTIVE
VERSION_NOT_CURRENT
ACTION_ALREADY_EXECUTED
NOT_PAYABLE_YET
SUPERSEDED_VERSION
INSUFFICIENT_TREASURY_BALANCE
INSUFFICIENT_TREASURY_ALLOWANCE
SENDER_NOT_WHITELISTED
RECEIVER_NOT_WHITELISTED
TRANSFER_PAUSED
AMOUNT_EXCEEDS_BALANCE
UNAUTHORIZED
```

A duplicate execution is an expected security rejection. The UI must explain that no second payment was made.

## 10. Transaction Lifecycle Contract

The frontend must represent a write operation as:

```text
READY
  â†“
WALLET_REQUEST
  â†“
PENDING
  â†“
CONFIRMED
```

Alternative terminal states:

```text
WALLET_REQUEST â†’ REJECTED
PENDING â†’ FAILED
PENDING â†’ REVERTED
```

Required transaction response model:

```json
{
  "operation": "EXECUTE_ACTION",
  "status": "CONFIRMED",
  "actionId": "0xCA001...",
  "versionId": "0xVersion2...",
  "transactionHash": "0x...",
  "blockNumber": 6500001,
  "explorerUrl": "https://sepolia.etherscan.io/tx/0x..."
}
```

The frontend must not display a write as successful before the required transaction confirmation is received.

## 11. Query Consistency Rules

The backend and frontend must follow these rules:

1. Direct contract reads are authoritative for current balances and executable status.
2. Indexed data is authoritative for convenient historical queries after confirmation.
3. A recently submitted transaction may not appear in the indexer immediately.
4. The frontend must show a pending state during indexing delay.
5. The backend must identify its latest indexed block.
6. The frontend should display an indexer synchronization warning when data is stale.
7. A backend rebuild must reproduce the same event-derived history.
8. No API response may silently overwrite a prior announcement version.

## 12. Pagination, Filtering, and Sorting

Collection endpoints use:

```text
page=1
limit=25
sort=createdAt_desc
```

Response format:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "hasNextPage": false
  }
}
```

The backend must enforce a maximum `limit` of `100` for the MVP.

## 13. Versioning and Change Control

The API prefix begins at `/api/v1`.

A breaking change requires a new API version. Breaking changes include:

- Removing a response field.
- Changing a field type.
- Changing amount units.
- Changing action or status values.
- Changing the meaning of current-holder calculations.
- Changing event identifiers or indexed topics.

Additive fields may be introduced without a version change when existing clients continue to work.

Smart-contract ABI changes require:

1. A deployment manifest update.
2. Generated ABI update.
3. Backend event-handler review.
4. Frontend read/write integration review.
5. Updated integration tests.
6. A pull request into `develop`.

## 14. Team Integration Rules

| Team branch  | API responsibility                                                   |
| ------------ | -------------------------------------------------------------------- |
| `blockchain` | Contract methods, events, custom errors, ABI artifacts               |
| `backend`    | Event handlers, database projections, query endpoints, health status |
| `frontend`   | Wallet calls, query clients, transaction states, data presentation   |
| `develop`    | End-to-end integration and compatibility testing                     |
| `main`       | Stable release contract                                              |

The blockchain team must publish ABI and event changes before backend and frontend integration. The backend team must document endpoint changes before frontend consumption. The frontend team must not infer financial state from UI-local calculations when a contract read is available.

## 15. API Acceptance Criteria

The API integration is accepted when:

- Contract ABIs are available to backend and frontend packages.
- Network configuration is loaded from a deployment manifest.
- Asset, holder, action, version, payment, redemption, and audit queries work.
- Amounts are returned safely as strings in base units.
- Current balances can be verified directly on-chain.
- All action versions remain queryable after amendments.
- Duplicate execution is represented as an expected contract rejection.
- Transaction states distinguish wallet rejection, pending, confirmation, and revert.
- Explorer links are generated for confirmed transactions.
- Event ingestion is idempotent by chain ID, transaction hash, and log index.
- The indexer reports its synchronization state.
- The read model can be rebuilt from the deployment block.
- API changes follow `/api/v1` versioning rules.
- No secrets are returned or committed.
- The complete CA-001 demonstration works across blockchain, backend, and frontend.

## 16. References

[1]: ./contract-design.md "AssetOps Master Smart-Contract Design"
[2]: ./architecture.md "AssetOps System Architecture"
[3]: ./database.md "AssetOps Database and Data Model Specification"
[4]: ./development.md "AssetOps Development Plan and Workflow"
[5]: ./decisions.md "AssetOps Master Decisions Register"
[6]: ./PRD.md "AssetOps Product Requirements Document"
[7]: https://docs.openzeppelin.com/contracts/5.x/ "OpenZeppelin Contracts Documentation"
[8]: https://viem.sh/docs "Viem Documentation"
[9]: https://wagmi.sh/ "Wagmi Documentation"
