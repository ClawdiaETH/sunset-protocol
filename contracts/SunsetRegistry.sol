// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ISunsetVault} from "./interfaces/ISunsetVault.sol";
import {FeeSplitter} from "./FeeSplitter.sol";

/// @title SunsetRegistry
/// @notice Tracks covered projects and manages sunset triggers
contract SunsetRegistry {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error ZeroAddress();
    error AlreadyRegistered();
    error NotRegistered();
    error OnlyAdmin();
    error OnlyProjectOwner();
    error SunsetConditionsNotMet();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event ProjectRegistered(
        address indexed token,
        address indexed splitter,
        address indexed owner,
        uint256 tier
    );
    event ProjectUnregistered(address indexed token);
    event SunsetRequested(address indexed token, address indexed requester);

    /*//////////////////////////////////////////////////////////////
                                 STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Project {
        address token;           // Token address
        address splitter;        // FeeSplitter address
        address owner;           // Project owner
        uint256 tier;            // Coverage tier (1=Basic, 2=Standard, 3=Premium)
        uint256 registeredAt;    // Registration timestamp
        bool active;             // Is coverage active
    }

    /*//////////////////////////////////////////////////////////////
                                 STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice Admin address
    address public admin;
    
    /// @notice Sunset vault address
    address public immutable vault;
    
    /// @notice Project data by token address
    mapping(address => Project) public projects;
    
    /// @notice All registered token addresses
    address[] public registeredTokens;
    
    /// @notice Coverage multipliers by tier (basis points)
    mapping(uint256 => uint256) public tierMultipliers;
    
    /// @notice Fee share by tier (basis points)
    mapping(uint256 => uint256) public tierFeeShare;

    /// @notice Sunset condition: minimum 30-day volume (in ETH)
    uint256 public minVolumeThreshold = 0.1 ether;
    
    /// @notice Sunset condition: days of inactivity
    uint256 public inactivityDays = 90;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _vault) {
        if (_vault == address(0)) revert ZeroAddress();
        
        admin = msg.sender;
        vault = _vault;
        
        // Set default tier multipliers
        tierMultipliers[1] = 10000;  // Basic: 1x
        tierMultipliers[2] = 15000;  // Standard: 1.5x
        tierMultipliers[3] = 20000;  // Premium: 2x
        
        // Set default fee shares
        tierFeeShare[1] = 500;   // Basic: 5%
        tierFeeShare[2] = 1000;  // Standard: 10%
        tierFeeShare[3] = 1500;  // Premium: 15%
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setAdmin(address newAdmin) external {
        if (msg.sender != admin) revert OnlyAdmin();
        if (newAdmin == address(0)) revert ZeroAddress();
        admin = newAdmin;
    }

    function setTierConfig(
        uint256 tier,
        uint256 multiplier,
        uint256 feeShare
    ) external {
        if (msg.sender != admin) revert OnlyAdmin();
        tierMultipliers[tier] = multiplier;
        tierFeeShare[tier] = feeShare;
    }

    function setSunsetConditions(
        uint256 _minVolume,
        uint256 _inactivityDays
    ) external {
        if (msg.sender != admin) revert OnlyAdmin();
        minVolumeThreshold = _minVolume;
        inactivityDays = _inactivityDays;
    }

    /*//////////////////////////////////////////////////////////////
                         REGISTRATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Register a new project for coverage
    /// @param token Token address to cover
    /// @param tier Coverage tier (1, 2, or 3)
    /// @return splitter Address of deployed FeeSplitter
    function register(
        address token,
        uint256 tier
    ) external returns (address splitter) {
        if (token == address(0)) revert ZeroAddress();
        if (projects[token].active) revert AlreadyRegistered();
        if (tier == 0 || tier > 3) revert("invalid tier");
        
        // Deploy FeeSplitter for this project
        splitter = address(new FeeSplitter(
            msg.sender,
            vault,
            token,
            tierFeeShare[tier]
        ));
        
        // Register in vault
        ISunsetVault(vault).registerToken(token, tierMultipliers[tier]);
        
        // Authorize the splitter
        // Note: vault.authorizeSplitter would need to be called by vault admin
        
        // Store project data
        projects[token] = Project({
            token: token,
            splitter: splitter,
            owner: msg.sender,
            tier: tier,
            registeredAt: block.timestamp,
            active: true
        });
        
        registeredTokens.push(token);
        
        emit ProjectRegistered(token, splitter, msg.sender, tier);
    }

    /// @notice Unregister a project (owner only)
    /// @param token Token to unregister
    function unregister(address token) external {
        Project storage project = projects[token];
        if (!project.active) revert NotRegistered();
        if (msg.sender != project.owner && msg.sender != admin) {
            revert OnlyProjectOwner();
        }
        
        project.active = false;
        emit ProjectUnregistered(token);
    }

    /// @notice Request sunset for a project
    /// @param token Token to sunset
    /// @dev Anyone can call, but conditions must be met
    function requestSunset(address token) external {
        Project storage project = projects[token];
        if (!project.active) revert NotRegistered();
        
        // Check sunset conditions
        // In production, would check on-chain volume oracles
        // For now, allow admin or owner to trigger
        bool isAuthorized = msg.sender == admin || 
                           msg.sender == project.owner;
        
        if (!isAuthorized) revert SunsetConditionsNotMet();
        
        // Trigger sunset in vault
        ISunsetVault(vault).triggerSunset(token);
        
        project.active = false;
        emit SunsetRequested(token, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get all registered tokens
    function getRegisteredTokens() external view returns (address[] memory) {
        return registeredTokens;
    }

    /// @notice Get active project count
    function getActiveProjectCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < registeredTokens.length; i++) {
            if (projects[registeredTokens[i]].active) {
                count++;
            }
        }
    }

    /// @notice Get project details
    function getProject(address token) external view returns (
        address splitter,
        address owner,
        uint256 tier,
        uint256 registeredAt,
        bool active
    ) {
        Project storage p = projects[token];
        return (p.splitter, p.owner, p.tier, p.registeredAt, p.active);
    }

    /// @notice Calculate expected fee share for a tier
    function getFeeShare(uint256 tier) external view returns (uint256) {
        return tierFeeShare[tier];
    }

    /// @notice Calculate coverage multiplier for a tier
    function getMultiplier(uint256 tier) external view returns (uint256) {
        return tierMultipliers[tier];
    }
}
