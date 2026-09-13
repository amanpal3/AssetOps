// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IPaymentCurrency} from "./interfaces/IPaymentCurrency.sol";

/**
 * @title PaymentCurrency
 * @notice Mock USDC-style ERC-20 used only for local Hardhat and Sepolia demos.
 * @dev NOT production money. It is not USD, not Circle USDC, and must never hold
 *      real customer funds. 18 decimals are used so coupon math
 *      `balance * rateBps / 10_000` matches DBT units in the hackathon scenario.
 *
 * Treasury funding: a MINTER_ROLE account mints to the treasury, then the
 * treasury ERC-20-approves PaymentExecutor. Allowance and balance checks are
 * enforced on-chain by PaymentExecutor before any payout.
 */
contract PaymentCurrency is ERC20, AccessControl, IPaymentCurrency {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    error InvalidAddress(address account);

    constructor(string memory name_, string memory symbol_, address admin) ERC20(name_, symbol_) {
        if (admin == address(0)) {
            revert InvalidAddress(admin);
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /// @notice Mint demo currency to the treasury or another test account.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) {
            revert InvalidAddress(to);
        }
        _mint(to, amount);
    }

    /// @notice Burn the caller's demo currency. Does not affect SecurityToken supply.
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
