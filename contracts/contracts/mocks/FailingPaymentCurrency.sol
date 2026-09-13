// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Test-only mock: reverts after a configured number of successful transferFrom calls.
contract FailingPaymentCurrency is ERC20 {
    error TransferFromFailed();

    uint256 public successesRemaining;

    constructor(uint256 successesRemaining_) ERC20("Failing Mock USDC", "fUSDC") {
        successesRemaining = successesRemaining_;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        if (successesRemaining == 0) {
            revert TransferFromFailed();
        }
        successesRemaining -= 1;
        return super.transferFrom(from, to, value);
    }
}
