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
    uint256 public constant MIN_MEANINGFUL_DEPOSIT = 0.001 ether; // ~$3 at current prices

    // ============ Enums ============
    enum Tier { Standard, Premium }

    // ============ Structs ============
    struct Project {
        address owner;
        address feeSplitter;
        Tier tier;
        bool active;
        uint256 registeredAt;           // When project was registered
        uint256 lastMeaningfulDeposit;  // Last deposit above threshold
        uint256 totalDeposited;         // Track total deposits
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
    event SunsetRequested(
        address indexed token,
        address indexed triggeredBy,
        string reason
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

        // Verify feeSplitter is for this token
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
            lastMeaningfulDeposit: currentTime, // Start the clock
            totalDeposited: 0
        });

        registeredTokens.push(token);

        // Authorize the splitter to deposit to vault
        ISunsetVault(vault).authorizeSplitter(feeSplitter);

        emit ProjectRegistered(token, msg.sender, feeSplitter, tier);
    }

    // ============ Fee Tracking ============
    /// @notice Called by vault when fees are deposited
    /// @dev Only vault can call this
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

    // ============ Sunset Triggers ============
    /// @notice Request sunset for a token
    /// @dev Multiple trigger conditions supported
    function requestSunset(address token) external {
        Project storage project = projects[token];
        if (!project.active) revert NotRegistered();

        string memory reason;

        // Check authorization
        if (msg.sender == admin) {
            // Admin can always trigger (emergency)
            reason = "admin_emergency";
        } else if (msg.sender == project.owner) {
            // Owner can trigger after minimum coverage period
            if (block.timestamp < project.registeredAt + MIN_COVERAGE_PERIOD) {
                revert CoveragePeriodNotMet();
            }
            reason = "owner_voluntary";
        } else {
            // Anyone can trigger if inactive for 120+ days
            if (block.timestamp < project.lastMeaningfulDeposit + INACTIVITY_THRESHOLD) {
                revert StillActive();
            }
            reason = "community_inactivity";
        }

        // Trigger the sunset
        ISunsetVault(vault).triggerSunset(token);
        project.active = false;

        emit SunsetRequested(token, msg.sender, reason);
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
