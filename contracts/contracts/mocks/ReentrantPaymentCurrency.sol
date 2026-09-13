// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IReentrantTarget {
    function executeAction(bytes32 actionId) external;
}

/// @dev Test-only mock: reenters PaymentExecutor during transferFrom.
contract ReentrantPaymentCurrency is ERC20 {
    IReentrantTarget public target;
    bytes32 public actionId;
    bool public attacking;

    constructor() ERC20("Reentrant Mock USDC", "rUSDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setAttack(address target_, bytes32 actionId_) external {
        target = IReentrantTarget(target_);
        actionId = actionId_;
        attacking = true;
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        bool ok = super.transferFrom(from, to, value);
        if (attacking && address(target) != address(0)) {
            attacking = false;
            target.executeAction(actionId);
        }
        return ok;
    }
}
