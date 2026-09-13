// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPaymentCurrency is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}
