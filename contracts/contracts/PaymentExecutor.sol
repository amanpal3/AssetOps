// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISecurityToken} from "./interfaces/ISecurityToken.sol";
import {IPaymentCurrency} from "./interfaces/IPaymentCurrency.sol";
import {ICorporateActionRegistry} from "./interfaces/ICorporateActionRegistry.sol";

/**
 * @title PaymentExecutor
 * @notice Sole on-chain coordinator for coupon, interest, and redemption payouts.
 * @dev Financial authority is this contract plus SecurityToken / registry state.
 *      The indexer and frontend must never be treated as payment sources.
 *
 * Rounding: entitlements use Solidity checked integer division that rounds down:
 *   coupon/interest = assetBalance * rateBps / 10_000
 *   redemption      = assetBalance * amountPerToken / 10**18
 *
 * Duplicate execution is blocked by `executedVersion` and by the registry
 * terminal EXECUTED status. Any revert unwinds payouts, burns, and status.
 *
 * Hackathon: one deployer may hold EXECUTOR_ROLE, TREASURY_ROLE, and admin.
 * Production must split these roles and use multisig governance.
 */
contract PaymentExecutor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant ASSET_UNIT = 1e18;

    ICorporateActionRegistry public immutable registry;
    IPaymentCurrency public immutable paymentCurrency;
    address public treasury;

    mapping(bytes32 => bool) public executedVersion;

    error InvalidAddress(address account);
    error InvalidTokenDependency();
    error TreasuryNotSet();
    error NotPayableYet(uint64 payableDate, uint64 currentTime);
    error UnsupportedActionType();
    error AlreadyExecuted(bytes32 actionId, bytes32 versionId);
    error SupersededVersion(bytes32 actionId, bytes32 versionId);
    error InsufficientTreasuryBalance(uint256 required, uint256 available);
    error InsufficientTreasuryAllowance(uint256 required, uint256 allowance);
    error EmptyHolderSet();
    error PaymentCalculationOverflow();
    error BurnFailed(address holder, uint256 amount);
    error VersionNotCurrent(bytes32 actionId, bytes32 versionId);
    error ActionNotActive(bytes32 actionId);

    event TreasuryUpdated(
        address indexed previousTreasury,
        address indexed newTreasury,
        address indexed caller
    );

    event ActionExecutionStarted(
        bytes32 indexed actionId,
        bytes32 indexed versionId,
        address indexed executor,
        ICorporateActionRegistry.ActionType actionType,
        address assetToken,
        address treasury,
        uint256 holderCount
    );

    event ActionPaymentExecuted(
        bytes32 indexed actionId,
        bytes32 indexed versionId,
        address indexed assetToken,
        ICorporateActionRegistry.ActionType actionType,
        uint256 totalAmount,
        uint256 holderCount
    );

    event HolderPaid(
        bytes32 indexed actionId,
        bytes32 indexed versionId,
        address indexed holder,
        uint256 assetBalance,
        uint256 paymentAmount,
        address paymentToken
    );

    event HolderRedeemed(
        bytes32 indexed actionId,
        bytes32 indexed versionId,
        address indexed holder,
        uint256 tokenAmount,
        uint256 principalAmount,
        address paymentToken
    );

    event RedemptionExecuted(
        bytes32 indexed actionId,
        bytes32 indexed versionId,
        address indexed assetToken,
        uint256 totalPrincipal,
        uint256 tokensBurned,
        uint256 holderCount
    );

    constructor(
        address admin,
        address registry_,
        address paymentCurrency_,
        address treasury_
    ) {
        if (admin == address(0) || registry_ == address(0) || paymentCurrency_ == address(0)) {
            revert InvalidAddress(address(0));
        }
        if (registry_.code.length == 0 || paymentCurrency_.code.length == 0) {
            revert InvalidTokenDependency();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
        _grantRole(TREASURY_ROLE, admin);

        registry = ICorporateActionRegistry(registry_);
        paymentCurrency = IPaymentCurrency(paymentCurrency_);

        if (treasury_ != address(0)) {
            treasury = treasury_;
            _grantRole(TREASURY_ROLE, treasury_);
            emit TreasuryUpdated(address(0), treasury_, admin);
        }
    }

    /// @notice TREASURY_ROLE selects the PaymentCurrency source for payouts.
    function setTreasury(address newTreasury) external onlyRole(TREASURY_ROLE) {
        if (newTreasury == address(0)) {
            revert InvalidAddress(newTreasury);
        }
        address previous = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(previous, newTreasury, msg.sender);
    }

    function executeCoupon(bytes32 actionId) external onlyRole(EXECUTOR_ROLE) nonReentrant {
        _executeTyped(actionId, ICorporateActionRegistry.ActionType.COUPON);
    }

    function executeInterest(bytes32 actionId) external onlyRole(EXECUTOR_ROLE) nonReentrant {
        _executeTyped(actionId, ICorporateActionRegistry.ActionType.INTEREST);
    }

    function executeRedemption(bytes32 actionId) external onlyRole(EXECUTOR_ROLE) nonReentrant {
        _executeTyped(actionId, ICorporateActionRegistry.ActionType.REDEMPTION);
    }

    function executeAction(bytes32 actionId) external onlyRole(EXECUTOR_ROLE) nonReentrant {
        ICorporateActionRegistry.ActionVersion memory active = registry.getActiveVersion(actionId);
        _execute(actionId, active.versionId);
    }

    function executeVersion(bytes32 actionId, bytes32 versionId)
        external
        onlyRole(EXECUTOR_ROLE)
        nonReentrant
    {
        _execute(actionId, versionId);
    }

    function previewCoupon(bytes32 actionId)
        external
        view
        returns (address[] memory holders, uint256[] memory amounts, uint256 total)
    {
        return _preview(actionId, false);
    }

    function previewRedemption(bytes32 actionId)
        external
        view
        returns (address[] memory holders, uint256[] memory amounts, uint256 total)
    {
        return _preview(actionId, true);
    }

    function isExecuted(bytes32, bytes32 versionId) external view returns (bool) {
        return executedVersion[versionId];
    }

    function _executeTyped(
        bytes32 actionId,
        ICorporateActionRegistry.ActionType expected
    ) internal {
        ICorporateActionRegistry.CorporateAction memory ca = registry.getAction(actionId);
        if (ca.actionType != expected) {
            revert UnsupportedActionType();
        }
        _execute(actionId, registry.getActiveVersion(actionId).versionId);
    }

    function _sum(uint256[] memory values) internal pure returns (uint256 total) {
        for (uint256 i = 0; i < values.length; i++) {
            total += values[i];
        }
    }

    function _execute(bytes32 actionId, bytes32 versionId) internal {
        ICorporateActionRegistry.CorporateAction memory ca = registry.getAction(actionId);
        ICorporateActionRegistry.ActionVersion memory ver = registry.getVersion(versionId);

        if (ver.actionId != actionId) {
            revert VersionNotCurrent(actionId, versionId);
        }
        if (
            executedVersion[versionId]
                || ca.status == ICorporateActionRegistry.ActionStatus.EXECUTED
                || ver.status == ICorporateActionRegistry.ActionStatus.EXECUTED
        ) {
            revert AlreadyExecuted(actionId, versionId);
        }
        if (ver.status == ICorporateActionRegistry.ActionStatus.SUPERSEDED) {
            revert SupersededVersion(actionId, versionId);
        }
        if (ca.status != ICorporateActionRegistry.ActionStatus.ACTIVE) {
            revert ActionNotActive(actionId);
        }
        if (!registry.isActiveVersion(actionId, versionId)) {
            revert VersionNotCurrent(actionId, versionId);
        }
        if (block.timestamp < ver.payableDate) {
            revert NotPayableYet(ver.payableDate, uint64(block.timestamp));
        }

        ISecurityToken asset = ISecurityToken(ca.assetToken);
        if (address(asset).code.length == 0) {
            revert InvalidTokenDependency();
        }

        address[] memory holders = asset.getHolders();
        if (holders.length == 0) revert EmptyHolderSet();

        emit ActionExecutionStarted(
            actionId,
            versionId,
            msg.sender,
            ca.actionType,
            address(asset),
            _requireTreasury(),
            holders.length
        );

        if (
            ca.actionType == ICorporateActionRegistry.ActionType.COUPON
                || ca.actionType == ICorporateActionRegistry.ActionType.INTEREST
        ) {
            _executeRatePayment(actionId, ver, ca.actionType, asset, holders);
        } else if (ca.actionType == ICorporateActionRegistry.ActionType.REDEMPTION) {
            _executeRedemption(actionId, ver, asset, holders);
        } else {
            revert UnsupportedActionType();
        }
    }

    function _executeRatePayment(
        bytes32 actionId,
        ICorporateActionRegistry.ActionVersion memory ver,
        ICorporateActionRegistry.ActionType actionType,
        ISecurityToken asset,
        address[] memory holders
    ) internal {
        uint256 length = holders.length;
        uint256[] memory amounts = new uint256[](length);
        uint256[] memory balances = new uint256[](length);
        uint256 totalRequired;
        uint256 payableHolders;

        for (uint256 i = 0; i < length; i++) {
            uint256 bal = asset.balanceOf(holders[i]);
            balances[i] = bal;
            if (bal == 0) continue;
            uint256 payment = _couponAmount(bal, ver.rateBps);
            amounts[i] = payment;
            if (payment > 0) {
                totalRequired += payment;
                payableHolders++;
            }
        }

        if (payableHolders == 0) revert EmptyHolderSet();
        _validateTreasury(totalRequired);

        // Effects before interactions: a revert unwinds this guard.
        executedVersion[ver.versionId] = true;

        address source = _requireTreasury();
        IERC20 currency = IERC20(address(paymentCurrency));
        for (uint256 i = 0; i < length; i++) {
            if (amounts[i] == 0) continue;
            currency.safeTransferFrom(source, holders[i], amounts[i]);
            emit HolderPaid(
                actionId,
                ver.versionId,
                holders[i],
                balances[i],
                amounts[i],
                address(paymentCurrency)
            );
        }

        registry.markExecuted(actionId, ver.versionId);

        emit ActionPaymentExecuted(
            actionId,
            ver.versionId,
            address(asset),
            actionType,
            totalRequired,
            payableHolders
        );
    }

    function _executeRedemption(
        bytes32 actionId,
        ICorporateActionRegistry.ActionVersion memory ver,
        ISecurityToken asset,
        address[] memory holders
    ) internal {
        uint256 length = holders.length;
        uint256[] memory principals = new uint256[](length);
        uint256[] memory tokenBurns = new uint256[](length);
        uint256 totalRequired;
        uint256 payableHolders;

        for (uint256 i = 0; i < length; i++) {
            uint256 bal = asset.balanceOf(holders[i]);
            if (bal == 0) continue;
            uint256 principal = _redemptionAmount(bal, ver.amountPerToken);
            if (principal == 0) continue;
            principals[i] = principal;
            tokenBurns[i] = bal;
            totalRequired += principal;
            payableHolders++;
        }

        if (payableHolders == 0) revert EmptyHolderSet();
        _validateTreasury(totalRequired);

        executedVersion[ver.versionId] = true;

        address source = _requireTreasury();
        IERC20 currency = IERC20(address(paymentCurrency));
        for (uint256 i = 0; i < length; i++) {
            if (tokenBurns[i] == 0) continue;
            currency.safeTransferFrom(source, holders[i], principals[i]);
            uint256 supplyBefore = asset.totalSupply();
            asset.burnFromHolder(holders[i], tokenBurns[i]);
            if (asset.totalSupply() != supplyBefore - tokenBurns[i]) {
                revert BurnFailed(holders[i], tokenBurns[i]);
            }
            emit HolderRedeemed(
                actionId,
                ver.versionId,
                holders[i],
                tokenBurns[i],
                principals[i],
                address(paymentCurrency)
            );
        }

        registry.markExecuted(actionId, ver.versionId);

        emit ActionPaymentExecuted(
            actionId,
            ver.versionId,
            address(asset),
            ICorporateActionRegistry.ActionType.REDEMPTION,
            totalRequired,
            payableHolders
        );
        emit RedemptionExecuted(
            actionId,
            ver.versionId,
            address(asset),
            totalRequired,
            _sum(tokenBurns),
            payableHolders
        );
    }

    function _preview(bytes32 actionId, bool redemption)
        internal
        view
        returns (address[] memory holdersOut, uint256[] memory amountsOut, uint256 total)
    {
        ICorporateActionRegistry.CorporateAction memory ca = registry.getAction(actionId);
        ICorporateActionRegistry.ActionVersion memory ver = registry.getActiveVersion(actionId);
        ISecurityToken asset = ISecurityToken(ca.assetToken);
        address[] memory listed = asset.getHolders();

        uint256 count;
        uint256[] memory tmpAmounts = new uint256[](listed.length);
        address[] memory tmpHolders = new address[](listed.length);

        for (uint256 i = 0; i < listed.length; i++) {
            uint256 bal = asset.balanceOf(listed[i]);
            if (bal == 0) continue;
            uint256 amount = redemption
                ? _redemptionAmount(bal, ver.amountPerToken)
                : _couponAmount(bal, ver.rateBps);
            if (amount == 0) continue;
            tmpHolders[count] = listed[i];
            tmpAmounts[count] = amount;
            total += amount;
            count++;
        }

        holdersOut = new address[](count);
        amountsOut = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            holdersOut[i] = tmpHolders[i];
            amountsOut[i] = tmpAmounts[i];
        }
    }

    function _couponAmount(uint256 assetBalance, uint256 rateBps) internal pure returns (uint256) {
        if (rateBps == 0 || rateBps > BPS_DENOMINATOR) {
            revert PaymentCalculationOverflow();
        }
        return (assetBalance * rateBps) / BPS_DENOMINATOR;
    }

    function _redemptionAmount(uint256 assetBalance, uint256 amountPerToken) internal pure returns (uint256) {
        if (amountPerToken == 0) {
            revert PaymentCalculationOverflow();
        }
        return (assetBalance * amountPerToken) / ASSET_UNIT;
    }

    function _validateTreasury(uint256 totalRequired) internal view {
        address source = _requireTreasury();
        uint256 treasuryBal = paymentCurrency.balanceOf(source);
        if (treasuryBal < totalRequired) {
            revert InsufficientTreasuryBalance(totalRequired, treasuryBal);
        }
        uint256 treasuryAllowance = paymentCurrency.allowance(source, address(this));
        if (treasuryAllowance < totalRequired) {
            revert InsufficientTreasuryAllowance(totalRequired, treasuryAllowance);
        }
    }

    function _requireTreasury() internal view returns (address source) {
        source = treasury;
        if (source == address(0)) revert TreasuryNotSet();
    }
}
