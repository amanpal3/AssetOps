import { parseAbi } from 'viem';

export const SecurityTokenAbi = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event WhitelistUpdated(address indexed account, bool status)',
  'event HolderRegistered(address indexed account)',
  'event AuthorizedBurn(address indexed account, uint256 amount)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function isWhitelisted(address account) view returns (bool)',
  'function getHolders() view returns (address[])'
]);

export const CorporateActionRegistryAbi = parseAbi([
  'event ActionCreated(bytes32 indexed actionId, bytes32 indexed versionId, address indexed assetToken, uint8 actionType, uint32 version)',
  'event ActionAmended(bytes32 indexed actionId, bytes32 indexed previousVersionId, bytes32 indexed newVersionId, uint32 newVersion)',
  'event VersionSuperseded(bytes32 indexed actionId, bytes32 indexed versionId, bytes32 indexed supersededBy)',
  'event ActionExecuted(bytes32 indexed actionId, bytes32 indexed versionId, address indexed executor)',
  'event ActionCancelled(bytes32 indexed actionId, bytes32 indexed versionId)',
  'function getAction(bytes32 actionId) view returns ((bytes32 actionId, address assetToken, uint8 actionType, bytes32 activeVersionId, uint8 status, uint64 createdAt))',
  'function getVersion(bytes32 versionId) view returns ((bytes32 versionId, bytes32 actionId, uint32 version, uint256 rateBps, uint256 amountPerToken, uint64 recordDate, uint64 payableDate, bytes32 supersedesVersionId, string documentHash, uint8 status, address announcedBy, uint64 createdAt))',
  'function getActiveVersion(bytes32 actionId) view returns ((bytes32 versionId, bytes32 actionId, uint32 version, uint256 rateBps, uint256 amountPerToken, uint64 recordDate, uint64 payableDate, bytes32 supersedesVersionId, string documentHash, uint8 status, address announcedBy, uint64 createdAt))'
]);

export const PaymentExecutorAbi = parseAbi([
  'event ActionPaymentExecuted(bytes32 indexed actionId, bytes32 indexed versionId, address indexed assetToken, uint8 actionType, uint256 totalAmount, uint256 holderCount)',
  'event HolderPaid(bytes32 indexed actionId, bytes32 indexed versionId, address indexed holder, uint256 assetBalance, uint256 paymentAmount)',
  'event HolderRedeemed(bytes32 indexed actionId, bytes32 indexed versionId, address indexed holder, uint256 tokenAmount, uint256 principalAmount)'
]);
