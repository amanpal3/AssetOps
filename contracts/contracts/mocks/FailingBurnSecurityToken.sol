// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SecurityToken} from "../SecurityToken.sol";

/// @dev Test-only mock: fails burnFromHolder after a number of successful burns.
contract FailingBurnSecurityToken is SecurityToken {
    error BurnBoom();

    uint256 public burnsRemaining;

    constructor(address admin, uint256 burnsRemaining_) SecurityToken("Failing DBT", "fDBT", admin) {
        burnsRemaining = burnsRemaining_;
    }

    function burnFromHolder(address account, uint256 amount) public override {
        if (burnsRemaining == 0) {
            revert BurnBoom();
        }
        burnsRemaining -= 1;
        super.burnFromHolder(account, amount);
    }
}
