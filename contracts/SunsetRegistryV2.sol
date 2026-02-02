// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SunsetRegistryV2
 * @notice Registry for token sunset coverage tracking with $CLAWDIA tokenomics
 * @dev V2 adds:
 *      - 25M $CLAWDIA burn requirement on registration (0.025% of 100B supply)
 *      - Auto-purchase via DEX (user pays ETH, contract buys and burns CLAWDIA)
 *      - Fee buyback and burn mechanism
 * 
 * TOKENOMICS INTEGRATION:
 * - Total Supply: 100B $CLAWDIA
 * - Registration: User pays ETH → Contract buys 25M $CLAWDIA → Burns it
 * - Fee Buyback: Admin fees accumulated → Periodically buy $CLAWDIA → Burn
 * - Scale: 1,000 registrations = 25B burned (25% of supply)
 * 
 * SECURITY RECOMMENDATIONS:
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

interface ICLAWDIABurner {
    function burnForRegistration(address token, address payer) external payable returns (uint256 ethSpent, uint256 clawdiaBurned);
    function buybackAndBurn() external payable;
    function estimateRegistrationCost() external view returns (uint256);
    function getTotalBurned() external view returns (uint256);
    function getBurnStats() external view returns (uint256, uint256, uint256, uint256);
    function REGISTRATION_BURN_AMOUNT() external view returns (uint256);
}

contract SunsetRegistryV2 is Ownable {
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
        SET_MIN_MEANINGFUL_DEPOSIT,
        SET_BURNER
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
        uint256 sunsetAnnouncedAt;
        address sunsetAnnouncedBy;
        uint256 clawdiaBurned; // V2: Track CLAWDIA burned on registration
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
    address public clawdiaBurner; // V2: CLAWDIA burner contract
    bool public paused;
    
    // V2: Accumulated admin fees for buyback
    uint256 public accumulatedAdminFees;
    uint256 public buybackThreshold = 0.5 ether;
    
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
        Tier tier,
        uint256 clawdiaBurned,  // V2: Include burn amount
        uint256 ethSpent        // V2: Include ETH spent
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
    
    // V2: Burn events
    event BurnerUpdated(address indexed oldBurner, address indexed newBurner);
    event AdminFeesAccumulated(uint256 amount, uint256 total);
    event BuybackExecuted(uint256 ethSpent, uint256 clawdiaBurned);
    
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
    error BurnerNotSet();
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
    error InsufficientETH();

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
    constructor(address _admin, address _clawdiaBurner) Ownable(msg.sender) {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
        clawdiaBurner = _clawdiaBurner;
    }

    // ============ Emergency Functions ============
    
    /// @notice Pause or unpause the contract
    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit Paused(msg.sender, _paused);
    }

    // ============ Timelock Functions ============
    
    /// @notice Propose an admin change (24-hour timelock)
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
    function proposeParameterChange(ActionType actionType, uint256 newValue) external onlyOwner returns (uint256 actionId) {
        if (actionType == ActionType.SET_ADMIN) revert InvalidParameter();
        if (actionType == ActionType.SET_BURNER) revert InvalidParameter();
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

    /// @notice Propose burner update (24-hour timelock)
    function proposeSetBurner(address newBurner) external onlyOwner returns (uint256 actionId) {
        if (newBurner == address(0)) revert ZeroAddress();
        
        actionId = ++pendingActionCount;
        pendingActions[actionId] = PendingAction({
            actionType: ActionType.SET_BURNER,
            data: abi.encode(newBurner),
            scheduledAt: block.timestamp,
            executed: false,
            cancelled: false
        });
        
        emit ActionProposed(actionId, ActionType.SET_BURNER, block.timestamp + TIMELOCK_DELAY);
    }

    /// @notice Execute a pending action after timelock expires
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
        } else if (action.actionType == ActionType.SET_BURNER) {
            address newBurner = abi.decode(action.data, (address));
            address oldBurner = clawdiaBurner;
            clawdiaBurner = newBurner;
            emit BurnerUpdated(oldBurner, newBurner);
        }
        
        emit ActionExecuted(actionId, action.actionType);
    }

    /// @notice Cancel a pending action
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
    
    /// @notice Set buyback threshold
    function setBuybackThreshold(uint256 _threshold) external onlyOwner {
        buybackThreshold = _threshold;
    }

    // ============ Registration (V2 with CLAWDIA burn) ============
    
    /**
     * @notice Register a token for sunset coverage
     * @dev User pays ETH, contract buys 25M $CLAWDIA and burns it
     * @param token Token address to register
     * @param feeSplitter FeeSplitter contract for this token
     * @param tier Coverage tier (Standard or Premium)
     * 
     * Integration Example:
     * ```
     * ☑️ Enable Sunset Protection (+0.1 ETH)
     *     📝 Includes 25M $CLAWDIA auto-burn
     * ```
     */
    function register(
        address token,
        address feeSplitter,
        Tier tier
    ) external payable whenNotPaused {
        if (projects[token].owner != address(0)) revert AlreadyRegistered();
        if (vault == address(0)) revert VaultNotSet();
        if (clawdiaBurner == address(0)) revert BurnerNotSet();

        require(
            IFeeSplitter(feeSplitter).token() == token,
            "Splitter token mismatch"
        );
        
        // V2: Execute CLAWDIA burn
        uint256 ethSpent;
        uint256 clawdiaBurned;
        
        if (msg.value > 0) {
            (ethSpent, clawdiaBurned) = ICLAWDIABurner(clawdiaBurner).burnForRegistration{value: msg.value}(
                token,
                msg.sender
            );
        }

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
            sunsetAnnouncedBy: address(0),
            clawdiaBurned: clawdiaBurned
        });

        registeredTokens.push(token);
        ISunsetVault(vault).authorizeSplitter(feeSplitter);

        emit ProjectRegistered(token, msg.sender, feeSplitter, tier, clawdiaBurned, ethSpent);
    }
    
    /**
     * @notice Register without burn (for testing/sponsored registrations)
     * @dev Only owner can call this - for partnerships/grants
     */
    function registerSponsored(
        address token,
        address feeSplitter,
        Tier tier,
        address projectOwner
    ) external onlyOwner whenNotPaused {
        if (projects[token].owner != address(0)) revert AlreadyRegistered();
        if (vault == address(0)) revert VaultNotSet();

        require(
            IFeeSplitter(feeSplitter).token() == token,
            "Splitter token mismatch"
        );

        uint256 currentTime = block.timestamp;

        projects[token] = Project({
            owner: projectOwner,
            feeSplitter: feeSplitter,
            tier: tier,
            active: true,
            registeredAt: currentTime,
            lastMeaningfulDeposit: currentTime,
            totalDeposited: 0,
            sunsetAnnouncedAt: 0,
            sunsetAnnouncedBy: address(0),
            clawdiaBurned: 0 // Sponsored - no burn
        });

        registeredTokens.push(token);
        ISunsetVault(vault).authorizeSplitter(feeSplitter);

        emit ProjectRegistered(token, projectOwner, feeSplitter, tier, 0, 0);
    }

    // ============ Fee Tracking (V2 with buyback) ============
    
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
    
    /**
     * @notice Receive admin fees for buyback
     * @dev Called by FeeSplitter or vault when admin fees are collected
     */
    function receiveAdminFees() external payable {
        accumulatedAdminFees += msg.value;
        emit AdminFeesAccumulated(msg.value, accumulatedAdminFees);
        
        // Auto-trigger buyback if threshold reached
        if (accumulatedAdminFees >= buybackThreshold && clawdiaBurner != address(0)) {
            _executeBuyback();
        }
    }
    
    /**
     * @notice Execute buyback and burn with accumulated admin fees
     */
    function executeBuyback() external onlyAdmin {
        _executeBuyback();
    }
    
    function _executeBuyback() internal {
        if (accumulatedAdminFees == 0) return;
        if (clawdiaBurner == address(0)) return;
        
        uint256 amount = accumulatedAdminFees;
        accumulatedAdminFees = 0;
        
        ICLAWDIABurner(clawdiaBurner).buybackAndBurn{value: amount}();
        
        // Get stats from burner for event
        (,uint256 totalBuybackBurns,,) = ICLAWDIABurner(clawdiaBurner).getBurnStats();
        emit BuybackExecuted(amount, totalBuybackBurns);
    }

    // ============ Two-Step Sunset ============

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

    function executeSunset(address token) external whenNotPaused {
        Project storage project = projects[token];
        if (!project.active) revert NotRegistered();
        if (project.sunsetAnnouncedAt == 0) revert SunsetNotAnnounced();
        
        uint256 executableAt = project.sunsetAnnouncedAt + ANNOUNCEMENT_PERIOD;
        if (block.timestamp < executableAt) revert AnnouncementPeriodNotMet();
        
        project.active = false;
        
        ISunsetVault(vault).triggerSunset(token);
        
        emit SunsetExecuted(token, msg.sender);
    }

    function cancelSunset(address token) external {
        Project storage project = projects[token];
        if (project.sunsetAnnouncedAt == 0) revert SunsetNotAnnounced();
        if (!project.active) revert NotRegistered();
        
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
        uint256 totalDeposited,
        uint256 clawdiaBurned
    ) {
        Project storage p = projects[token];
        return (
            p.owner,
            p.feeSplitter,
            p.tier,
            p.active,
            p.registeredAt,
            p.lastMeaningfulDeposit,
            p.totalDeposited,
            p.clawdiaBurned
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
    
    // ============ V2 View Functions ============
    
    /**
     * @notice Get estimated cost to register (ETH needed for 25M CLAWDIA burn)
     */
    function getRegistrationCost() external view returns (uint256) {
        if (clawdiaBurner == address(0)) return 0;
        return ICLAWDIABurner(clawdiaBurner).estimateRegistrationCost();
    }
    
    /**
     * @notice Get total CLAWDIA burned by protocol
     */
    function getTotalClawdiaBurned() external view returns (uint256) {
        if (clawdiaBurner == address(0)) return 0;
        return ICLAWDIABurner(clawdiaBurner).getTotalBurned();
    }
    
    /**
     * @notice Get detailed burn statistics
     */
    function getBurnStats() external view returns (
        uint256 totalRegistrationBurns,
        uint256 totalBuybackBurns,
        uint256 totalBurned,
        uint256 totalEthSpent,
        uint256 pendingBuyback
    ) {
        if (clawdiaBurner != address(0)) {
            (totalRegistrationBurns, totalBuybackBurns, totalBurned, totalEthSpent) = 
                ICLAWDIABurner(clawdiaBurner).getBurnStats();
        }
        pendingBuyback = accumulatedAdminFees;
    }
    
    /**
     * @notice Get burn amount required for registration
     */
    function getRegistrationBurnAmount() external view returns (uint256) {
        if (clawdiaBurner == address(0)) return 0;
        return ICLAWDIABurner(clawdiaBurner).REGISTRATION_BURN_AMOUNT();
    }
    
    // ============ Receive ============
    
    receive() external payable {
        // Accept ETH for admin fees
        accumulatedAdminFees += msg.value;
        emit AdminFeesAccumulated(msg.value, accumulatedAdminFees);
    }
}
