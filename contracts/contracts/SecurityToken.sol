// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ISecurityToken.sol";

/**
 * @title SecurityToken
 * @notice Permissioned ERC-20 token representing a tokenized bond or real-world asset.
 * Balances represent the live authoritative holder registry for AssetOps lifecycle actions.
 */
contract SecurityToken is ERC20, AccessControl, Pausable, ISecurityToken {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    mapping(address => bool) private _whitelisted;
    address[] private _holders;
    mapping(address => bool) private _knownHolder;

    error TransferPaused();
    error SenderNotWhitelisted(address sender);
    error ReceiverNotWhitelisted(address receiver);
    error AmountExceedsBalance(address account, uint256 requested, uint256 available);

    event WhitelistUpdated(address indexed account, bool status);
    event HolderRegistered(address indexed account);
    event AuthorizedBurn(address indexed account, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        address admin
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(AGENT_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
    }

    function setWhitelisted(address account, bool status) external onlyRole(AGENT_ROLE) {
        _whitelisted[account] = status;
        emit WhitelistUpdated(account, status);
    }

    function isWhitelisted(address account) public view returns (bool) {
        return _whitelisted[account];
    }

    function pause() external onlyRole(AGENT_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(AGENT_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (!_whitelisted[to]) {
            revert ReceiverNotWhitelisted(to);
        }
        _mint(to, amount);
    }

    function burnFromHolder(address account, uint256 amount) external onlyRole(BURNER_ROLE) {
        uint256 currentBal = balanceOf(account);
        if (amount > currentBal) {
            revert AmountExceedsBalance(account, amount, currentBal);
        }
        _burn(account, amount);
        emit AuthorizedBurn(account, amount);
    }

    function getHolders() external view returns (address[] memory) {
        return _holders;
    }

    function getHolderCount() external view returns (uint256) {
        return _holders.length;
    }

    function isHolder(address account) external view returns (bool) {
        return _knownHolder[account] && balanceOf(account) > 0;
    }

    function detectTransferRestriction(
        address from,
        address to,
        uint256 value
    ) public view returns (uint8) {
        if (paused()) return 3;
        if (from != address(0) && !_whitelisted[from]) return 1;
        if (to != address(0) && !_whitelisted[to]) return 2;
        if (from != address(0) && balanceOf(from) < value) return 4;
        return 0;
    }

    function messageForTransferRestriction(uint8 restrictionCode) external pure returns (string memory) {
        if (restrictionCode == 0) return "SUCCESS";
        if (restrictionCode == 1) return "SENDER_NOT_WHITELISTED";
        if (restrictionCode == 2) return "RECEIVER_NOT_WHITELISTED";
        if (restrictionCode == 3) return "TRANSFERS_PAUSED";
        if (restrictionCode == 4) return "INSUFFICIENT_BALANCE";
        return "UNKNOWN_RESTRICTION";
    }

    /**
     * @dev Hook override for OpenZeppelin v5.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        // Pausing restricts transfers and mints, but authorized burning (e.g. redemption at maturity) is permitted
        if (paused() && to != address(0)) {
            revert TransferPaused();
        }

        if (from != address(0) && !_whitelisted[from]) {
            revert SenderNotWhitelisted(from);
        }

        if (to != address(0) && !_whitelisted[to]) {
            revert ReceiverNotWhitelisted(to);
        }

        super._update(from, to, value);

        if (to != address(0) && !_knownHolder[to]) {
            _knownHolder[to] = true;
            _holders.push(to);
            emit HolderRegistered(to);
        }
    }
}
