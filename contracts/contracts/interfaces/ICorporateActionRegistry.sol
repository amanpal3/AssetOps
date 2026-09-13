// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICorporateActionRegistry {
    enum ActionType {
        COUPON,
        INTEREST,
        REDEMPTION
    }

    enum ActionStatus {
        DRAFT,
        ACTIVE,
        SUPERSEDED,
        EXECUTED,
        CANCELLED
    }

    struct CorporateAction {
        bytes32 actionId;
        address assetToken;
        ActionType actionType;
        bytes32 activeVersionId;
        ActionStatus status;
        uint64 createdAt;
        uint64 updatedAt;
    }

    struct ActionVersion {
        bytes32 versionId;
        bytes32 actionId;
        uint32 version;
        ActionType actionType;
        uint256 rateBps;
        uint256 amountPerToken;
        uint64 recordDate;
        uint64 payableDate;
        bytes32 supersedesVersionId;
        string documentHash;
        ActionStatus status;
        address announcedBy;
        uint64 createdAt;
        uint64 updatedAt;
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
    ) external returns (bytes32 versionId);

    function amendAction(
        bytes32 actionId,
        uint256 newRateBps,
        uint256 newAmountPerToken,
        uint64 newPayableDate,
        string calldata newDocumentHash
    ) external returns (bytes32 versionId);

    function cancelAction(bytes32 actionId) external;

    function markExecuted(bytes32 actionId, bytes32 versionId) external;

    function getAction(bytes32 actionId) external view returns (CorporateAction memory);
    function getVersion(bytes32 versionId) external view returns (ActionVersion memory);
    function getActiveVersion(bytes32 actionId) external view returns (ActionVersion memory);
    function getHistory(bytes32 actionId) external view returns (ActionVersion[] memory);
    function isActiveVersion(bytes32 actionId, bytes32 versionId) external view returns (bool);
}
