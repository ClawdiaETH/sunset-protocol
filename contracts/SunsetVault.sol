// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SunsetVault
 * @notice Holds ETH coverage pools for token sunset events
 * @dev SECURITY RECOMMENDATIONS:
 *      - Deploy with a multi-sig as owner (Gnosis Safe recommended)
 *      - Use 2-of-3 or 3-of-5 threshold for mainnet
 *      - Admin should also be a multi-sig for emergency controls
 *      - Consider using OpenZeppelin Defender for monitoring
 */

interface ISunsetRegistry {
    function recordDeposit(address token, uint256 amount) external;
    function projects(address token) external view returns (
        address owner,
        address feeSplitter,
        uint8 tier,
        bool active,
        uint256 registeredAt,
        uint256 lastMeaningfulDeposit,
        uint256 totalDeposited
    );
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function balanceOf(address) external view returns (uint256);
}

contract SunsetVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    // Coverage multipliers (basis points, 10000 = 1x) - for display only
    uint256 public constant STANDARD_MULTIPLIER = 12000; // 1.2x
    uint256 public constant PREMIUM_MULTIPLIER = 15000;  // 1.5x
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant TIMELOCK_DELAY = 24 hours;

    // ============ Structs ============
    struct Coverage {
        uint256 depositedAmount;   // Actual ETH deposited
        uint256 snapshotSupply;    // Token supply at sunset
        uint256 snapshotBlock;     // Block number of sunset
        bool triggered;            // Whether sunset has been triggered
    }

    struct PendingAction {
        bytes32 actionType;        // keccak256 of action name
        bytes data;                // Encoded action data
        uint256 scheduledAt;       // When action was proposed
        bool executed;             // Whether action has been executed
        bool cancelled;            // Whether action was cancelled
    }

    // ============ State ============
    address public registry;
    address public weth;
    address public admin;
    bool public paused;
    
    mapping(address => Coverage) public coverage;
    mapping(address => uint256) public ethBalances;  // Actual ETH per token
    mapping(address => bool) public authorizedSplitters;
    mapping(address => mapping(address => bool)) public hasClaimed;
    
    // Timelock state
    uint256 public pendingActionCount;
    mapping(uint256 => PendingAction) public pendingActions;

    // ============ Events ============
    event Deposited(address indexed token, uint256 amount, uint256 newBalance);
    event SunsetTriggered(
        address indexed token,
        uint256 actualBalance,
        uint256 snapshotSupply
    );
    event Claimed(
        address indexed token,
        address indexed holder,
        uint256 amount
    );
    event SplitterAuthorized(address indexed splitter, bool authorized);
    event Paused(address indexed by, bool isPaused);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    // Timelock events
    event ActionProposed(uint256 indexed actionId, bytes32 actionType, uint256 executeAfter);
    event ActionExecuted(uint256 indexed actionId, bytes32 actionType);
    event ActionCancelled(uint256 indexed actionId, bytes32 actionType);

    // ============ Errors ============
    error NotAuthorized();
    error NotTriggered();
    error AlreadyClaimed();
    error AlreadyTriggered();
    error NoBalance();
    error TransferFailed();
    error RegistryNotSet();
    error ContractPaused();
    error ActionNotReady();
    error ActionNotFound();
    error ActionAlreadyExecuted();
    error ActionAlreadyCancelled();
    error TimelockNotExpired();

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
    constructor(address _weth) Ownable(msg.sender) {
        weth = _weth;
        admin = msg.sender;
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
        if (newAdmin == address(0)) revert NotAuthorized();
        
        actionId = ++pendingActionCount;
        pendingActions[actionId] = PendingAction({
            actionType: keccak256("SET_ADMIN"),
            data: abi.encode(newAdmin),
            scheduledAt: block.timestamp,
            executed: false,
            cancelled: false
        });
        
        emit ActionProposed(actionId, keccak256("SET_ADMIN"), block.timestamp + TIMELOCK_DELAY);
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
        
        if (action.actionType == keccak256("SET_ADMIN")) {
            address newAdmin = abi.decode(action.data, (address));
            address oldAdmin = admin;
            admin = newAdmin;
            emit AdminChanged(oldAdmin, newAdmin);
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
        bytes32 actionType,
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
    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    function authorizeSplitter(address splitter) external {
        require(
            msg.sender == registry || msg.sender == owner(),
            "Only registry or owner"
        );
        authorizedSplitters[splitter] = true;
        emit SplitterAuthorized(splitter, true);
    }

    function revokeSplitter(address splitter) external onlyOwner {
        authorizedSplitters[splitter] = false;
        emit SplitterAuthorized(splitter, false);
    }

    // ============ Deposits ============
    /// @notice Deposit ETH for a token's coverage pool
    /// @dev Only authorized splitters can deposit
    function deposit(address token) external payable whenNotPaused {
        if (registry == address(0)) revert RegistryNotSet();
        if (msg.value == 0) revert NoBalance();

        // Only authorized splitters can deposit (prevents spam)
        if (!authorizedSplitters[msg.sender]) revert NotAuthorized();

        ethBalances[token] += msg.value;
        coverage[token].depositedAmount += msg.value;

        // Notify registry for activity tracking
        ISunsetRegistry(registry).recordDeposit(token, msg.value);

        emit Deposited(token, msg.value, ethBalances[token]);
    }

    /// @notice Deposit WETH (auto-unwraps to ETH)
    function depositWETH(address token, uint256 amount) external whenNotPaused {
        if (registry == address(0)) revert RegistryNotSet();
        if (amount == 0) revert NoBalance();
        if (!authorizedSplitters[msg.sender]) revert NotAuthorized();

        // Transfer WETH from sender
        IERC20(weth).safeTransferFrom(msg.sender, address(this), amount);

        // Unwrap to ETH
        IWETH(weth).withdraw(amount);

        ethBalances[token] += amount;
        coverage[token].depositedAmount += amount;

        ISunsetRegistry(registry).recordDeposit(token, amount);

        emit Deposited(token, amount, ethBalances[token]);
    }

    // ============ Sunset ============
    /// @notice Trigger sunset for a token
    /// @dev Only callable by registry
    function triggerSunset(address token) external whenNotPaused {
        if (msg.sender != registry) revert NotAuthorized();

        Coverage storage cov = coverage[token];
        if (cov.triggered) revert AlreadyTriggered();

        cov.triggered = true;
        cov.snapshotBlock = block.number;
        cov.snapshotSupply = IERC20(token).totalSupply();

        emit SunsetTriggered(token, ethBalances[token], cov.snapshotSupply);
    }

    // ============ Claims ============
    /// @notice Claim your share of the coverage pool
    /// @dev Pro-rata based on token holdings vs total supply
    function claim(address token) external nonReentrant whenNotPaused {
        Coverage storage cov = coverage[token];
        if (!cov.triggered) revert NotTriggered();
        if (hasClaimed[token][msg.sender]) revert AlreadyClaimed();

        uint256 holderBalance = IERC20(token).balanceOf(msg.sender);
        if (holderBalance == 0) revert NoBalance();

        // Calculate pro-rata share of ACTUAL pool
        // amount = (holderBalance / snapshotSupply) * actualPoolBalance
        uint256 actualPool = ethBalances[token];
        uint256 amount = (holderBalance * actualPool) / cov.snapshotSupply;

        if (amount == 0) revert NoBalance();

        // Mark as claimed BEFORE transfer (CEI pattern)
        hasClaimed[token][msg.sender] = true;
        ethBalances[token] -= amount;

        // Transfer ETH
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Claimed(token, msg.sender, amount);
    }

    // ============ View Functions ============
    function getClaimableAmount(
        address token,
        address holder
    ) external view returns (uint256) {
        Coverage storage cov = coverage[token];
        if (!cov.triggered) return 0;
        if (hasClaimed[token][holder]) return 0;

        uint256 holderBalance = IERC20(token).balanceOf(holder);
        if (holderBalance == 0) return 0;

        uint256 actualPool = ethBalances[token];
        return (holderBalance * actualPool) / cov.snapshotSupply;
    }

    function getCoverage(address token) external view returns (
        uint256 depositedAmount,
        uint256 actualBalance,
        uint256 snapshotSupply,
        uint256 snapshotBlock,
        bool triggered
    ) {
        Coverage storage cov = coverage[token];
        return (
            cov.depositedAmount,
            ethBalances[token],
            cov.snapshotSupply,
            cov.snapshotBlock,
            cov.triggered
        );
    }

    function getActualBalance(address token) external view returns (uint256) {
        return ethBalances[token];
    }

    function getTotalCoverage() external view returns (uint256 total) {
        // Note: This iterates - consider caching if gas is a concern
        return address(this).balance;
    }

    // ============ Receive ============
    /// @notice Accept ETH from WETH unwrap
    receive() external payable {}
}
