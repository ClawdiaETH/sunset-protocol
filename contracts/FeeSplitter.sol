// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "./interfaces/IERC20.sol";

interface ISunsetVault {
    function deposit(address token) external payable;
    function depositWETH(address token, uint256 amount) external;
}

interface IWETH {
    function withdraw(uint256) external;
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
}

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
        address indexed feeToken,
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
    
    /// @notice WETH address for unwrapping
    address public immutable weth;
    
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
    /// @param _weth WETH contract address
    /// @param _sunsetBps Basis points for Sunset (e.g., 1000 = 10%)
    constructor(
        address _owner,
        address _sunsetVault,
        address _token,
        address _weth,
        uint256 _sunsetBps
    ) {
        if (_owner == address(0) || _sunsetVault == address(0) || _token == address(0) || _weth == address(0)) {
            revert ZeroAddress();
        }
        if (_sunsetBps > MAX_SUNSET_BPS) revert InvalidBps();
        
        owner = _owner;
        sunsetVault = _sunsetVault;
        token = _token;
        weth = _weth;
        sunsetBps = _sunsetBps;
        
        // Approve vault to spend WETH
        IERC20(_weth).approve(_sunsetVault, type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Claim and split WETH fees (most common for Clanker)
    /// @dev Unwraps WETH to ETH before splitting
    function claimAndSplitWETH() external {
        uint256 balance = IERC20(weth).balanceOf(address(this));
        if (balance == 0) return;
        
        uint256 sunsetAmount = (balance * sunsetBps) / MAX_BPS;
        uint256 projectAmount = balance - sunsetAmount;
        
        // Deposit WETH to vault (vault will unwrap)
        if (sunsetAmount > 0) {
            ISunsetVault(sunsetVault).depositWETH(token, sunsetAmount);
        }
        
        // Transfer remainder to project
        if (projectAmount > 0) {
            bool success = IERC20(weth).transfer(owner, projectAmount);
            if (!success) revert TransferFailed();
        }
        
        emit FeesClaimed(weth, projectAmount, sunsetAmount);
    }

    /// @notice Claim and split ETH fees
    /// @dev For pools that pay in native ETH
    function claimAndSplitETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) return;
        
        uint256 sunsetAmount = (balance * sunsetBps) / MAX_BPS;
        uint256 projectAmount = balance - sunsetAmount;
        
        // Deposit ETH to vault
        if (sunsetAmount > 0) {
            ISunsetVault(sunsetVault).deposit{value: sunsetAmount}(token);
        }
        
        // Transfer remainder to project
        if (projectAmount > 0) {
            (bool success,) = owner.call{value: projectAmount}("");
            if (!success) revert TransferFailed();
        }
        
        emit FeesClaimed(address(0), projectAmount, sunsetAmount);
    }

    /// @notice Claim and split any ERC20 token
    /// @param feeToken The token to split
    /// @dev For non-WETH tokens, just splits without vault deposit
    function claimAndSplitToken(address feeToken) external {
        uint256 balance = IERC20(feeToken).balanceOf(address(this));
        if (balance == 0) return;
        
        // If it's WETH, use the WETH flow
        if (feeToken == weth) {
            this.claimAndSplitWETH();
            return;
        }
        
        // For other tokens, split but sunset share stays here
        // (Project can manually handle or we add swap functionality later)
        uint256 sunsetAmount = (balance * sunsetBps) / MAX_BPS;
        uint256 projectAmount = balance - sunsetAmount;
        
        // Transfer project share
        if (projectAmount > 0) {
            bool success = IERC20(feeToken).transfer(owner, projectAmount);
            if (!success) revert TransferFailed();
        }
        
        // Sunset share stays in contract for manual handling
        // In V2, we could add swap functionality here
        
        emit FeesClaimed(feeToken, projectAmount, sunsetAmount);
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

    /// @notice Rescue stuck tokens (in case of non-WETH fees)
    /// @param _token Token to rescue
    /// @param to Recipient
    function rescueTokens(address _token, address to) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (to == address(0)) revert ZeroAddress();
        
        uint256 balance = IERC20(_token).balanceOf(address(this));
        if (balance > 0) {
            bool success = IERC20(_token).transfer(to, balance);
            if (!success) revert TransferFailed();
        }
    }

    /*//////////////////////////////////////////////////////////////
                              RECEIVE
    //////////////////////////////////////////////////////////////*/

    receive() external payable {}
}
