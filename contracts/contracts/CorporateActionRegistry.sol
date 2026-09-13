// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ICorporateActionRegistry} from "./interfaces/ICorporateActionRegistry.sol";

/**
 * @title CorporateActionRegistry
 * @notice Append-only authority for corporate-action families and versions.
 * @dev Terms of a version are never overwritten. Status may move from ACTIVE to
 *      SUPERSEDED, EXECUTED, or CANCELLED. History is an ordered list of version
 *      IDs; reads always resolve the canonical `_versions` record so superseded
 *      versions stay queryable with their terminal status.
 *
 *      Only ANNOUNCER_ROLE may create, amend, or cancel.
 *      Only EXECUTOR_ROLE may mark the current ACTIVE version executed.
 */
contract CorporateActionRegistry is AccessControl, ICorporateActionRegistry {
    bytes32 public constant ANNOUNCER_ROLE = keccak256("ANNOUNCER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    uint256 public constant BPS_DENOMINATOR = 10_000;

    mapping(bytes32 => CorporateAction) private _actions;
    mapping(bytes32 => bytes32[]) private _versionIds;
    mapping(bytes32 => bytes32) private _activeVersion;
    mapping(bytes32 => ActionVersion) private _versions;
    mapping(bytes32 => bool) public exists;
    mapping(bytes32 => bool) private _versionExists;

    error InvalidAddress(address account);
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
    error ActionIsCancelled(bytes32 actionId);
    error AmendmentNotAllowed(bytes32 actionId);

    event ActionCreated(
        bytes32 indexed actionId,
        bytes32 indexed versionId,
        address indexed assetToken,
        ActionType actionType,
        uint32 version,
        uint256 rateBps,
        uint256 amountPerToken,
        uint64 recordDate,
        uint64 payableDate,
        string documentHash,
        address announcer
    );

    event ActionAmended(
        bytes32 indexed actionId,
        bytes32 indexed previousVersionId,
        bytes32 indexed newVersionId,
        uint32 newVersion,
        uint256 rateBps,
        uint256 amountPerToken,
        uint64 payableDate,
        string documentHash
    );

    event ActionVersionActivated(
        bytes32 indexed actionId,
        bytes32 indexed versionId,
        uint32 version,
        ActionType actionType,
        uint256 rateBps,
        uint256 amountPerToken,
        uint64 recordDate,
        uint64 payableDate,
        bytes32 supersedesVersionId
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

    event ActionCancelled(
        bytes32 indexed actionId,
        bytes32 indexed versionId,
        address indexed announcer,
        uint64 cancelledAt
    );

    constructor(address admin) {
        if (admin == address(0)) {
            revert InvalidAddress(admin);
        }
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
        _validateTerms(actionType, rateBps, amountPerToken, recordDate, payableDate);

        uint32 versionNumber = 1;
        bytes32 versionId = _computeVersionId(actionId, versionNumber, documentHash);
        uint64 nowTs = uint64(block.timestamp);

        _versions[versionId] = ActionVersion({
            versionId: versionId,
            actionId: actionId,
            version: versionNumber,
            actionType: actionType,
            rateBps: rateBps,
            amountPerToken: amountPerToken,
            recordDate: recordDate,
            payableDate: payableDate,
            supersedesVersionId: bytes32(0),
            documentHash: documentHash,
            status: ActionStatus.ACTIVE,
            announcedBy: msg.sender,
            createdAt: nowTs,
            updatedAt: nowTs
        });
        _versionExists[versionId] = true;
        _versionIds[actionId].push(versionId);

        _actions[actionId] = CorporateAction({
            actionId: actionId,
            assetToken: assetToken,
            actionType: actionType,
            activeVersionId: versionId,
            status: ActionStatus.ACTIVE,
            createdAt: nowTs,
            updatedAt: nowTs
        });
        exists[actionId] = true;
        _activeVersion[actionId] = versionId;

        emit ActionCreated(
            actionId,
            versionId,
            assetToken,
            actionType,
            versionNumber,
            rateBps,
            amountPerToken,
            recordDate,
            payableDate,
            documentHash,
            msg.sender
        );
        emit ActionVersionActivated(
            actionId,
            versionId,
            versionNumber,
            actionType,
            rateBps,
            amountPerToken,
            recordDate,
            payableDate,
            bytes32(0)
        );
        return versionId;
    }

    function amendAction(
        bytes32 actionId,
        uint256 newRateBps,
        uint256 newAmountPerToken,
        uint64 newPayableDate,
        string calldata newDocumentHash
    ) external onlyRole(ANNOUNCER_ROLE) returns (bytes32) {
        CorporateAction storage ca = _requireAction(actionId);
        if (ca.status == ActionStatus.EXECUTED) revert ActionAlreadyExecuted(actionId);
        if (ca.status == ActionStatus.CANCELLED) revert ActionIsCancelled(actionId);
        if (ca.status != ActionStatus.ACTIVE) revert AmendmentNotAllowed(actionId);

        bytes32 oldVersionId = _activeVersion[actionId];
        ActionVersion storage oldVer = _versions[oldVersionId];
        if (oldVer.status != ActionStatus.ACTIVE) revert VersionNotActive(oldVersionId);

        uint64 payableDate = newPayableDate > 0 ? newPayableDate : oldVer.payableDate;
        _validateTerms(ca.actionType, newRateBps, newAmountPerToken, oldVer.recordDate, payableDate);

        uint32 newVersionNumber = oldVer.version + 1;
        bytes32 newVersionId = _computeVersionId(actionId, newVersionNumber, newDocumentHash);
        uint64 nowTs = uint64(block.timestamp);

        oldVer.status = ActionStatus.SUPERSEDED;
        oldVer.updatedAt = nowTs;
        emit VersionSuperseded(actionId, oldVersionId, newVersionId);

        _versions[newVersionId] = ActionVersion({
            versionId: newVersionId,
            actionId: actionId,
            version: newVersionNumber,
            actionType: ca.actionType,
            rateBps: newRateBps,
            amountPerToken: newAmountPerToken,
            recordDate: oldVer.recordDate,
            payableDate: payableDate,
            supersedesVersionId: oldVersionId,
            documentHash: newDocumentHash,
            status: ActionStatus.ACTIVE,
            announcedBy: msg.sender,
            createdAt: nowTs,
            updatedAt: nowTs
        });
        _versionExists[newVersionId] = true;
        _versionIds[actionId].push(newVersionId);

        ca.activeVersionId = newVersionId;
        ca.updatedAt = nowTs;
        _activeVersion[actionId] = newVersionId;

        emit ActionAmended(
            actionId,
            oldVersionId,
            newVersionId,
            newVersionNumber,
            newRateBps,
            newAmountPerToken,
            payableDate,
            newDocumentHash
        );
        emit ActionVersionActivated(
            actionId,
            newVersionId,
            newVersionNumber,
            ca.actionType,
            newRateBps,
            newAmountPerToken,
            oldVer.recordDate,
            payableDate,
            oldVersionId
        );
        return newVersionId;
    }

    function cancelAction(bytes32 actionId) external onlyRole(ANNOUNCER_ROLE) {
        CorporateAction storage ca = _requireAction(actionId);
        if (ca.status == ActionStatus.EXECUTED) revert ActionAlreadyExecuted(actionId);
        if (ca.status == ActionStatus.CANCELLED) revert ActionIsCancelled(actionId);
        if (ca.status != ActionStatus.ACTIVE) revert ActionNotActive(actionId);

        bytes32 versionId = _activeVersion[actionId];
        ActionVersion storage ver = _versions[versionId];
        uint64 nowTs = uint64(block.timestamp);

        ver.status = ActionStatus.CANCELLED;
        ver.updatedAt = nowTs;
        ca.status = ActionStatus.CANCELLED;
        ca.updatedAt = nowTs;

        emit ActionCancelled(actionId, versionId, msg.sender, nowTs);
    }

    function markExecuted(bytes32 actionId, bytes32 versionId) external onlyRole(EXECUTOR_ROLE) {
        CorporateAction storage ca = _requireAction(actionId);
        if (ca.status == ActionStatus.EXECUTED) revert ActionAlreadyExecuted(actionId);
        if (ca.status == ActionStatus.CANCELLED) revert ActionIsCancelled(actionId);
        if (ca.status != ActionStatus.ACTIVE) revert ActionNotActive(actionId);
        if (versionId != _activeVersion[actionId]) revert VersionNotCurrent(actionId, versionId);
        if (!_versionExists[versionId]) revert VersionNotFound(versionId);

        ActionVersion storage ver = _versions[versionId];
        if (ver.status != ActionStatus.ACTIVE) revert VersionNotActive(versionId);

        uint64 nowTs = uint64(block.timestamp);
        ver.status = ActionStatus.EXECUTED;
        ver.updatedAt = nowTs;
        ca.status = ActionStatus.EXECUTED;
        ca.updatedAt = nowTs;

        emit ActionExecuted(actionId, versionId, msg.sender);
    }

    function getAction(bytes32 actionId) external view returns (CorporateAction memory) {
        return _requireActionMemory(actionId);
    }

    function getVersion(bytes32 versionId) external view returns (ActionVersion memory) {
        if (!_versionExists[versionId]) revert VersionNotFound(versionId);
        return _versions[versionId];
    }

    function getActiveVersion(bytes32 actionId) external view returns (ActionVersion memory) {
        _requireActionMemory(actionId);
        return _versions[_activeVersion[actionId]];
    }

    function getHistory(bytes32 actionId) external view returns (ActionVersion[] memory) {
        _requireActionMemory(actionId);
        bytes32[] storage ids = _versionIds[actionId];
        ActionVersion[] memory history = new ActionVersion[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            history[i] = _versions[ids[i]];
        }
        return history;
    }

    function isActiveVersion(bytes32 actionId, bytes32 versionId) external view returns (bool) {
        return exists[actionId]
            && _activeVersion[actionId] == versionId
            && _versions[versionId].status == ActionStatus.ACTIVE
            && _actions[actionId].status == ActionStatus.ACTIVE;
    }

    function _requireAction(bytes32 actionId) internal view returns (CorporateAction storage ca) {
        if (!exists[actionId]) revert ActionNotFound(actionId);
        ca = _actions[actionId];
    }

    function _requireActionMemory(bytes32 actionId) internal view returns (CorporateAction memory) {
        if (!exists[actionId]) revert ActionNotFound(actionId);
        return _actions[actionId];
    }

    function _validateTerms(
        ActionType actionType,
        uint256 rateBps,
        uint256 amountPerToken,
        uint64 recordDate,
        uint64 payableDate
    ) internal pure {
        if (payableDate == 0 || recordDate > payableDate) {
            revert InvalidActionTerms();
        }
        if (actionType == ActionType.COUPON || actionType == ActionType.INTEREST) {
            if (rateBps == 0 || rateBps > BPS_DENOMINATOR || amountPerToken != 0) {
                revert InvalidActionTerms();
            }
        } else if (actionType == ActionType.REDEMPTION) {
            if (amountPerToken == 0 || rateBps != 0) {
                revert InvalidActionTerms();
            }
        } else {
            revert InvalidActionTerms();
        }
    }

    function _computeVersionId(
        bytes32 actionId,
        uint32 versionNumber,
        string calldata documentHash
    ) internal view returns (bytes32) {
        return keccak256(
            abi.encode(actionId, versionNumber, documentHash, msg.sender, block.number, _versionIds[actionId].length)
        );
    }
}
