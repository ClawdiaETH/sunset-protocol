// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISunsetVault {
    function recordDeposit(address token, address feeToken, uint256 amount) external;
    function triggerSunset(address token) external;
    function claim(address token, address holder) external returns (uint256);
    function getCoverage(address token) external view returns (uint256);
    function isSunset(address token) external view returns (bool);
}
