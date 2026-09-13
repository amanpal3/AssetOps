// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ISecurityToken.sol";
import "./interfaces/IPaymentCurrency.sol";
import "./interfaces/ICorporateActionRegistry.sol";

/**
 * @title PaymentExecutor
 * @notice Idempotent execution engine for coupon payouts and maturity principal redemption.
 * Validates active registry status, enforces checks-effects-interactions, and burns redeemed tokens.
 */
contract PaymentExecutor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    ICorporateActionRegistry public immutable registry;
    IPaymentCurrency public immutable paymentCurrency;

    mapping(bytes32 => bool) public executedVersion;

    error NotPayableYet(uint64 payableDate, uint64 currentTime);
    error UnsupportedActionType();
    error AlreadyExecuted(bytes32 actionId, bytes32 versionId);
    error SupersededVersion(bytes32 actionId, bytes32 versionId);
    error InsufficientTreasuryBalance(uint256 required, uint256 available);
    error InsufficientTreasuryAllowance(uint256 required, uint256 allowance);
    error EmptyHolderSet();

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
        uint256 paymentAmount
    );

    event HolderRedeemed(
        bytes32 indexed actionId,
        bytes32 indexed versionId,
        address indexed holder,
        uint256 tokenAmount,
        uint256 principalAmount
    );

    constructor(
        address admin,
        address _registry,
        address _paymentCurrency
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
        registry = ICorporateActionRegistry(_registry);
        paymentCurrency = IPaymentCurrency(_paymentCurrency);
    }

    function executeAction(bytes32 actionId, address treasury)
        external
        onlyRole(EXECUTOR_ROLE)
        nonReentrant
    {
        ICorporateActionRegistry.CorporateAction memory ca = registry.getAction(actionId);
        ICorporateActionRegistry.ActionVersion memory ver = registry.getActiveVersion(actionId);

        if (executedVersion[ver.versionId]) {
            revert AlreadyExecuted(actionId, ver.versionId);
        }

        if (ver.status == ICorporateActionRegistry.ActionStatus.SUPERSEDED) {
            revert SupersededVersion(actionId, ver.versionId);
        }

        if (block.timestamp < ver.payableDate) {
            revert NotPayableYet(ver.payableDate, uint64(block.timestamp));
        }

        ISecurityToken asset = ISecurityToken(ca.assetToken);
        address[] memory holders = asset.getHolders();
        if (holders.length == 0) revert EmptyHolderSet();

        if (ca.actionType == ICorporateActionRegistry.ActionType.COUPON || ca.actionType == ICorporateActionRegistry.ActionType.INTEREST) {
            _executeCoupon(actionId, ver, asset, holders, treasury);
        } else if (ca.actionType == ICorporateActionRegistry.ActionType.REDEMPTION) {
            _executeRedemption(actionId, ver, asset, holders, treasury);
        } else {
            revert UnsupportedActionType();
        }
    }

    function _executeCoupon(
        bytes32 actionId,
        ICorporateActionRegistry.ActionVersion memory ver,
        ISecurityToken asset,
        address[] memory holders,
        address treasury
    ) internal {
        // Calculate required total payment
        uint256 totalRequired = 0;
        uint256[] memory amounts = new uint256[](holders.length);

        for (uint256 i = 0; i < holders.length; i++) {
            uint256 bal = asset.balanceOf(holders[i]);
            if (bal > 0) {
                // payment = balance * rateBps / 10,000
                uint256 payment = (bal * ver.rateBps) / 10000;
                amounts[i] = payment;
                totalRequired += payment;
            }
        }

        _validateTreasury(treasury, totalRequired);

        // State change: set idempotency guard BEFORE transfers
        executedVersion[ver.versionId] = true;
        registry.markExecuted(actionId, ver.versionId);

        // Transfer funds
        uint256 paidCount = 0;
        for (uint256 i = 0; i < holders.length; i++) {
            if (amounts[i] > 0) {
                IERC20(address(paymentCurrency)).safeTransferFrom(treasury, holders[i], amounts[i]);
                emit HolderPaid(actionId, ver.versionId, holders[i], asset.balanceOf(holders[i]), amounts[i]);
                paidCount++;
            }
        }

        emit ActionPaymentExecuted(
            actionId,
            ver.versionId,
            address(asset),
            ICorporateActionRegistry.ActionType.COUPON,
            totalRequired,
            paidCount
        );
    }

    function _executeRedemption(
        bytes32 actionId,
        ICorporateActionRegistry.ActionVersion memory ver,
        ISecurityToken asset,
        address[] memory holders,
        address treasury
    ) internal {
        uint256 totalRequired = 0;
        uint256[] memory principals = new uint256[](holders.length);
        uint256[] memory tokenBurns = new uint256[](holders.length);

        for (uint256 i = 0; i < holders.length; i++) {
            uint256 bal = asset.balanceOf(holders[i]);
            if (bal > 0) {
                // principal = balance * amountPerToken / 10^18 (assuming standard decimals)
                uint256 principal = (bal * ver.amountPerToken) / 1e18;
                principals[i] = principal;
                tokenBurns[i] = bal;
                totalRequired += principal;
            }
        }

        _validateTreasury(treasury, totalRequired);

        // State change: set idempotency guard BEFORE transfers
        executedVersion[ver.versionId] = true;
        registry.markExecuted(actionId, ver.versionId);

        uint256 redeemedCount = 0;
        for (uint256 i = 0; i < holders.length; i++) {
            if (principals[i] > 0) {
                // Pay principal
                IERC20(address(paymentCurrency)).safeTransferFrom(treasury, holders[i], principals[i]);
                // Authorized burn of asset tokens
                asset.burnFromHolder(holders[i], tokenBurns[i]);

                emit HolderRedeemed(actionId, ver.versionId, holders[i], tokenBurns[i], principals[i]);
                redeemedCount++;
            }
        }

        emit ActionPaymentExecuted(
            actionId,
            ver.versionId,
            address(asset),
            ICorporateActionRegistry.ActionType.REDEMPTION,
            totalRequired,
            redeemedCount
        );
    }

    function _validateTreasury(address treasury, uint256 totalRequired) internal view {
        uint256 treasuryBal = paymentCurrency.balanceOf(treasury);
        if (treasuryBal < totalRequired) {
            revert InsufficientTreasuryBalance(totalRequired, treasuryBal);
        }

        uint256 treasuryAllowance = paymentCurrency.allowance(treasury, address(this));
        if (treasuryAllowance < totalRequired) {
            revert InsufficientTreasuryAllowance(totalRequired, treasuryAllowance);
        }
    }

    function isExecuted(bytes32 versionId) external view returns (bool) {
        return executedVersion[versionId];
    }

    function isExecuted(bytes32 /* actionId */, bytes32 versionId) external view returns (bool) {
        return executedVersion[versionId];
    }

    function previewCoupon(bytes32 actionId)
        external
        view
        returns (
            address[] memory eligibleHolders,
            uint256[] memory amounts,
            uint256 total
        )
    {
        ICorporateActionRegistry.CorporateAction memory ca = registry.getAction(actionId);
        ICorporateActionRegistry.ActionVersion memory ver = registry.getActiveVersion(actionId);

        ISecurityToken asset = ISecurityToken(ca.assetToken);
        address[] memory allHolders = asset.getHolders();

        uint256 count = 0;
        for (uint256 i = 0; i < allHolders.length; i++) {
            if (asset.balanceOf(allHolders[i]) > 0) {
                count++;
            }
        }

        eligibleHolders = new address[](count);
        amounts = new uint256[](count);
        total = 0;

        uint256 idx = 0;
        for (uint256 i = 0; i < allHolders.length; i++) {
            uint256 bal = asset.balanceOf(allHolders[i]);
            if (bal > 0) {
                uint256 p = (bal * ver.rateBps) / 10000;
                eligibleHolders[idx] = allHolders[i];
                amounts[idx] = p;
                total += p;
                idx++;
            }
        }
    }

    function previewRedemption(bytes32 actionId)
        external
        view
        returns (
            address[] memory eligibleHolders,
            uint256[] memory amounts,
            uint256 total
        )
    {
        ICorporateActionRegistry.CorporateAction memory ca = registry.getAction(actionId);
        ICorporateActionRegistry.ActionVersion memory ver = registry.getActiveVersion(actionId);

        ISecurityToken asset = ISecurityToken(ca.assetToken);
        address[] memory allHolders = asset.getHolders();

        uint256 count = 0;
        for (uint256 i = 0; i < allHolders.length; i++) {
            if (asset.balanceOf(allHolders[i]) > 0) {
                count++;
            }
        }

        eligibleHolders = new address[](count);
        amounts = new uint256[](count);
        total = 0;

        uint256 idx = 0;
        for (uint256 i = 0; i < allHolders.length; i++) {
            uint256 bal = asset.balanceOf(allHolders[i]);
            if (bal > 0) {
                uint256 p = (bal * ver.amountPerToken) / 1e18;
                eligibleHolders[idx] = allHolders[i];
                amounts[idx] = p;
                total += p;
                idx++;
            }
        }
    }
}
