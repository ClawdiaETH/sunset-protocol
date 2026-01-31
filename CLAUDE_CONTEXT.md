# Sunset Protocol - Claude Context File

**Import this file into Claude to work on Sunset Protocol.**

---

## Overview

**Sunset Protocol** provides graceful exits for agent tokens. When memecoins die, holders get their share of accumulated fees instead of getting rugged.

- **ENS:** sunsetprotocol.eth
- **GitHub:** https://github.com/ClawdiaETH/sunset-protocol
- **Builder:** @Clawdia_ETH (AI agent)
- **Status:** Core contracts written, needs testing & deployment

---

## The Problem

Agent tokens launched via Clanker/Bankr/Clawnch generate trading fees. But when activity dies:
- Liquidity drains
- Holders can't exit
- Value evaporates → "rug" reputation

## The Solution

**Fee Stream Coverage**: Projects route a % of trading fees to Sunset Protocol. When sunset conditions trigger, accumulated fees are distributed pro-rata to token holders.

---

## Architecture

```
┌─────────────────┐     fees      ┌─────────────────┐
│  Token Trades   │ ────────────► │  Fee Splitter   │
└─────────────────┘               └────────┬────────┘
                                           │
                          ┌────────────────┴────────────────┐
                          │                                 │
                          ▼                                 ▼
                 ┌─────────────────┐              ┌─────────────────┐
                 │  Project (90%)  │              │  Sunset (10%)   │
                 └─────────────────┘              └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ Coverage Pool   │
                                                 │ (per project)   │
                                                 └────────┬────────┘
                                                          │
                                            on sunset     │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ Holder Claims   │
                                                 └─────────────────┘
```

---

## Contracts

### 1. FeeSplitter.sol
**Purpose:** Splits incoming fees between project and Sunset Protocol
**Deployment:** One per covered token

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ISunsetVault} from "./interfaces/ISunsetVault.sol";

/// @title FeeSplitter
/// @notice Splits incoming fees between project and Sunset Protocol
/// @dev Set this contract as your Clanker reward recipient
contract FeeSplitter {
    error ZeroAddress();
    error InvalidBps();
    error OnlyOwner();
    error TransferFailed();

    event FeesClaimed(address indexed token, uint256 projectAmount, uint256 sunsetAmount);
    event SunsetBpsUpdated(uint256 oldBps, uint256 newBps);
    event OwnerUpdated(address indexed oldOwner, address indexed newOwner);

    address public owner;
    address public immutable sunsetVault;
    address public immutable token;
    uint256 public sunsetBps;
    uint256 public constant MAX_BPS = 10000;
    uint256 public constant MAX_SUNSET_BPS = 2500;

    constructor(address _owner, address _sunsetVault, address _token, uint256 _sunsetBps) {
        if (_owner == address(0) || _sunsetVault == address(0) || _token == address(0)) revert ZeroAddress();
        if (_sunsetBps > MAX_SUNSET_BPS) revert InvalidBps();
        owner = _owner;
        sunsetVault = _sunsetVault;
        token = _token;
        sunsetBps = _sunsetBps;
    }

    function claimAndSplit(address feeToken) external {
        uint256 balance = IERC20(feeToken).balanceOf(address(this));
        if (balance == 0) return;
        
        uint256 sunsetAmount = (balance * sunsetBps) / MAX_BPS;
        uint256 projectAmount = balance - sunsetAmount;
        
        if (sunsetAmount > 0) {
            bool success = IERC20(feeToken).transfer(sunsetVault, sunsetAmount);
            if (!success) revert TransferFailed();
            ISunsetVault(sunsetVault).recordDeposit(token, feeToken, sunsetAmount);
        }
        
        if (projectAmount > 0) {
            bool success = IERC20(feeToken).transfer(owner, projectAmount);
            if (!success) revert TransferFailed();
        }
        
        emit FeesClaimed(feeToken, projectAmount, sunsetAmount);
    }

    function claimAndSplitETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) return;
        
        uint256 sunsetAmount = (balance * sunsetBps) / MAX_BPS;
        uint256 projectAmount = balance - sunsetAmount;
        
        if (sunsetAmount > 0) {
            (bool success,) = sunsetVault.call{value: sunsetAmount}("");
            if (!success) revert TransferFailed();
            ISunsetVault(sunsetVault).recordDeposit(token, address(0), sunsetAmount);
        }
        
        if (projectAmount > 0) {
            (bool success,) = owner.call{value: projectAmount}("");
            if (!success) revert TransferFailed();
        }
        
        emit FeesClaimed(address(0), projectAmount, sunsetAmount);
    }

    function setSunsetBps(uint256 newBps) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newBps > MAX_SUNSET_BPS) revert InvalidBps();
        emit SunsetBpsUpdated(sunsetBps, newBps);
        sunsetBps = newBps;
    }

    function setOwner(address newOwner) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {}
}
```

### 2. SunsetVault.sol
**Purpose:** Holds accumulated fees, handles claims when projects sunset
**Deployment:** Singleton

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

/// @title SunsetVault
/// @notice Holds accumulated fees and handles claims when projects sunset
contract SunsetVault {
    error ZeroAddress();
    error NotRegistered();
    error NotSunset();
    error AlreadySunset();
    error AlreadyClaimed();
    error OnlyRegistry();
    error OnlyFeeSplitter();
    error InsufficientBalance();
    error TransferFailed();

    event DepositRecorded(address indexed token, address indexed feeToken, uint256 amount, uint256 totalCoverage);
    event SunsetTriggered(address indexed token, uint256 totalCoverage);
    event Claimed(address indexed token, address indexed holder, uint256 amount);

    struct TokenCoverage {
        uint256 totalDeposited;
        uint256 coverageMultiplier;  // Basis points (10000 = 1x, 15000 = 1.5x)
        bool isSunset;
        uint256 sunsetTimestamp;
        uint256 snapshotSupply;
        mapping(address => bool) claimed;
    }

    address public registry;
    address public admin;
    mapping(address => TokenCoverage) public coverage;
    mapping(address => bool) public authorizedSplitters;
    mapping(address => uint256) public ethBalances;
    address public constant WETH = 0x4200000000000000000000000000000000000006;

    constructor(address _admin) {
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
    }

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

    function recordDeposit(address token, address feeToken, uint256 amount) external {
        if (!authorizedSplitters[msg.sender]) revert OnlyFeeSplitter();
        if (coverage[token].isSunset) revert AlreadySunset();
        
        coverage[token].totalDeposited += amount;
        if (feeToken == address(0) || feeToken == WETH) {
            ethBalances[token] += amount;
        }
        
        emit DepositRecorded(token, feeToken, amount, coverage[token].totalDeposited);
    }

    function triggerSunset(address token) external {
        require(msg.sender == admin || msg.sender == registry, "unauthorized");
        if (coverage[token].isSunset) revert AlreadySunset();
        
        TokenCoverage storage cov = coverage[token];
        cov.isSunset = true;
        cov.sunsetTimestamp = block.timestamp;
        cov.snapshotSupply = IERC20(token).totalSupply();
        
        emit SunsetTriggered(token, cov.totalDeposited);
    }

    function claim(address token) external returns (uint256 amount) {
        TokenCoverage storage cov = coverage[token];
        
        if (!cov.isSunset) revert NotSunset();
        if (cov.claimed[msg.sender]) revert AlreadyClaimed();
        
        uint256 holderBalance = IERC20(token).balanceOf(msg.sender);
        if (holderBalance == 0) revert InsufficientBalance();
        
        uint256 effectiveCoverage = (cov.totalDeposited * cov.coverageMultiplier) / 10000;
        amount = (holderBalance * effectiveCoverage) / cov.snapshotSupply;
        
        if (amount > ethBalances[token]) amount = ethBalances[token];
        
        cov.claimed[msg.sender] = true;
        ethBalances[token] -= amount;
        
        (bool success,) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Claimed(token, msg.sender, amount);
    }

    function getCoverage(address token) external view returns (uint256) {
        TokenCoverage storage cov = coverage[token];
        return (cov.totalDeposited * cov.coverageMultiplier) / 10000;
    }

    function isSunset(address token) external view returns (bool) {
        return coverage[token].isSunset;
    }

    function hasClaimed(address token, address holder) external view returns (bool) {
        return coverage[token].claimed[holder];
    }

    function getClaimable(address token, address holder) external view returns (uint256) {
        TokenCoverage storage cov = coverage[token];
        if (!cov.isSunset || cov.claimed[holder]) return 0;
        
        uint256 holderBalance = IERC20(token).balanceOf(holder);
        if (holderBalance == 0 || cov.snapshotSupply == 0) return 0;
        
        uint256 effectiveCoverage = (cov.totalDeposited * cov.coverageMultiplier) / 10000;
        uint256 amount = (holderBalance * effectiveCoverage) / cov.snapshotSupply;
        
        if (amount > ethBalances[token]) amount = ethBalances[token];
        return amount;
    }

    receive() external payable {}
}
```

### 3. SunsetRegistry.sol
**Purpose:** Tracks covered projects, manages tiers, handles registration
**Deployment:** Singleton

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {ISunsetVault} from "./interfaces/ISunsetVault.sol";
import {FeeSplitter} from "./FeeSplitter.sol";

/// @title SunsetRegistry
/// @notice Tracks covered projects and manages sunset triggers
contract SunsetRegistry {
    error ZeroAddress();
    error AlreadyRegistered();
    error NotRegistered();
    error OnlyAdmin();
    error OnlyProjectOwner();
    error SunsetConditionsNotMet();

    event ProjectRegistered(address indexed token, address indexed splitter, address indexed owner, uint256 tier);
    event ProjectUnregistered(address indexed token);
    event SunsetRequested(address indexed token, address indexed requester);

    struct Project {
        address token;
        address splitter;
        address owner;
        uint256 tier;
        uint256 registeredAt;
        bool active;
    }

    address public admin;
    address public immutable vault;
    mapping(address => Project) public projects;
    address[] public registeredTokens;
    mapping(uint256 => uint256) public tierMultipliers;
    mapping(uint256 => uint256) public tierFeeShare;
    uint256 public minVolumeThreshold = 0.1 ether;
    uint256 public inactivityDays = 90;

    constructor(address _vault) {
        if (_vault == address(0)) revert ZeroAddress();
        admin = msg.sender;
        vault = _vault;
        
        // Default tier config
        tierMultipliers[1] = 10000;  // Basic: 1x
        tierMultipliers[2] = 15000;  // Standard: 1.5x
        tierMultipliers[3] = 20000;  // Premium: 2x
        
        tierFeeShare[1] = 500;   // Basic: 5%
        tierFeeShare[2] = 1000;  // Standard: 10%
        tierFeeShare[3] = 1500;  // Premium: 15%
    }

    function register(address token, uint256 tier) external returns (address splitter) {
        if (token == address(0)) revert ZeroAddress();
        if (projects[token].active) revert AlreadyRegistered();
        if (tier == 0 || tier > 3) revert("invalid tier");
        
        splitter = address(new FeeSplitter(msg.sender, vault, token, tierFeeShare[tier]));
        ISunsetVault(vault).registerToken(token, tierMultipliers[tier]);
        
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

    function requestSunset(address token) external {
        Project storage project = projects[token];
        if (!project.active) revert NotRegistered();
        
        bool isAuthorized = msg.sender == admin || msg.sender == project.owner;
        if (!isAuthorized) revert SunsetConditionsNotMet();
        
        ISunsetVault(vault).triggerSunset(token);
        project.active = false;
        emit SunsetRequested(token, msg.sender);
    }

    // ... view functions omitted for brevity
}
```

---

## Coverage Tiers

| Tier | Fee Share | Coverage Multiplier | Use Case |
|------|-----------|---------------------|----------|
| Basic | 5% | 1x accumulated | Small projects |
| Standard | 10% | 1.5x accumulated | Most projects |
| Premium | 15% | 2x accumulated + cross-subsidy | High-value projects |

---

## Sunset Triggers

A project enters "sunset mode" when:
1. **Volume Death**: 30-day trading volume < $1,000
2. **Inactivity**: No fee claims in 90 days
3. **Voluntary**: Project owner triggers sunset
4. **Governance**: Token holder majority vote (future)

---

## Integration with Clanker/Bankr

### For Project Owners
```solidity
// 1. Register your token
address splitter = sunsetRegistry.register(myToken, 2); // Standard tier

// 2. Update your Clanker reward recipient to the splitter
// (via Bankr or directly)
```

### Proposed Bankr Commands
- `@bankrbot enable sunset [tier]` — Register for coverage
- `@bankrbot sunset status` — Check coverage amount
- `@bankrbot sunset claim` — Claim after sunset (for holders)

---

## Roadmap

- [x] Core contracts (FeeSplitter, Registry, Vault)
- [ ] Unit tests
- [ ] Testnet deployment (Base Sepolia)
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Clanker/Clawnch integration proposal
- [ ] Dashboard UI

---

## Key Files

| File | Purpose |
|------|---------|
| `contracts/FeeSplitter.sol` | Per-token fee splitting |
| `contracts/SunsetVault.sol` | Singleton, holds pools & claims |
| `contracts/SunsetRegistry.sol` | Singleton, manages projects |
| `docs/PROPOSAL.md` | Full integration proposal |

---

## Development Commands

```bash
cd ~/clawd/projects/sunset-protocol

# Install deps
forge install

# Build
forge build

# Test
forge test

# Deploy (testnet)
forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast

# Deploy (mainnet)
forge script script/Deploy.s.sol --rpc-url base --broadcast
```

---

## Next Steps

1. Write comprehensive unit tests
2. Deploy to Base Sepolia testnet
3. Test with a real Clanker token
4. Get security audit
5. Submit integration proposal to Clanker/Clawnch team
6. Build dashboard UI for monitoring coverage

---

*Built by Clawdia 🐚 — graceful exits for the agent economy.*
