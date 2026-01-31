// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

/// @title SunsetVault
/// @notice Holds accumulated fees and handles claims when projects sunset
contract SunsetVault {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error ZeroAddress();
    error NotRegistered();
    error NotSunset();
    error AlreadySunset();
    error AlreadyClaimed();
    error OnlyRegistry();
    error OnlyFeeSplitter();
    error InsufficientBalance();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event DepositRecorded(
        address indexed token,
        address indexed feeToken,
        uint256 amount,
        uint256 totalCoverage
    );
    event SunsetTriggered(address indexed token, uint256 totalCoverage);
    event Claimed(
        address indexed token,
        address indexed holder,
        uint256 amount
    );

    /*//////////////////////////////////////////////////////////////
                                 STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct TokenCoverage {
        uint256 totalDeposited;      // Total fees deposited (in ETH value)
        uint256 coverageMultiplier;  // Basis points (10000 = 1x, 15000 = 1.5x)
        bool isSunset;               // Whether sunset has been triggered
        uint256 sunsetTimestamp;     // When sunset was triggered
        uint256 snapshotSupply;      // Token supply at sunset (for pro-rata)
        mapping(address => bool) claimed; // Track who has claimed
    }

    /*//////////////////////////////////////////////////////////////
                                 STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice Registry contract address
    address public registry;
    
    /// @notice Admin address
    address public admin;
    
    /// @notice Coverage data per token
    mapping(address => TokenCoverage) public coverage;
    
    /// @notice Authorized fee splitters
    mapping(address => bool) public authorizedSplitters;
    
    /// @notice ETH balance per covered token
    mapping(address => uint256) public ethBalances;
    
    /// @notice WETH address on Base
    address public constant WETH = 0x4200000000000000000000000000000000000006;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _admin) {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setRegistry(address _registry) external {
        require(msg.sender == admin, "only admin");
        registry = _registry;
    }

    function authorizeSplitter(address splitter, bool authorized) external {
        require(msg.sender == admin || msg.sender == registry, "unauthorized");
        authorizedSplitters[splitter] = authorized;
    }

    function registerToken(address token, uint256 multiplier) external {
        require(msg.sender == admin || msg.sender == registry, "unauthorized");
        coverage[token].coverageMultiplier = multiplier;
    }

    /*//////////////////////////////////////////////////////////////
                            CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Record a fee deposit from a FeeSplitter
    /// @param token The covered token this deposit is for
    /// @param feeToken The token deposited (address(0) for ETH)
    /// @param amount Amount deposited
    function recordDeposit(
        address token,
        address feeToken,
        uint256 amount
    ) external {
        if (!authorizedSplitters[msg.sender]) revert OnlyFeeSplitter();
        if (coverage[token].isSunset) revert AlreadySunset();
        
        // For simplicity, track all deposits as ETH-equivalent
        // In production, would use oracle for conversion
        coverage[token].totalDeposited += amount;
        
        if (feeToken == address(0) || feeToken == WETH) {
            ethBalances[token] += amount;
        }
        
        emit DepositRecorded(
            token,
            feeToken,
            amount,
            coverage[token].totalDeposited
        );
    }

    /// @notice Trigger sunset for a token
    /// @param token The token to sunset
    /// @dev Can be called by registry based on sunset conditions
    function triggerSunset(address token) external {
        require(msg.sender == admin || msg.sender == registry, "unauthorized");
        if (coverage[token].isSunset) revert AlreadySunset();
        
        TokenCoverage storage cov = coverage[token];
        cov.isSunset = true;
        cov.sunsetTimestamp = block.timestamp;
        cov.snapshotSupply = IERC20(token).totalSupply();
        
        emit SunsetTriggered(token, cov.totalDeposited);
    }

    /// @notice Claim coverage payout for a sunset token
    /// @param token The sunset token
    /// @return amount The ETH amount claimed
    function claim(address token) external returns (uint256 amount) {
        TokenCoverage storage cov = coverage[token];
        
        if (!cov.isSunset) revert NotSunset();
        if (cov.claimed[msg.sender]) revert AlreadyClaimed();
        
        uint256 holderBalance = IERC20(token).balanceOf(msg.sender);
        if (holderBalance == 0) revert InsufficientBalance();
        
        // Calculate pro-rata share
        // coverage = (holderBalance / snapshotSupply) * totalDeposited * multiplier
        uint256 effectiveCoverage = (cov.totalDeposited * cov.coverageMultiplier) / 10000;
        amount = (holderBalance * effectiveCoverage) / cov.snapshotSupply;
        
        // Cap at available balance
        if (amount > ethBalances[token]) {
            amount = ethBalances[token];
        }
        
        cov.claimed[msg.sender] = true;
        ethBalances[token] -= amount;
        
        // Transfer ETH to holder
        (bool success,) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Claimed(token, msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get total coverage for a token
    function getCoverage(address token) external view returns (uint256) {
        TokenCoverage storage cov = coverage[token];
        return (cov.totalDeposited * cov.coverageMultiplier) / 10000;
    }

    /// @notice Check if token is sunset
    function isSunset(address token) external view returns (bool) {
        return coverage[token].isSunset;
    }

    /// @notice Check if holder has claimed
    function hasClaimed(address token, address holder) external view returns (bool) {
        return coverage[token].claimed[holder];
    }

    /// @notice Get claimable amount for a holder
    function getClaimable(address token, address holder) external view returns (uint256) {
        TokenCoverage storage cov = coverage[token];
        
        if (!cov.isSunset || cov.claimed[holder]) return 0;
        
        uint256 holderBalance = IERC20(token).balanceOf(holder);
        if (holderBalance == 0 || cov.snapshotSupply == 0) return 0;
        
        uint256 effectiveCoverage = (cov.totalDeposited * cov.coverageMultiplier) / 10000;
        uint256 amount = (holderBalance * effectiveCoverage) / cov.snapshotSupply;
        
        if (amount > ethBalances[token]) {
            amount = ethBalances[token];
        }
        
        return amount;
    }

    /*//////////////////////////////////////////////////////////////
                              RECEIVE
    //////////////////////////////////////////////////////////////*/

    receive() external payable {}
}
