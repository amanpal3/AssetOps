// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ICorporateActionRegistry.sol";

/**
 * @title CorporateActionRegistry
 * @notice Append-only lifecycle authority for corporate-action announcements and amendments.
 * Preserves the full version DAG; only ACTIVE versions are payable.
 */
contract CorporateActionRegistry is AccessControl, ICorporateActionRegistry {
    bytes32 public constant ANNOUNCER_ROLE = keccak256("ANNOUNCER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    mapping(bytes32 => CorporateAction) private _actions;
    mapping(bytes32 => ActionVersion[]) private _history;
    mapping(bytes32 => bytes32) private _activeVersion;
    mapping(bytes32 => ActionVersion) private _versions;
    mapping(bytes32 => bool) public exists;

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

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ANNOUNCER_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
    }

    function createAction(
        bytes32 actionId,
        address assetToken,
        ActionType actionType,
        uint256 rateBps,
        uint256 amountPerToken,
        uint64 recordDate,
        uint64 payableDate,
        string calldata documentHash
    ) external onlyRole(ANNOUNCER_ROLE) returns (bytes32) {
        if (actionId == bytes32(0)) revert InvalidActionId();
        if (exists[actionId]) revert ActionAlreadyExists(actionId);
        if (assetToken == address(0)) revert InvalidAssetAddress();

        if (actionType == ActionType.COUPON || actionType == ActionType.INTEREST) {
            if (rateBps == 0 || rateBps > 10000) revert InvalidActionTerms();
        } else if (actionType == ActionType.REDEMPTION) {
            if (amountPerToken == 0) revert InvalidActionTerms();
        }

        bytes32 versionId = keccak256(abi.encodePacked(actionId, uint32(1), block.timestamp));

        ActionVersion memory v1 = ActionVersion({
            versionId: versionId,
            actionId: actionId,
            version: 1,
            rateBps: rateBps,
            amountPerToken: amountPerToken,
            recordDate: recordDate,
            payableDate: payableDate,
            supersedesVersionId: bytes32(0),
            documentHash: documentHash,
            status: ActionStatus.ACTIVE,
            announcedBy: msg.sender,
            createdAt: uint64(block.timestamp)
        });

        _actions[actionId] = CorporateAction({
            actionId: actionId,
            assetToken: assetToken,
            actionType: actionType,
            activeVersionId: versionId,
            status: ActionStatus.ACTIVE,
            createdAt: uint64(block.timestamp)
        });

        exists[actionId] = true;
        _activeVersion[actionId] = versionId;
        _versions[versionId] = v1;
        _history[actionId].push(v1);

        emit ActionCreated(actionId, versionId, assetToken, actionType, 1);
        return versionId;
    }

    function amendAction(
        bytes32 actionId,
        uint256 newRateBps,
        uint256 newAmountPerToken,
        uint64 newPayableDate,
        string calldata newDocumentHash
    ) external onlyRole(ANNOUNCER_ROLE) returns (bytes32) {
        if (!exists[actionId]) revert ActionNotFound(actionId);
        CorporateAction storage ca = _actions[actionId];
        if (ca.status != ActionStatus.ACTIVE) revert ActionNotActive(actionId);

        bytes32 oldVersionId = _activeVersion[actionId];
        ActionVersion storage oldVer = _versions[oldVersionId];

        uint32 newVersionNumber = oldVer.version + 1;
        bytes32 newVersionId = keccak256(abi.encodePacked(actionId, newVersionNumber, block.timestamp));

        if (ca.actionType == ActionType.COUPON || ca.actionType == ActionType.INTEREST) {
            if (newRateBps == 0 || newRateBps > 10000) revert InvalidActionTerms();
        } else if (ca.actionType == ActionType.REDEMPTION) {
            if (newAmountPerToken == 0) revert InvalidActionTerms();
        }

        // Mark old version SUPERSEDED
        oldVer.status = ActionStatus.SUPERSEDED;
        emit VersionSuperseded(actionId, oldVersionId, newVersionId);

        // Create and append new ACTIVE version
        ActionVersion memory newVer = ActionVersion({
            versionId: newVersionId,
            actionId: actionId,
            version: newVersionNumber,
            rateBps: newRateBps,
            amountPerToken: newAmountPerToken,
            recordDate: oldVer.recordDate,
            payableDate: newPayableDate > 0 ? newPayableDate : oldVer.payableDate,
            supersedesVersionId: oldVersionId,
            documentHash: newDocumentHash,
            status: ActionStatus.ACTIVE,
            announcedBy: msg.sender,
            createdAt: uint64(block.timestamp)
        });

        ca.activeVersionId = newVersionId;
        _activeVersion[actionId] = newVersionId;
        _versions[newVersionId] = newVer;
        _history[actionId].push(newVer);

        emit ActionAmended(actionId, oldVersionId, newVersionId, newVersionNumber);
        return newVersionId;
    }

    function markExecuted(bytes32 actionId, bytes32 versionId) external onlyRole(EXECUTOR_ROLE) {
        if (!exists[actionId]) revert ActionNotFound(actionId);
        CorporateAction storage ca = _actions[actionId];
        if (ca.status == ActionStatus.EXECUTED) revert ActionAlreadyExecuted(actionId);
        if (ca.status != ActionStatus.ACTIVE) revert ActionNotActive(actionId);

        bytes32 currentActiveId = _activeVersion[actionId];
        if (versionId != currentActiveId) revert VersionNotCurrent(actionId, versionId);

        ActionVersion storage ver = _versions[versionId];
        if (ver.status != ActionStatus.ACTIVE) revert VersionNotActive(versionId);

        ver.status = ActionStatus.EXECUTED;
        ca.status = ActionStatus.EXECUTED;

        emit ActionExecuted(actionId, versionId, msg.sender);
    }

    function getAction(bytes32 actionId) external view returns (CorporateAction memory) {
        if (!exists[actionId]) revert ActionNotFound(actionId);
        return _actions[actionId];
    }

    function getVersion(bytes32 versionId) external view returns (ActionVersion memory) {
        ActionVersion memory ver = _versions[versionId];
        if (ver.versionId == bytes32(0)) revert VersionNotFound(versionId);
        return ver;
    }

    function getActiveVersion(bytes32 actionId) external view returns (ActionVersion memory) {
        if (!exists[actionId]) revert ActionNotFound(actionId);
        return _versions[_activeVersion[actionId]];
    }

    function getHistory(bytes32 actionId) external view returns (ActionVersion[] memory) {
        if (!exists[actionId]) revert ActionNotFound(actionId);
        return _history[actionId];
    }

    function isActiveVersion(bytes32 actionId, bytes32 versionId) external view returns (bool) {
        return exists[actionId] && _activeVersion[actionId] == versionId && _versions[versionId].status == ActionStatus.ACTIVE;
    }
}
