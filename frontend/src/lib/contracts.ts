import { parseAbi } from 'viem';

export const CONTRACT_ADDRESSES = {
  securityToken: (import.meta.env.VITE_SECURITY_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`,
  paymentCurrency: (import.meta.env.VITE_PAYMENT_CURRENCY_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as `0x${string}`,
  corporateActionRegistry: (import.meta.env.VITE_REGISTRY_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0') as `0x${string}`,
  paymentExecutor: (import.meta.env.VITE_EXECUTOR_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9') as `0x${string}`,
};

export const SECURITY_TOKEN_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function isWhitelisted(address account) view returns (bool)',
  'function getHolders() view returns (address[])',
  'function getHolderCount() view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function detectTransferRestriction(address from, address to, uint256 value) view returns (uint8)',
  'function messageForTransferRestriction(uint8 restrictionCode) view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event WhitelistUpdated(address indexed account, bool status)',
  'event HolderRegistered(address indexed account)',
  'event AuthorizedBurn(address indexed account, uint256 amount)'
]);

export const PAYMENT_CURRENCY_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
]);

export const CORPORATE_ACTION_REGISTRY_ABI = parseAbi([
  'struct CorporateAction { bytes32 actionId; address assetToken; uint8 actionType; bytes32 activeVersionId; uint8 status; uint64 createdAt; }',
  'struct ActionVersion { bytes32 versionId; bytes32 actionId; uint32 version; uint256 rateBps; uint256 amountPerToken; uint64 recordDate; uint64 payableDate; bytes32 supersedesVersionId; string documentHash; uint8 status; address announcedBy; uint64 createdAt; }',
  'function getAction(bytes32 actionId) view returns (CorporateAction)',
  'function getVersion(bytes32 versionId) view returns (ActionVersion)',
  'function getActiveVersion(bytes32 actionId) view returns (ActionVersion)',
  'function getHistory(bytes32 actionId) view returns (ActionVersion[])',
  'function exists(bytes32 actionId) view returns (bool)',
  'function isActiveVersion(bytes32 actionId, bytes32 versionId) view returns (bool)',
  'function createAction(bytes32 actionId, address assetToken, uint8 actionType, uint256 rateBps, uint256 amountPerToken, uint64 recordDate, uint64 payableDate, string documentHash) returns (bytes32)',
  'function amendAction(bytes32 actionId, uint256 newRateBps, uint256 newAmountPerToken, uint64 newPayableDate, string newDocumentHash) returns (bytes32)',
  'event ActionCreated(bytes32 indexed actionId, bytes32 indexed versionId, address indexed assetToken, uint8 actionType, uint32 version)',
  'event ActionAmended(bytes32 indexed actionId, bytes32 indexed previousVersionId, bytes32 indexed newVersionId, uint32 newVersion)',
  'event VersionSuperseded(bytes32 indexed actionId, bytes32 indexed versionId, bytes32 indexed supersededBy)',
  'event ActionExecuted(bytes32 indexed actionId, bytes32 indexed versionId, address indexed executor)'
]);

export const PAYMENT_EXECUTOR_ABI = parseAbi([
  'function executeAction(bytes32 actionId, address treasury)',
  'function isExecuted(bytes32 versionId) view returns (bool)',
  'function executedVersion(bytes32 versionId) view returns (bool)',
  'event ActionPaymentExecuted(bytes32 indexed actionId, bytes32 indexed versionId, address indexed assetToken, uint8 actionType, uint256 totalAmount, uint256 holderCount)',
  'event HolderPaid(bytes32 indexed actionId, bytes32 indexed versionId, address indexed holder, uint256 assetBalance, uint256 paymentAmount)',
  'event HolderRedeemed(bytes32 indexed actionId, bytes32 indexed versionId, address indexed holder, uint256 tokenAmount, uint256 principalAmount)'
]);
