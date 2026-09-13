# AssetOps â€” Master Smart-Contract Design

**Project:** AssetOps â€” The Operations Layer for Tokenized Assets  
**Document:** Master Smart-Contract Design  
**Status:** Approved implementation baseline  
**Target:** Solidity `^0.8.24`, Hardhat, OpenZeppelin Contracts  
**Primary network:** Hardhat local network, then Ethereum Sepolia

## 1. Purpose

This document defines the smart-contract architecture, storage model, interfaces, state transitions, events, errors, permissions, security controls, and testing requirements for AssetOps.

The contract system must support the complete post-issuance lifecycle:

```text
Tokenized asset
    â†“
Current holder balances
    â†“
Corporate-action announcement
    â†“
Append-only amendment
    â†“
Active-version resolution
    â†“
Coupon or interest payment
    â†“
Duplicate prevention
    â†“
Principal redemption
    â†“
Authorized token burn
    â†“
Auditable events
```

> **Contract authority rule:** Smart contracts are authoritative for token ownership, corporate-action state, payment execution, redemption, and replay protection. Frontend and indexer services cannot replace or override on-chain state.

## 2. Design Scope

### 2.1 MVP responsibilities

The contracts must:

- Represent a permissioned ERC-20-style asset token.
- Maintain a practical holder enumeration model for a small demonstration.
- Represent a mock ERC-20 payment currency.
- Create coupon, interest, and redemption actions.
- Preserve every announcement version.
- Mark replaced versions as superseded.
- Execute only the active payable version.
- Calculate payments using the documented current-balance model.
- Prevent duplicate execution.
- Pay principal and burn redeemed asset tokens.
- Emit structured, indexable events.

### 2.2 Explicit non-goals

The MVP does not implement:

- Full ERC-1400 partition management.
- Full ERC-3643 identity and claims infrastructure.
- Production KYC, AML, tax, or jurisdictional compliance.
- Real fiat settlement or customer funds.
- Unlimited-holder push payments.
- Upgradeable proxy contracts.
- A generalized workflow engine for every corporate action.

## 3. Contract Topology

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚    SecurityToken     â”‚
â”‚ ERC-20 + allowlist   â”‚
â”‚ live balances        â”‚
â”‚ holder enumeration   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
           â”‚ asset address, balances, holders, burn
           â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ CorporateAction      â”‚
â”‚ Registry             â”‚
â”‚ versions and status  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
           â”‚ active terms and execution marking
           â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   PaymentExecutor    â”‚â”€â”€â”€â”€â”€â”€â–¶â”‚   PaymentCurrency   â”‚
â”‚ coupon and redemptionâ”‚       â”‚ mock ERC-20 token    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3.1 Responsibility boundaries

| Contract                  | Owns                                                                 | Must not own                                |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| `SecurityToken`           | Asset balances, transfers, allowlist, holder list, authorized burn   | Corporate-action terms or payment execution |
| `PaymentCurrency`         | Mock payment-token balances and minting                              | Asset ownership or action status            |
| `CorporateActionRegistry` | Announcements, versions, active pointer, lifecycle status            | Treasury transfers or holder payment loops  |
| `PaymentExecutor`         | Entitlement calculation, treasury transfers, execution orchestration | Announcement creation or amendment          |

The registry does not transfer funds. The executor does not create or amend actions. The token does not decide payment terms.

## 4. Shared Types and Conventions

### 4.1 Action types

The implementation must support all three required types:

```solidity
enum ActionType {
    COUPON,
    INTEREST,
    REDEMPTION
}
```

`COUPON` and `INTEREST` use `rateBps`. `REDEMPTION` uses `amountPerToken`.

### 4.2 Action status

```solidity
enum ActionStatus {
    DRAFT,
    ACTIVE,
    SUPERSEDED,
    EXECUTED,
    CANCELLED
}
```

The MVP may create actions directly as `ACTIVE`. `DRAFT` is retained for future staged workflows.

### 4.3 Financial units

- Rates use basis points.
- `10,000` basis points equal `100%`.
- Token amounts use the asset tokenâ€™s base units.
- Payment amounts use the payment currencyâ€™s base units.
- Calculations use Solidity checked integer arithmetic.
- Division rounds down unless a later approved decision defines another policy.

Coupon formula:

```text
payment = assetBalance Ã— rateBps Ã· 10,000
```

Redemption formula:

```text
principal = assetBalance Ã— amountPerToken
```

The token and payment-currency decimal assumptions must be recorded in deployment configuration and shown in the frontend.

### 4.4 Time conventions

- `recordDate` and `payableDate` use Unix seconds.
- An action is executable only when `block.timestamp >= payableDate`.
- The MVPâ€™s entitlement model reads current balances at execution time.
- The `recordDate` is retained for audit and future record-date snapshot support.

## 5. SecurityToken Design

### 5.1 Purpose

`SecurityToken` represents the tokenized asset and acts as the authoritative ownership source for the MVP.

### 5.2 Base contracts

Use OpenZeppelin components appropriate to the selected release:

- `ERC20`.
- `AccessControl`.
- `Pausable`.
- `ReentrancyGuard` is not required on the token unless a token-specific external interaction is introduced.

The implementation must use the transfer/update hook required by the installed OpenZeppelin version. For OpenZeppelin Contracts 5.x, transfer restrictions should be enforced through `_update`, not an obsolete `_beforeTokenTransfer` override.

### 5.3 Roles

```solidity
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
```

| Role                 | Capability                                        |
| -------------------- | ------------------------------------------------- |
| `DEFAULT_ADMIN_ROLE` | Grant and revoke roles, emergency administration  |
| `MINTER_ROLE`        | Mint asset tokens to approved holders             |
| `AGENT_ROLE`         | Add or remove allowlist status, pause and unpause |
| `BURNER_ROLE`        | Burn holder tokens during authorized redemption   |

For the hackathon demonstration, one deployer may hold several roles. A production deployment should separate admin, issuer, agent, treasury, and executor authority through multisignature governance.

### 5.4 Storage model

```solidity
mapping(address => bool) private _whitelisted;
address[] private _holders;
mapping(address => bool) private _knownHolder;
```

The holder list is monotonic for the MVP. An address is added when it first receives or holds asset tokens. Zero-balance addresses may remain in the list and must be skipped during payment.

### 5.5 Required functions

```solidity
function mint(address to, uint256 amount)
    external onlyRole(MINTER_ROLE);

function setWhitelisted(address account, bool status)
    external onlyRole(AGENT_ROLE);

function isWhitelisted(address account)
    external view returns (bool);

function getHolders()
    external view returns (address[] memory);

function getHolderCount()
    external view returns (uint256);

function isHolder(address account)
    external view returns (bool);

function burnFromHolder(address account, uint256 amount)
    external onlyRole(BURNER_ROLE);
```

The inherited ERC-20 interface must provide `transfer`, `approve`, `transferFrom`, `balanceOf`, and `totalSupply`.

### 5.6 Transfer restrictions

The token must reject:

- Transfers while paused.
- Transfers from a non-whitelisted sender, except minting from the zero address.
- Transfers to a non-whitelisted receiver, except burning to the zero address.
- Minting to a non-whitelisted receiver.
- Burning more than the holder balance.

Recommended custom errors:

```solidity
error TransferPaused();
error SenderNotWhitelisted(address sender);
error ReceiverNotWhitelisted(address receiver);
error AmountExceedsBalance(address account, uint256 requested, uint256 available);
error HolderNotWhitelisted(address account);
```

### 5.7 Transfer restriction query

Provide an ERC-1404-style diagnostic interface where practical:

```solidity
function detectTransferRestriction(
    address from,
    address to,
    uint256 value
) external view returns (uint8 code);

function messageForTransferRestriction(uint8 code)
    external pure returns (string memory);
```

Suggested codes:

| Code | Meaning                  |
| ---: | ------------------------ |
|  `0` | Transfer allowed         |
|  `1` | Sender not whitelisted   |
|  `2` | Receiver not whitelisted |
|  `3` | Transfers paused         |
|  `4` | Amount exceeds balance   |

### 5.8 SecurityToken events

```solidity
event WhitelistUpdated(address indexed account, bool status);
event HolderRegistered(address indexed account);
event TransferRestrictionFailure(
    address indexed from,
    address indexed to,
    uint256 amount,
    uint8 code
);
event AuthorizedBurn(address indexed account, uint256 amount);
```

Standard ERC-20 `Transfer` and `Approval` events remain mandatory.

## 6. PaymentCurrency Design

### 6.1 Purpose

`PaymentCurrency` is a mock ERC-20 token used to fund coupon and redemption payments during local and Sepolia demonstrations.

### 6.2 Roles

```solidity
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
```

Only `MINTER_ROLE` may mint test currency. Transfers are unrestricted because the mock currency is not the permissioned security token.

### 6.3 Required functions

```solidity
function mint(address to, uint256 amount)
    external onlyRole(MINTER_ROLE);

function burn(uint256 amount)
    external;
```

The inherited ERC-20 interface provides balances, approvals, transfers, and `transferFrom` for treasury funding.

### 6.4 PaymentCurrency events

Use standard ERC-20 `Transfer` and `Approval` events. A project-specific mint event is optional because minting already appears as a `Transfer` from the zero address.

## 7. CorporateActionRegistry Design

### 7.1 Purpose

`CorporateActionRegistry` is the append-only lifecycle authority for corporate-action announcements and their versions.

### 7.2 Version identity model

Use two identifiers:

- `actionId`: stable root identifier for the corporate action family, such as `CA-001` represented as `bytes32`.
- `versionId`: unique identifier for one version of that action.

The active pointer maps the root action ID to the current version ID.

```solidity
mapping(bytes32 => CorporateAction) private _actions;
mapping(bytes32 => ActionVersion[]) private _history;
mapping(bytes32 => bytes32) private _activeVersion;
mapping(bytes32 => bool) public exists;
```

Each version stores a `supersedesVersionId`. The original version has a zero supersedes value.

### 7.3 Data structures

```solidity
struct CorporateAction {
    bytes32 actionId;
    address assetToken;
    ActionType actionType;
    bytes32 activeVersionId;
    ActionStatus status;
    uint64 createdAt;
}

struct ActionVersion {
    bytes32 versionId;
    bytes32 actionId;
    uint32 version;
    uint256 rateBps;
    uint256 amountPerToken;
    uint64 recordDate;
    uint64 payableDate;
    bytes32 supersedesVersionId;
    string documentHash;
    ActionStatus status;
    address announcedBy;
    uint64 createdAt;
}
```

The design may use a packed storage layout later, but correctness and readability take priority during the MVP.

### 7.4 Registry roles

```solidity
bytes32 public constant ANNOUNCER_ROLE = keccak256("ANNOUNCER_ROLE");
bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
```

`ANNOUNCER_ROLE` creates and amends actions. `EXECUTOR_ROLE` marks the exact active version as executed after successful payment orchestration.

### 7.5 Required functions

```solidity
function createAction(
    bytes32 actionId,
    address assetToken,
    ActionType actionType,
    uint256 rateBps,
    uint256 amountPerToken,
    uint64 recordDate,
    uint64 payableDate,
    string calldata documentHash
) external onlyRole(ANNOUNCER_ROLE) returns (bytes32 versionId);

function amendAction(
    bytes32 actionId,
    uint256 newRateBps,
    uint256 newAmountPerToken,
    uint64 newPayableDate,
    string calldata newDocumentHash
) external onlyRole(ANNOUNCER_ROLE) returns (bytes32 versionId);

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

function markExecuted(bytes32 actionId, bytes32 versionId)
    external onlyRole(EXECUTOR_ROLE);
```

### 7.6 Creation rules

`createAction` must reject:

- A zero action ID.
- An existing action ID.
- A zero asset address.
- A zero payable date where the business flow requires a date.
- A payable date earlier than the record date when that rule is enabled.
- A coupon or interest action with a zero or out-of-range rate.
- A redemption action with a zero principal amount.
- A non-empty redemption rate or non-zero coupon principal field when strict validation is enabled.

The first version is `version = 1`, `status = ACTIVE`, and `supersedesVersionId = bytes32(0)`.

### 7.7 Amendment rules

`amendAction` must:

1. Resolve the current active version.
2. Require the action to exist.
3. Require the action status to be `ACTIVE`.
4. Require the current version not to be executed or superseded.
5. Preserve the action ID, asset address, action type, and record date.
6. Create a new version with incremented version number.
7. Link the new version to the previous active version.
8. Mark the previous version `SUPERSEDED`.
9. Make the new version `ACTIVE`.
10. Update the active-version pointer.
11. Emit amendment and supersession events.

An executed or cancelled action cannot be amended.

### 7.8 Execution marking rules

`markExecuted` must:

- Require the action and version to exist.
- Require the version ID to equal the active pointer.
- Require the version status to be `ACTIVE`.
- Require the action status to be `ACTIVE`.
- Set the version status to `EXECUTED`.
- Set the action status to `EXECUTED`.
- Prevent any later amendment or execution.

The registry function must be called only after the executor has completed all payment and burn operations within the same atomic transaction.

### 7.9 Registry errors

```solidity
error ActionAlreadyExists(bytes32 actionId);
error ActionNotFound(bytes32 actionId);
error VersionNotFound(bytes32 versionId);
error InvalidActionId();
error InvalidAssetAddress();
error InvalidActionTerms();
error ActionNotActive(bytes32 actionId);
error VersionNotActive(bytes32 versionId);
error VersionNotCurrent(bytes32 actionId, bytes32 versionId);
error ActionAlreadyExecuted(bytes32 actionId);
error ActionCancelled(bytes32 actionId);
error AmendmentNotAllowed(bytes32 actionId);
```

### 7.10 Registry events

```solidity
event ActionCreated(
    bytes32 indexed actionId,
    bytes32 indexed versionId,
    address indexed assetToken,
    ActionType actionType,
    uint32 version
);

event ActionAmended(
    bytes32 indexed actionId,
    bytes32 indexed previousVersionId,
    bytes32 indexed newVersionId,
    uint32 newVersion
);

event VersionSuperseded(
    bytes32 indexed actionId,
    bytes32 indexed versionId,
    bytes32 indexed supersededBy
);

event ActionExecuted(
    bytes32 indexed actionId,
    bytes32 indexed versionId,
    address indexed executor
);

event ActionCancelled(bytes32 indexed actionId, bytes32 indexed versionId);
```

## 8. PaymentExecutor Design

### 8.1 Purpose

`PaymentExecutor` validates and executes coupon, interest, and redemption actions. It is the only component that coordinates the registry, asset token, payment currency, and holder list.

### 8.2 Dependencies

```solidity
ISecurityToken public immutable assetToken;
IPaymentCurrency public immutable paymentCurrency;
ICorporateActionRegistry public immutable registry;
```

The preferred design passes or validates the relevant asset address per action rather than assuming one global asset. The executor must reject unsupported token interfaces or invalid configured dependencies.

### 8.3 Roles and guards

```solidity
bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
```

Use `ReentrancyGuard` on external execution functions. The executor must also maintain an explicit execution mapping as defense in depth:

```solidity
mapping(bytes32 => bool) public executedVersion;
```

The registryâ€™s terminal status and the executorâ€™s mapping must agree after a successful execution.

### 8.4 Required functions

```solidity
function executeAction(bytes32 actionId)
    external onlyRole(EXECUTOR_ROLE) nonReentrant;

function previewCoupon(bytes32 actionId)
    external view returns (address[] memory holders, uint256[] memory amounts, uint256 total);

function previewRedemption(bytes32 actionId)
    external view returns (address[] memory holders, uint256[] memory amounts, uint256 total);

function isExecuted(bytes32 actionId, bytes32 versionId)
    external view returns (bool);
```

A separate `executeCoupon` and `executeRedemption` interface may be used if it improves type safety. Both paths must enforce the same execution and treasury controls.

### 8.5 Execution sequence

The execution transaction must follow checks-effects-interactions discipline:

```text
1. Load action and active version.
2. Validate action type.
3. Validate active version and status.
4. Validate payable date.
5. Validate execution guard.
6. Load holder list.
7. Read current balances.
8. Calculate all entitlements.
9. Validate total payment and treasury allowance/balance.
10. Set the execution guard.
11. Transfer payment currency to holders.
12. Burn tokens for redemption actions.
13. Mark the exact registry version executed.
14. Emit aggregate and per-holder events.
```

If any step fails, the entire transaction must revert. The execution guard must not remain set after a failed transaction.

### 8.6 Coupon and interest execution

For `COUPON` and `INTEREST`:

```text
amount = currentHolderBalance Ã— rateBps Ã· 10,000
```

The executor must skip holders with zero balances. It must not use an announcement-time balance snapshot in the MVP.

For the primary demonstration:

```text
Alice   = 500 DBT Ã— 4% = 20 payment tokens
Bob     = 300 DBT Ã— 4% = 12 payment tokens
Charlie = 200 DBT Ã— 4% =  8 payment tokens
Total                         40 payment tokens
```

### 8.7 Redemption execution

For `REDEMPTION`:

```text
principal = currentHolderBalance Ã— amountPerToken
```

The executor must:

1. Validate the active redemption version.
2. Validate the payable date.
3. Read current balances.
4. Calculate total principal.
5. Validate treasury funding.
6. Pay each holder.
7. Burn the exact redeemed balance through the authorized token path.
8. Mark the action executed.
9. Emit payment, burn, and redemption events.

The executor must not assume that investor tokens are already held by the executor. `burnFromHolder` or another explicit authorized burn mechanism must be used.

### 8.8 Treasury validation

Before transfers, validate:

```solidity
paymentCurrency.balanceOf(treasury) >= totalRequired;
paymentCurrency.allowance(treasury, address(this)) >= totalRequired;
```

If the executor itself holds the payment currency, the balance and allowance check must be adapted to that design and documented. The selected MVP design should use a treasury allowance to the executor because it makes funding visible and testable.

### 8.9 PaymentExecutor errors

```solidity
error NotPayableYet(uint64 payableDate, uint64 currentTime);
error UnsupportedActionType();
error AlreadyExecuted(bytes32 actionId, bytes32 versionId);
error SupersededVersion(bytes32 actionId, bytes32 versionId);
error InsufficientTreasuryBalance(uint256 required, uint256 available);
error InsufficientTreasuryAllowance(uint256 required, uint256 allowance);
error EmptyHolderSet();
error InvalidTokenDependency();
error PaymentCalculationOverflow();
error BurnFailed(address holder, uint256 amount);
```

Use custom errors rather than long revert strings for gas efficiency and frontend error decoding.

### 8.10 PaymentExecutor events

```solidity
event ActionPaymentExecuted(
    bytes32 indexed actionId,
    bytes32 indexed versionId,
    address indexed assetToken,
    ActionType actionType,
    uint256 totalAmount,
    uint256 holderCount
);

event HolderPaid(
    bytes32 indexed actionId,
    bytes32 indexed versionId,
    address indexed holder,
    uint256 assetBalance,
    uint256 paymentAmount
);

event HolderRedeemed(
    bytes32 indexed actionId,
    bytes32 indexed versionId,
    address indexed holder,
    uint256 tokenAmount,
    uint256 principalAmount
);
```

## 9. Interface Design

Create minimal interfaces so contracts can be tested independently:

```solidity
interface ISecurityToken {
    function balanceOf(address account) external view returns (uint256);
    function getHolders() external view returns (address[] memory);
    function burnFromHolder(address account, uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

interface IPaymentCurrency {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
```

The registry interface must expose action and version reads, active-version checks, and `markExecuted`.

## 10. Access-Control Matrix

| Operation               | Admin | Minter | Agent | Announcer |         Executor | Treasury |
| ----------------------- | ----: | -----: | ----: | --------: | ---------------: | -------: |
| Grant/revoke roles      |   Yes |     No |    No |        No |               No |       No |
| Mint asset token        |    No |    Yes |    No |        No |               No |       No |
| Manage allowlist        |    No |     No |   Yes |        No |               No |       No |
| Pause transfers         |    No |     No |   Yes |        No |               No |       No |
| Create action           |    No |     No |    No |       Yes |               No |       No |
| Amend action            |    No |     No |    No |       Yes |               No |       No |
| Execute payment         |    No |     No |    No |        No |              Yes |       No |
| Mark action executed    |    No |     No |    No |        No |              Yes |       No |
| Fund executor allowance |    No |     No |    No |        No |               No |      Yes |
| Burn holder tokens      |    No |     No |    No |        No | Through executor |       No |

The exact role placement must be enforced in the contracts and covered by tests. The table describes authority, not necessarily direct function ownership.

## 11. State Machines

### 11.1 Action state machine

```text
CREATE
  â†“
ACTIVE â”€â”€ amend() â”€â”€â–¶ SUPERSEDED
  â”‚                       â”‚
  â”‚                       â””â”€â”€ terminal
  â”‚
  â”œâ”€â”€ execute() â”€â”€â”€â”€â”€â”€â”€â–¶ EXECUTED
  â”‚                       â””â”€â”€ terminal
  â”‚
  â””â”€â”€ cancel() â”€â”€â”€â”€â”€â”€â”€â”€â–¶ CANCELLED
                          â””â”€â”€ terminal
```

### 11.2 Version chain

```text
CA-001 / Version 1 / 5% / SUPERSEDED
              â”‚
              â””â”€â”€ superseded by

CA-001 / Version 2 / 4% / ACTIVE
```

A payment call for Version 1 must revert even if the caller has executor permission. The executor must resolve and pay Version 2.

### 11.3 Execution state

```text
Not payable â†’ Payable â†’ Executing â†’ Executed
                    â”‚
                    â””â”€â”€ failed transaction â†’ Payable
```

A failed transaction must not permanently lock the action.

## 12. Critical Invariants

The following properties must always hold:

1. A non-existent action cannot be read as active.
2. An action ID cannot be created twice.
3. A version is never overwritten after creation.
4. A superseded version cannot execute.
5. An executed version cannot execute again.
6. Only the active version can be marked executed.
7. A payment before `payableDate` reverts.
8. A failed payment leaves the execution guard unset.
9. A successful payment sets the execution guard exactly once.
10. Total holder payments equal the sum of calculated non-zero-holder entitlements.
11. Payment cannot exceed validated treasury funding.
12. Redemption cannot burn more than the holder balance.
13. Redemption burns exactly the balance used for the principal calculation.
14. Token transfers respect pause and allowlist rules.
15. Unauthorized accounts cannot mint, amend, execute, pause, allowlist, or burn.
16. Registry and executor terminal states agree after successful execution.
17. No contract depends on an off-chain database for financial authority.

## 13. Security Design

### 13.1 Reentrancy

Use `nonReentrant` on payment and redemption entry points. The payment currency is expected to be an ERC-20 token, but external token behavior must not be trusted blindly.

### 13.2 Checks-effects-interactions

Validate all action, time, role, funding, and balance conditions before transferring funds. Set execution state before external transfers, with transaction atomicity ensuring rollback if a transfer fails.

### 13.3 Denial-of-service considerations

The MVP push-payment loop is bounded for the demonstration. Do not claim unlimited holder support. A future Merkle claim model is required for large populations.

### 13.4 Arithmetic and rounding

Use Solidity checked arithmetic and basis points. Tests must cover zero amounts, small balances, rates that produce fractional results, maximum configured rates, and large but valid amounts.

### 13.5 Role security

Do not use `tx.origin`. Use `AccessControl` and explicit role checks. Production deployments should use multisignature administration and separate role holders.

### 13.6 Token dependency security

Validate that configured addresses are contracts where practical. Use return-value-safe ERC-20 transfers, such as OpenZeppelin `SafeERC20`, for payment currency interactions.

### 13.7 Emergency controls

The token may be paused by `AGENT_ROLE`. Pausing transfers must not silently rewrite corporate-action history. The emergency policy for pausing payment execution requires a future governance decision.

## 14. Testing Strategy

### 14.1 Unit tests

Test each contract independently:

- Constructor configuration.
- Role grants and revocations.
- Minting and burning.
- Allowlist transitions.
- Pause and unpause.
- Holder enumeration.
- Action creation.
- Version amendments.
- Status transitions.
- Payment calculations.
- Treasury validation.
- Custom error decoding.

### 14.2 Integration test: primary scenario

The mandatory integration test is:

```text
Deploy contracts
    â†“
Configure roles
    â†“
Whitelist Alice, Bob, Charlie
    â†“
Mint 1,000 DBT
    â†“
Distribute 500 DBT to Alice and 500 DBT to Bob
    â†“
Create CA-001 Version 1 at 5%
    â†“
Bob transfers 200 DBT to Charlie
    â†“
Amend CA-001 to Version 2 at 4%
    â†“
Advance time beyond payable date
    â†“
Fund and approve executor
    â†“
Execute Version 2
    â†“
Verify Alice receives 20
    â†“
Verify Bob receives 12
    â†“
Verify Charlie receives 8
    â†“
Attempt duplicate execution and expect revert
    â†“
Attempt Version 1 execution and expect revert
    â†“
Create redemption action
    â†“
Fund redemption
    â†“
Redeem holders and burn tokens
```

### 14.3 Property and invariant tests

Use Hardhat tests and, if introduced later, Foundry invariant tests to verify:

- Append-only versions.
- Terminal status behavior.
- No duplicate transfers.
- Atomic rollback.
- Balance conservation around transfers and burns.
- Payment total correctness.
- Unauthorized operation rejection.

### 14.4 Static analysis

Run Solidity compiler checks, linting, and optional Slither analysis before Sepolia deployment. Review every warning rather than suppressing it without explanation.

## 15. Deployment Design

### 15.1 Deployment order

```text
1. Deploy PaymentCurrency
2. Deploy SecurityToken
3. Deploy CorporateActionRegistry
4. Deploy PaymentExecutor
5. Grant roles
6. Configure token burner role for PaymentExecutor
7. Configure treasury allowance
8. Whitelist demo holders
9. Mint demo asset and payment currency
10. Write deployment manifest
```

### 15.2 Deployment manifest

Record:

- Network name.
- Chain ID.
- Contract names and addresses.
- Deployment transaction hashes.
- Deployment block numbers.
- ABI or release version.
- Role assignments.
- Demo asset configuration.
- Payment currency configuration.

Never record private keys, seed phrases, or secret RPC credentials.

### 15.3 Upgrade policy

The MVP contracts are non-upgradeable. A defect requires a reviewed redeployment and documented migration. Upgradeable proxies may be considered only through a new approved decision because they change trust, governance, and audit assumptions.

## 16. Implementation Sequence

### Phase 1 â€” Token contracts

Implement `SecurityToken.sol`, `PaymentCurrency.sol`, interfaces, roles, allowlist behavior, holder tracking, and unit tests.

### Phase 2 â€” Registry

Implement `CorporateActionRegistry.sol`, version storage, active pointers, amendments, custom errors, events, and invariant tests.

### Phase 3 â€” Executor

Implement `PaymentExecutor.sol`, previews, treasury validation, coupon execution, redemption, authorized burns, and integration tests.

### Phase 4 â€” ABI and indexer integration

Freeze event names and read methods. Provide generated ABIs to the backend and frontend teams.

### Phase 5 â€” Local demonstration

Run the full CA-001 scenario repeatedly on Hardhat Network. Do not deploy to Sepolia until the local scenario passes from a clean deployment.

### Phase 6 â€” Sepolia

Deploy from a reviewed commit, verify addresses and roles, seed a fresh demonstration state, and preserve the deployment manifest.

## 17. Contract Acceptance Criteria

The smart-contract implementation is accepted when:

- The contracts compile with the selected Solidity and OpenZeppelin versions.
- The asset token supports mint, transfer, approval, `transferFrom`, balance, total supply, and burn behavior.
- Only whitelisted holders can receive or transfer asset tokens.
- Holder enumeration is deterministic for the MVP population.
- Coupon, interest, and redemption actions are supported.
- Version 1 remains queryable after amendment.
- Version 1 is marked `SUPERSEDED` and Version 2 is `ACTIVE`.
- A superseded version cannot execute.
- A payment before the payable date reverts.
- Current balances are used for payment calculation.
- Treasury balance and allowance are validated.
- Duplicate execution reverts without transferring funds.
- Failed execution does not lock the action.
- Redemption pays holders and burns redeemed tokens.
- All major lifecycle changes emit events.
- Unauthorized calls revert.
- The complete integration test passes.
- Static analysis findings are reviewed.
- The deployment manifest contains no secrets.

## 18. References

[1]: ./PRD.md "AssetOps Product Requirements Document"
[2]: ./architecture.md "AssetOps System Architecture"
[3]: ./database.md "AssetOps Database and Data Model Specification"
[4]: ./development.md "AssetOps Development Plan and Workflow"
[5]: ./decisions.md "AssetOps Master Decisions Register"
[6]: ./technicals.md "AssetOps Technical Specification"
[7]: https://docs.openzeppelin.com/contracts/5.x/ "OpenZeppelin Contracts Documentation"
[8]: https://hardhat.org/docs "Hardhat Documentation"
[9]: https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ "Ethereum ERC-20 Token Standard Documentation"
[10]: https://eips.ethereum.org/EIPS/eip-1404 "ERC-1404 Simple Restricted Token Standard"
