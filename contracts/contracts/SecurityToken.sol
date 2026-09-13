// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ISecurityToken} from "./interfaces/ISecurityToken.sol";

/**
 * @title SecurityToken
 * @notice Permissioned ERC-20 for a tokenized bond / real-world asset.
 * @dev Live balances are the financial source of truth. The holder array is
 *      monotonic for MVP enumeration: zero-balance addresses may remain listed.
 *      Payment eligibility must always read `balanceOf`, never list membership.
 *
 * Transfer restrictions are enforced in OpenZeppelin 5.x `_update` (not the
 * removed `_beforeTokenTransfer` hook).
 */
contract SecurityToken is ERC20, AccessControl, Pausable, ISecurityToken {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint8 public constant SUCCESS_CODE = 0;
    uint8 public constant SENDER_NOT_WHITELISTED_CODE = 1;
    uint8 public constant RECEIVER_NOT_WHITELISTED_CODE = 2;
    uint8 public constant TRANSFERS_PAUSED_CODE = 3;
    uint8 public constant INSUFFICIENT_BALANCE_CODE = 4;

    mapping(address => bool) private _whitelisted;
    address[] private _holders;
    mapping(address => bool) private _knownHolder;

    error InvalidAddress(address account);
    error TransferPaused();
    error SenderNotWhitelisted(address sender);
    error ReceiverNotWhitelisted(address receiver);
    error AmountExceedsBalance(address account, uint256 requested, uint256 available);
    error HolderNotWhitelisted(address account);

    event WhitelistUpdated(address indexed account, bool status);
    event HolderRegistered(address indexed account);
    event HolderAdded(address indexed account, uint256 holderIndex, uint256 holderCount);
    event TokenMinted(address indexed to, uint256 amount, uint256 newTotalSupply);
    event TokenBurned(address indexed holder, uint256 amount, uint256 newTotalSupply);
    event TransferRestrictionFailure(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint8 code
    );
    event AuthorizedBurn(address indexed account, uint256 amount, uint256 newTotalSupply);

    constructor(string memory name_, string memory symbol_, address admin) ERC20(name_, symbol_) {
        if (admin == address(0)) {
            revert InvalidAddress(admin);
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(AGENT_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
    }

    /// @notice Allowlist an account for minting, sending, or receiving the token.
    function setWhitelisted(address account, bool status) external onlyRole(AGENT_ROLE) {
        if (account == address(0)) {
            revert InvalidAddress(account);
        }
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
        if (to == address(0)) {
            revert InvalidAddress(to);
        }
        if (!_whitelisted[to]) {
            revert HolderNotWhitelisted(to);
        }
        _mint(to, amount);
        emit TokenMinted(to, amount, totalSupply());
    }

    /**
     * @notice Role-authorized burn used by redemption. Does not require the
     *         holder to remain allowlisted; live balance is the only cap.
     */
    function burnFromHolder(address account, uint256 amount) public virtual onlyRole(BURNER_ROLE) {
        if (account == address(0)) {
            revert InvalidAddress(account);
        }
        uint256 currentBal = balanceOf(account);
        if (amount > currentBal) {
            revert AmountExceedsBalance(account, amount, currentBal);
        }
        _burn(account, amount);
        uint256 supply = totalSupply();
        emit TokenBurned(account, amount, supply);
        emit AuthorizedBurn(account, amount, supply);
    }

    /// @notice Monotonic enumeration. Zero-balance addresses may still appear.
    function getHolders() external view returns (address[] memory) {
        return _holders;
    }

    function getHolderCount() external view returns (uint256) {
        return _holders.length;
    }

    /// @notice True once an address has been registered, even at zero balance.
    function isHolder(address account) external view returns (bool) {
        return _knownHolder[account];
    }

    function detectTransferRestriction(
        address from,
        address to,
        uint256 value
    ) public view returns (uint8) {
        if (paused()) {
            return TRANSFERS_PAUSED_CODE;
        }
        // Burns (to == 0) skip the sender allowlist so redemption can still
        // destroy live balances after an address is delisted.
        if (from != address(0) && to != address(0) && !_whitelisted[from]) {
            return SENDER_NOT_WHITELISTED_CODE;
        }
        if (to != address(0) && !_whitelisted[to]) {
            return RECEIVER_NOT_WHITELISTED_CODE;
        }
        if (from != address(0) && balanceOf(from) < value) {
            return INSUFFICIENT_BALANCE_CODE;
        }
        return SUCCESS_CODE;
    }

    function messageForTransferRestriction(uint8 restrictionCode) external pure returns (string memory) {
        if (restrictionCode == SUCCESS_CODE) return "SUCCESS";
        if (restrictionCode == SENDER_NOT_WHITELISTED_CODE) return "SENDER_NOT_WHITELISTED";
        if (restrictionCode == RECEIVER_NOT_WHITELISTED_CODE) return "RECEIVER_NOT_WHITELISTED";
        if (restrictionCode == TRANSFERS_PAUSED_CODE) return "TRANSFERS_PAUSED";
        if (restrictionCode == INSUFFICIENT_BALANCE_CODE) return "INSUFFICIENT_BALANCE";
        return "UNKNOWN_RESTRICTION";
    }

    /**
     * @dev Block `transfer`/`transferFrom` to the zero address so holders cannot
     *      self-burn. Authorized burns still go through `_burn` → `_update`.
     */
    function transfer(address to, uint256 value) public override(ERC20, IERC20) returns (bool) {
        if (to == address(0)) {
            revert InvalidAddress(to);
        }
        return super.transfer(to, value);
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override(ERC20, IERC20) returns (bool) {
        if (to == address(0)) {
            revert InvalidAddress(to);
        }
        return super.transferFrom(from, to, value);
    }

    /**
     * @dev OpenZeppelin v5 transfer hook. Enforces pause, allowlist, and
     *      insufficient-balance custom errors, then registers new recipients.
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        uint8 code = detectTransferRestriction(from, to, value);
        if (code != SUCCESS_CODE) {
            emit TransferRestrictionFailure(from, to, value, code);
            if (code == TRANSFERS_PAUSED_CODE) {
                revert TransferPaused();
            }
            if (code == SENDER_NOT_WHITELISTED_CODE) {
                revert SenderNotWhitelisted(from);
            }
            if (code == RECEIVER_NOT_WHITELISTED_CODE) {
                revert ReceiverNotWhitelisted(to);
            }
            revert AmountExceedsBalance(from, value, balanceOf(from));
        }

        super._update(from, to, value);

        if (to != address(0) && !_knownHolder[to]) {
            _knownHolder[to] = true;
            _holders.push(to);
            emit HolderRegistered(to);
            emit HolderAdded(to, _holders.length - 1, _holders.length);
        }
    }
}
