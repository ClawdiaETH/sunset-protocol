// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SunsetRegistry
 * @notice Registry for token sunset coverage tracking
 * @dev SECURITY RECOMMENDATIONS:
 *      - Deploy with a multi-sig as owner (Gnosis Safe recommended)
 *      - Use 2-of-3 or 3-of-5 threshold for mainnet
 *      - Admin should also be a multi-sig for emergency controls
 *      - Consider using OpenZeppelin Defender for monitoring
 *      - Tier parameter changes are timelocked (24h) to protect users
 */

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
    uint256 public constant TIMELOCK_DELAY = 24 hours;
    
    // Default tier parameters (can be changed via timelock)
    uint256 public minCoveragePeriod = 30 days;
    uint256 public inactivityThreshold = 120 days;
    uint256 public minMeaningfulDeposit = 0.001 ether;
    uint256 public constant ANNOUNCEMENT_PERIOD = 48 hours;

    // ============ Enums ============
    enum Tier { Standard, Premium }
    
    enum ActionType { 
        SET_ADMIN,
        SET_MIN_COVERAGE_PERIOD,
        SET_INACTIVITY_THRESHOLD,
        SET_MIN_MEANINGFUL_DEPOSIT
    }

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

    struct PendingAction {
        ActionType actionType;
        bytes data;
        uint256 scheduledAt;
        bool executed;
        bool cancelled;
    }

    // ============ State ============
    address public vault;
    address public admin;
    bool public paused;
    
    mapping(address => Project) public projects;
    address[] public registeredTokens;
    
    // Timelock state
    uint256 public pendingActionCount;
    mapping(uint256 => PendingAction) public pendingActions;

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
    event Paused(address indexed by, bool isPaused);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event ParameterChanged(string paramName, uint256 oldValue, uint256 newValue);
    
    // Timelock events
    event ActionProposed(uint256 indexed actionId, ActionType actionType, uint256 executeAfter);
    event ActionExecuted(uint256 indexed actionId, ActionType actionType);
    event ActionCancelled(uint256 indexed actionId, ActionType actionType);

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
    error ContractPaused();
    error ActionNotFound();
    error ActionAlreadyExecuted();
    error ActionAlreadyCancelled();
    error TimelockNotExpired();
    error InvalidParameter();

    // ============ Modifiers ============
    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    // ============ Constructor ============
    constructor(address _admin) Ownable(msg.sender) {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

    // ============ Emergency Functions ============
    
    /// @notice Pause or unpause the contract
    /// @dev Only admin or owner can pause. Use for emergencies.
    /// @param _paused True to pause, false to unpause
    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit Paused(msg.sender, _paused);
    }

    // ============ Timelock Functions ============
    
    /// @notice Propose an admin change (24-hour timelock)
    /// @param newAdmin The new admin address
    /// @return actionId The ID of the pending action
    function proposeSetAdmin(address newAdmin) external onlyOwner returns (uint256 actionId) {
        if (newAdmin == address(0)) revert ZeroAddress();
        
        actionId = ++pendingActionCount;
        pendingActions[actionId] = PendingAction({
            actionType: ActionType.SET_ADMIN,
            data: abi.encode(newAdmin),
            scheduledAt: block.timestamp,
            executed: false,
            cancelled: false
        });
        
        emit ActionProposed(actionId, ActionType.SET_ADMIN, block.timestamp + TIMELOCK_DELAY);
    }

    /// @notice Propose a tier parameter change (24-hour timelock)
    /// @param actionType The parameter to change
    /// @param newValue The new value
    /// @return actionId The ID of the pending action
    function proposeParameterChange(ActionType actionType, uint256 newValue) external onlyOwner returns (uint256 actionId) {
        if (actionType == ActionType.SET_ADMIN) revert InvalidParameter(); // Use proposeSetAdmin
        if (newValue == 0) revert InvalidParameter();
        
        actionId = ++pendingActionCount;
        pendingActions[actionId] = PendingAction({
            actionType: actionType,
            data: abi.encode(newValue),
            scheduledAt: block.timestamp,
            executed: false,
            cancelled: false
        });
        
        emit ActionProposed(actionId, actionType, block.timestamp + TIMELOCK_DELAY);
    }

    /// @notice Execute a pending action after timelock expires
    /// @param actionId The ID of the action to execute
    function executeAction(uint256 actionId) external onlyOwner {
        PendingAction storage action = pendingActions[actionId];
        
        if (action.scheduledAt == 0) revert ActionNotFound();
        if (action.executed) revert ActionAlreadyExecuted();
        if (action.cancelled) revert ActionAlreadyCancelled();
        if (block.timestamp < action.scheduledAt + TIMELOCK_DELAY) revert TimelockNotExpired();
        
        action.executed = true;
        
        if (action.actionType == ActionType.SET_ADMIN) {
            address newAdmin = abi.decode(action.data, (address));
            address oldAdmin = admin;
            admin = newAdmin;
            emit AdminChanged(oldAdmin, newAdmin);
        } else if (action.actionType == ActionType.SET_MIN_COVERAGE_PERIOD) {
            uint256 newValue = abi.decode(action.data, (uint256));
            uint256 oldValue = minCoveragePeriod;
            minCoveragePeriod = newValue;
            emit ParameterChanged("minCoveragePeriod", oldValue, newValue);
        } else if (action.actionType == ActionType.SET_INACTIVITY_THRESHOLD) {
            uint256 newValue = abi.decode(action.data, (uint256));
            uint256 oldValue = inactivityThreshold;
            inactivityThreshold = newValue;
            emit ParameterChanged("inactivityThreshold", oldValue, newValue);
        } else if (action.actionType == ActionType.SET_MIN_MEANINGFUL_DEPOSIT) {
            uint256 newValue = abi.decode(action.data, (uint256));
            uint256 oldValue = minMeaningfulDeposit;
            minMeaningfulDeposit = newValue;
            emit ParameterChanged("minMeaningfulDeposit", oldValue, newValue);
        }
        
        emit ActionExecuted(actionId, action.actionType);
    }

    /// @notice Cancel a pending action
    /// @param actionId The ID of the action to cancel
    function cancelAction(uint256 actionId) external onlyOwner {
        PendingAction storage action = pendingActions[actionId];
        
        if (action.scheduledAt == 0) revert ActionNotFound();
        if (action.executed) revert ActionAlreadyExecuted();
        if (action.cancelled) revert ActionAlreadyCancelled();
        
        action.cancelled = true;
        
        emit ActionCancelled(actionId, action.actionType);
    }

    /// @notice Get pending action details
    function getPendingAction(uint256 actionId) external view returns (
        ActionType actionType,
        bytes memory data,
        uint256 scheduledAt,
        uint256 executeAfter,
        bool canExecute,
        bool executed,
        bool cancelled
    ) {
        PendingAction storage action = pendingActions[actionId];
        return (
            action.actionType,
            action.data,
            action.scheduledAt,
            action.scheduledAt + TIMELOCK_DELAY,
            block.timestamp >= action.scheduledAt + TIMELOCK_DELAY && !action.executed && !action.cancelled,
            action.executed,
            action.cancelled
        );
    }

    // ============ Admin Functions ============
    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert ZeroAddress();
        vault = _vault;
    }

    // ============ Registration ============
    function register(
        address token,
        address feeSplitter,
        Tier tier
    ) external whenNotPaused {
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

        bool meaningful = amount >= minMeaningfulDeposit;
        if (meaningful) {
            project.lastMeaningfulDeposit = block.timestamp;
        }

        emit FeeDeposited(token, amount, meaningful);
    }

    // ============ Two-Step Sunset ============

    /// @notice Step 1: Announce sunset intention
    /// @dev Starts the 48-hour countdown. No snapshot taken yet.
    function announceSunset(address token) external whenNotPaused {
        Project storage project = projects[token];
        if (!project.active) revert NotRegistered();
        if (project.sunsetAnnouncedAt != 0) revert SunsetAlreadyAnnounced();
        
        string memory reason;
        
        if (msg.sender == admin) {
            reason = "admin_emergency";
        } 
        else if (msg.sender == project.owner) {
            if (block.timestamp < project.registeredAt + minCoveragePeriod) {
                revert CoveragePeriodNotMet();
            }
            reason = "owner_voluntary";
        }
        else {
            if (block.timestamp < project.lastMeaningfulDeposit + inactivityThreshold) {
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
    function executeSunset(address token) external whenNotPaused {
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
        
        uint256 unlockTime = p.registeredAt + minCoveragePeriod;
        if (block.timestamp >= unlockTime) {
            return (true, 0);
        }
        return (false, unlockTime - block.timestamp);
    }

    function canCommunityTrigger(address token) external view returns (bool, uint256) {
        Project storage p = projects[token];
        if (!p.active) return (false, 0);
        
        uint256 unlockTime = p.lastMeaningfulDeposit + inactivityThreshold;
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
    
    /// @notice Get current tier parameters
    function getTierParameters() external view returns (
        uint256 _minCoveragePeriod,
        uint256 _inactivityThreshold,
        uint256 _minMeaningfulDeposit,
        uint256 _announcementPeriod
    ) {
        return (
            minCoveragePeriod,
            inactivityThreshold,
            minMeaningfulDeposit,
            ANNOUNCEMENT_PERIOD
        );
    }
}
