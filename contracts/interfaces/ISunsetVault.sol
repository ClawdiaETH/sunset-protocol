// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISunsetVault {
    function deposit(address token) external payable;
    function depositWETH(address token, uint256 amount) external;
    function triggerSunset(address token) external;
    function claim(address token) external;
    function authorizeSplitter(address splitter) external;
    
    function getClaimableAmount(address token, address holder) external view returns (uint256);
    
    function getCoverage(address token) external view returns (
        uint256 depositedAmount,
        uint256 actualBalance,
        uint256 snapshotSupply,
        uint256 snapshotBlock,
        bool triggered
    );
    
    function getActualBalance(address token) external view returns (uint256);
    function getTotalCoverage() external view returns (uint256);
}
