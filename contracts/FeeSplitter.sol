// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ISunsetVault} from "./interfaces/ISunsetVault.sol";

/// @title FeeSplitter
/// @notice Splits incoming fees between project and Sunset Protocol
/// @dev Set this contract as your Clanker reward recipient
contract FeeSplitter {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error ZeroAddress();
    error InvalidBps();
    error OnlyOwner();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event FeesClaimed(
        address indexed token,
        uint256 projectAmount,
        uint256 sunsetAmount
    );
    event SunsetBpsUpdated(uint256 oldBps, uint256 newBps);
    event OwnerUpdated(address indexed oldOwner, address indexed newOwner);

    /*//////////////////////////////////////////////////////////////
                                 STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice Project wallet that receives majority of fees
    address public owner;
    
    /// @notice Sunset vault that receives coverage fees
    address public immutable sunsetVault;
    
    /// @notice Token address this splitter is for (for registry tracking)
    address public immutable token;
    
    /// @notice Basis points sent to Sunset (1000 = 10%)
    uint256 public sunsetBps;
    
    /// @notice Maximum basis points (100%)
    uint256 public constant MAX_BPS = 10000;
    
    /// @notice Maximum sunset fee (25%)
    uint256 public constant MAX_SUNSET_BPS = 2500;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _owner Project wallet to receive fees
    /// @param _sunsetVault Sunset Protocol vault address
    /// @param _token Token address this splitter covers
    /// @param _sunsetBps Basis points for Sunset (e.g., 1000 = 10%)
    constructor(
        address _owner,
        address _sunsetVault,
        address _token,
        uint256 _sunsetBps
    ) {
        if (_owner == address(0) || _sunsetVault == address(0) || _token == address(0)) {
            revert ZeroAddress();
        }
        if (_sunsetBps > MAX_SUNSET_BPS) revert InvalidBps();
        
        owner = _owner;
        sunsetVault = _sunsetVault;
        token = _token;
        sunsetBps = _sunsetBps;
    }

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Claim and split fees for a given token
    /// @param feeToken The token to claim (usually WETH or the fee token)
    /// @dev Can be called by anyone — fees go to correct recipients
    function claimAndSplit(address feeToken) external {
        uint256 balance = IERC20(feeToken).balanceOf(address(this));
        if (balance == 0) return;
        
        uint256 sunsetAmount = (balance * sunsetBps) / MAX_BPS;
        uint256 projectAmount = balance - sunsetAmount;
        
        // Transfer to sunset vault (records deposit for this token)
        if (sunsetAmount > 0) {
            bool success = IERC20(feeToken).transfer(sunsetVault, sunsetAmount);
            if (!success) revert TransferFailed();
            
            // Notify vault of deposit for coverage tracking
            ISunsetVault(sunsetVault).recordDeposit(token, feeToken, sunsetAmount);
        }
        
        // Transfer remainder to project
        if (projectAmount > 0) {
            bool success = IERC20(feeToken).transfer(owner, projectAmount);
            if (!success) revert TransferFailed();
        }
        
        emit FeesClaimed(feeToken, projectAmount, sunsetAmount);
    }

    /// @notice Claim and split ETH fees
    /// @dev For pools that pay in native ETH
    function claimAndSplitETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) return;
        
        uint256 sunsetAmount = (balance * sunsetBps) / MAX_BPS;
        uint256 projectAmount = balance - sunsetAmount;
        
        // Transfer to sunset vault
        if (sunsetAmount > 0) {
            (bool success,) = sunsetVault.call{value: sunsetAmount}("");
            if (!success) revert TransferFailed();
            
            ISunsetVault(sunsetVault).recordDeposit(token, address(0), sunsetAmount);
        }
        
        // Transfer remainder to project
        if (projectAmount > 0) {
            (bool success,) = owner.call{value: projectAmount}("");
            if (!success) revert TransferFailed();
        }
        
        emit FeesClaimed(address(0), projectAmount, sunsetAmount);
    }

    /*//////////////////////////////////////////////////////////////
                           OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Update the sunset fee percentage
    /// @param newBps New basis points for sunset fee
    function setSunsetBps(uint256 newBps) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newBps > MAX_SUNSET_BPS) revert InvalidBps();
        
        emit SunsetBpsUpdated(sunsetBps, newBps);
        sunsetBps = newBps;
    }

    /// @notice Transfer ownership to new address
    /// @param newOwner New project owner
    function setOwner(address newOwner) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newOwner == address(0)) revert ZeroAddress();
        
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }

    /*//////////////////////////////////////////////////////////////
                              RECEIVE
    //////////////////////////////////////////////////////////////*/

    receive() external payable {}
}
