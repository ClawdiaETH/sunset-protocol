// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISunsetVault {
    function triggerSunset(address token) external;
    function getActualBalance(address token) external view returns (uint256);
    function authorizeSplitter(address splitter) external;
}

interface IFeeSplitter {
    function token() external view returns (address);
}

contract SunsetRegistry is Ownable {
    // ============ Constants ============
    uint256 public constant MIN_COVERAGE_PERIOD = 30 days;
    uint256 public constant INACTIVITY_THRESHOLD = 120 days;
    uint256 public constant MIN_MEANINGFUL_DEPOSIT = 0.001 ether;
    uint256 public constant ANNOUNCEMENT_PERIOD = 48 hours;

    // ============ Enums ============
    enum Tier { Standard, Premium }

    // ============ Structs ============
    struct Project {
        address owner;
        address feeSplitter;
        Tier tier;
        bool active;
        uint256 registeredAt;
        uint256 lastMeaningfulDeposit;
        uint256 totalDeposited;
        uint256 sunsetAnnouncedAt;  // 0 = not announced
        address sunsetAnnouncedBy;
    }

    // ============ State ============
    address public vault;
    address public admin;
    mapping(address => Project) public projects;
    address[] public registeredTokens;

    // ============ Events ============
    event ProjectRegistered(
        address indexed token,
        address indexed owner,
        address feeSplitter,
        Tier tier
    );
    event SunsetAnnounced(
        address indexed token,
        address indexed announcedBy,
        uint256 executableAt,
        string reason
    );
    event SunsetExecuted(
        address indexed token,
        address indexed executedBy
    );
    event SunsetCancelled(
        address indexed token,
        address indexed cancelledBy
    );
    event FeeDeposited(
        address indexed token,
        uint256 amount,
        bool meaningful
    );

    // ============ Errors ============
    error NotRegistered();
    error AlreadyRegistered();
    error NotAuthorized();
    error CoveragePeriodNotMet();
    error StillActive();
    error VaultNotSet();
    error ZeroAddress();
    error SunsetNotAnnounced();
    error AnnouncementPeriodNotMet();
    error SunsetAlreadyAnnounced();

    // ============ Constructor ============
    constructor(address _admin) Ownable(msg.sender) {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    // ============ Admin Functions ============
    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert ZeroAddress();
        vault = _vault;
    }

    function setAdmin(address _admin) external onlyOwner {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    // ============ Registration ============
    function register(
        address token,
        address feeSplitter,
        Tier tier
    ) external {
        if (projects[token].owner != address(0)) revert AlreadyRegistered();
        if (vault == address(0)) revert VaultNotSet();

        require(
            IFeeSplitter(feeSplitter).token() == token,
            "Splitter token mismatch"
        );

        uint256 currentTime = block.timestamp;

        projects[token] = Project({
            owner: msg.sender,
            feeSplitter: feeSplitter,
            tier: tier,
            active: true,
            registeredAt: currentTime,
            lastMeaningfulDeposit: currentTime,
            totalDeposited: 0,
            sunsetAnnouncedAt: 0,
            sunsetAnnouncedBy: address(0)
        });

        registeredTokens.push(token);
        ISunsetVault(vault).authorizeSplitter(feeSplitter);

        emit ProjectRegistered(token, msg.sender, feeSplitter, tier);
    }

    // ============ Fee Tracking ============
    function recordDeposit(address token, uint256 amount) external {
        require(msg.sender == vault, "Only vault");
        
        Project storage project = projects[token];
        if (!project.active) revert NotRegistered();

        project.totalDeposited += amount;

        bool meaningful = amount >= MIN_MEANINGFUL_DEPOSIT;
        if (meaningful) {
            project.lastMeaningfulDeposit = block.timestamp;
        }

        emit FeeDeposited(token, amount, meaningful);
    }

    // ============ Two-Step Sunset ============

    /// @notice Step 1: Announce sunset intention
    /// @dev Starts the 48-hour countdown. No snapshot taken yet.
    function announceSunset(address token) external {
        Project storage project = projects[token];
        if (!project.active) revert NotRegistered();
        if (project.sunsetAnnouncedAt != 0) revert SunsetAlreadyAnnounced();
        
        string memory reason;
        
        if (msg.sender == admin) {
            reason = "admin_emergency";
        } 
        else if (msg.sender == project.owner) {
            if (block.timestamp < project.registeredAt + MIN_COVERAGE_PERIOD) {
                revert CoveragePeriodNotMet();
            }
            reason = "owner_voluntary";
        }
        else {
            if (block.timestamp < project.lastMeaningfulDeposit + INACTIVITY_THRESHOLD) {
                revert StillActive();
            }
            reason = "community_inactivity";
        }
        
        project.sunsetAnnouncedAt = block.timestamp;
        project.sunsetAnnouncedBy = msg.sender;
        
        emit SunsetAnnounced(token, msg.sender, block.timestamp + ANNOUNCEMENT_PERIOD, reason);
    }

    /// @notice Step 2: Execute sunset after announcement period
    /// @dev Anyone can call once period has passed. Snapshot taken here.
    function executeSunset(address token) external {
        Project storage project = projects[token];
        if (!project.active) revert NotRegistered();
        if (project.sunsetAnnouncedAt == 0) revert SunsetNotAnnounced();
        
        uint256 executableAt = project.sunsetAnnouncedAt + ANNOUNCEMENT_PERIOD;
        if (block.timestamp < executableAt) revert AnnouncementPeriodNotMet();
        
        // NOW we trigger and snapshot
        ISunsetVault(vault).triggerSunset(token);
        project.active = false;
        
        emit SunsetExecuted(token, msg.sender);
    }

    /// @notice Cancel announced sunset (owner/admin only, before execution)
    function cancelSunset(address token) external {
        Project storage project = projects[token];
        if (project.sunsetAnnouncedAt == 0) revert SunsetNotAnnounced();
        if (!project.active) revert NotRegistered(); // Already executed
        
        bool isAuthorized = msg.sender == admin || msg.sender == project.owner;
        if (!isAuthorized) revert NotAuthorized();
        
        project.sunsetAnnouncedAt = 0;
        project.sunsetAnnouncedBy = address(0);
        
        emit SunsetCancelled(token, msg.sender);
    }

    // ============ View Functions ============
    
    function getProject(address token) external view returns (
        address owner,
        address feeSplitter,
        Tier tier,
        bool active,
        uint256 registeredAt,
        uint256 lastMeaningfulDeposit,
        uint256 totalDeposited
    ) {
        Project storage p = projects[token];
        return (
            p.owner,
            p.feeSplitter,
            p.tier,
            p.active,
            p.registeredAt,
            p.lastMeaningfulDeposit,
            p.totalDeposited
        );
    }

    function getSunsetStatus(address token) external view returns (
        bool announced,
        uint256 announcedAt,
        address announcedBy,
        uint256 executableAt,
        bool canExecute
    ) {
        Project storage p = projects[token];
        announced = p.sunsetAnnouncedAt != 0;
        announcedAt = p.sunsetAnnouncedAt;
        announcedBy = p.sunsetAnnouncedBy;
        executableAt = announced ? p.sunsetAnnouncedAt + ANNOUNCEMENT_PERIOD : 0;
        canExecute = announced && block.timestamp >= executableAt && p.active;
    }

    function canOwnerTrigger(address token) external view returns (bool, uint256) {
        Project storage p = projects[token];
        if (!p.active) return (false, 0);
        
        uint256 unlockTime = p.registeredAt + MIN_COVERAGE_PERIOD;
        if (block.timestamp >= unlockTime) {
            return (true, 0);
        }
        return (false, unlockTime - block.timestamp);
    }

    function canCommunityTrigger(address token) external view returns (bool, uint256) {
        Project storage p = projects[token];
        if (!p.active) return (false, 0);
        
        uint256 unlockTime = p.lastMeaningfulDeposit + INACTIVITY_THRESHOLD;
        if (block.timestamp >= unlockTime) {
            return (true, 0);
        }
        return (false, unlockTime - block.timestamp);
    }

    function getRegisteredTokens() external view returns (address[] memory) {
        return registeredTokens;
    }

    function getProjectCount() external view returns (uint256) {
        return registeredTokens.length;
    }

    function isRegistered(address token) external view returns (bool) {
        return projects[token].owner != address(0);
    }

    function isActive(address token) external view returns (bool) {
        return projects[token].active;
    }
}
