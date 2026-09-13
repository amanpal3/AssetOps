// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISecurityToken is IERC20 {
    function isWhitelisted(address account) external view returns (bool);
    function setWhitelisted(address account, bool status) external;
    function getHolders() external view returns (address[] memory);
    function getHolderCount() external view returns (uint256);
    function isHolder(address account) external view returns (bool);
    function burnFromHolder(address account, uint256 amount) external;
    function detectTransferRestriction(address from, address to, uint256 value) external view returns (uint8);
    function messageForTransferRestriction(uint8 restrictionCode) external pure returns (string memory);
}
