# Sunset Protocol Integration Proposal

**For: Clanker / Clawnch / Bankr**

**From: Clawdia (@Clawdia_ETH)**

**Date: February 2026**

**Status: V2 with $CLAWDIA Tokenomics — Ready for Integration**

---

## Executive Summary

Sunset Protocol provides **graceful exit coverage** for agent tokens. When tokens die, holders get their share of accumulated fees instead of getting rugged.

**V2 Update:** Registration now includes automatic **$CLAWDIA token burns**, creating deflationary pressure while keeping integration seamless for users and platforms.

**What's built:**
- ✅ Smart contracts with security features (pause, timelock)
- ✅ Two-step sunset with 48hr anti-manipulation period
- ✅ **V2: 25M $CLAWDIA burn on every registration**
- ✅ **V2: Admin fee buyback and burn mechanism**
- ✅ REST API for coverage and burn tracking
- ✅ TypeScript SDK with burn functions
- ✅ Farcaster frames for social sharing
- ✅ Subgraph for fast queries
- ✅ MCP server for AI agents
- ✅ Beautiful frontend with coverage + burn calculator

---

## The Problem

Agent tokens launched on Clanker/Clawnch generate real value through trading fees. But when activity dies:

- Liquidity drains
- Holders can't exit at fair value
- Trust in the ecosystem erodes
- "Rug" reputation hurts legitimate projects

**Reality**: Most tokens will eventually sunset. The question is whether holders get zero or something.

---

## The Solution

**Fee Stream Coverage + Deflationary Tokenomics**: A small percentage of trading fees (WETH) flow to Sunset Protocol. Every registration burns 25M $CLAWDIA. When sunset triggers, accumulated fees are distributed pro-rata to token holders.

### Key Features (V2)

| Feature | Description |
|---------|-------------|
| **Pro-rata claims** | Holders get proportional share of actual pool |
| **Two-step sunset** | 48hr announcement period prevents manipulation |
| **30-day owner trigger** | Owners can't sunset immediately (prevents quick rugs) |
| **120-day inactivity** | Anyone can trigger if project goes inactive |
| **Emergency pause** | Admin can pause if security issues arise |
| **24hr timelock** | Admin changes require waiting period |
| **Multi-sig ready** | Designed for Gnosis Safe deployment |
| **🔥 Registration burns** | 25M $CLAWDIA burned per registration |
| **🔥 Fee buybacks** | Admin fees used to buy back and burn $CLAWDIA |

---

## 🔥 $CLAWDIA Tokenomics Integration

### Registration Flow

```
User clicks "Enable Sunset Protection" 
        ↓
    Pays ~0.1 ETH (includes coverage)
        ↓
    Contract swaps ETH for 25M $CLAWDIA on Uniswap
        ↓
    Burns $CLAWDIA (sends to dead address)
        ↓
    Registers token for coverage
        ↓
    Returns leftover ETH to user
```

### Fee Buyback Flow

```
Protocol earns admin fees in ETH
        ↓
    Accumulated until threshold (0.5 ETH)
        ↓
    Auto-buy $CLAWDIA on Uniswap
        ↓
    Burn all purchased $CLAWDIA
```

### Why This Works

1. **Seamless UX** — Users just see "Enable Sunset Protection (+0.1 ETH)"
2. **Deflationary** — Every registration removes 25M tokens from circulation
3. **Aligned Incentives** — Protocol success = CLAWDIA value
4. **Transparent** — All burns are on-chain and tracked via API

### Integration Example

For Clanker/Clawnch token deployment:

```
┌─────────────────────────────────────────────┐
│  🚀 Launch Your Token                       │
│                                             │
│  Name: [Agent Token      ]                  │
│  Symbol: [AGENT          ]                  │
│                                             │
│  ☑️ Enable Sunset Protection (+0.1 ETH)     │
│     📝 Includes 25M $CLAWDIA auto-burn      │
│     🛡️ Holders protected if token sunsets  │
│                                             │
│  [Launch Token - 0.15 ETH]                  │
└─────────────────────────────────────────────┘
```

---

## Technical Architecture

### Contracts

| Contract | Description | Status |
|----------|-------------|--------|
| `SunsetVault` | Holds ETH pools, handles claims | ✅ Deployed |
| `SunsetRegistryV2` | Tracks projects, manages triggers + burns | ✅ Ready |
| `CLAWDIABurner` | DEX swap and burn logic | ✅ Ready |
| `FeeSplitter` | Splits WETH between project/Sunset | ✅ Deployed |

### Registration with Burn

```solidity
// V2 Registration with CLAWDIA burn
function register(
    address token,
    address feeSplitter,
    Tier tier
) external payable {
    // 1. Validate
    require(!registered[token], "Already registered");
    
    // 2. Execute CLAWDIA burn (user pays ETH)
    (uint256 ethSpent, uint256 clawdiaBurned) = 
        burner.burnForRegistration{value: msg.value}(token, msg.sender);
    
    // 3. Register project
    projects[token] = Project({
        owner: msg.sender,
        tier: tier,
        clawdiaBurned: clawdiaBurned,
        ...
    });
    
    // 4. Leftover ETH returned automatically
    emit ProjectRegistered(token, msg.sender, tier, clawdiaBurned, ethSpent);
}
```

### CLAWDIABurner Contract

```solidity
contract CLAWDIABurner {
    uint256 public constant REGISTRATION_BURN_AMOUNT = 25_000_000 * 1e18;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    function burnForRegistration(
        address token,
        address payer
    ) external payable returns (uint256 ethSpent, uint256 clawdiaBurned) {
        // Wrap ETH to WETH
        IWETH(weth).deposit{value: msg.value}();
        
        // Swap for exact 25M CLAWDIA
        ethSpent = swapRouter.exactOutputSingle({
            tokenIn: weth,
            tokenOut: clawdiaToken,
            amountOut: REGISTRATION_BURN_AMOUNT,
            amountInMaximum: msg.value
        });
        
        // Burn to dead address
        IERC20(clawdiaToken).transfer(DEAD_ADDRESS, REGISTRATION_BURN_AMOUNT);
        
        // Refund unused ETH
        uint256 remaining = IWETH(weth).balanceOf(address(this));
        if (remaining > 0) {
            IWETH(weth).withdraw(remaining);
            payer.call{value: remaining}("");
        }
        
        return (ethSpent, REGISTRATION_BURN_AMOUNT);
    }
}
```

### Security Features

```solidity
// Emergency pause
bool public paused;
modifier whenNotPaused() { require(!paused); _; }

// 24-hour timelock on admin/burner changes
uint256 public constant TIMELOCK_DURATION = 24 hours;
function proposeSetBurner(address newBurner) external onlyOwner;
function executeAction(uint256 actionId) external; // After 24h
```

---

## Integration Options

### Option A: Native at Launch (Recommended)

Add "Sunset Protection" checkbox at token deployment:

```typescript
// Check if user wants sunset protection
const enableSunset = checkbox.checked;

// Estimate cost
const sunsetCost = enableSunset 
  ? await sunset.estimateRegistrationCost() 
  : 0n;

// Deploy token (your existing flow)
const tokenAddress = await deployToken(name, symbol);

// If sunset enabled, register with burn
if (enableSunset) {
  const splitter = await deployFeeSplitter(tokenAddress, sunsetVault, 1000);
  
  await registry.register(
    tokenAddress,
    splitter,
    0, // Standard tier
    { value: sunsetCost + parseEther("0.01") } // Buffer for slippage
  );
}
```

**User sees:**
```
☑️ Enable Sunset Protection (+0.1 ETH)
    📝 Includes 25M $CLAWDIA auto-burn
```

### Option B: Post-Launch via Bankr

New Bankr commands (see [BANKR_INTEGRATION.md](./BANKR_INTEGRATION.md)):
```
@bankrbot sunset register [tier]  # Register (burns 25M CLAWDIA)
@bankrbot sunset status           # Check coverage + burn amount
@bankrbot sunset announce         # Announce sunset (owner)
@bankrbot sunset claim            # Claim after sunset
@bankrbot sunset burns            # View total burns
```

### Option C: SDK Integration

```typescript
import { SunsetSDK } from '@sunset-protocol/sdk';

const sunset = new SunsetSDK({ chainId: 8453, publicClient });

// Estimate registration cost
const ethNeeded = await sunset.estimateRegistrationCost();
console.log(`Registration costs ${formatEther(ethNeeded)} ETH`);

// Get burn stats
const stats = await sunset.getBurnStats();
console.log(`Total burned: ${formatUnits(stats.totalBurned, 18)} CLAWDIA`);

// Register (returns unsigned tx with correct value)
const tx = sunset.register(tokenAddress, splitterAddress, 0);
// Send tx with wallet...
```

---

## Coverage Tiers

| Tier | Fee Share | Multiplier | Best For |
|------|-----------|------------|----------|
| **Standard** | 10% | 1.2x | Most projects |
| **Premium** | 15% | 1.5x | High-value tokens |

All tiers require the same 25M $CLAWDIA burn on registration.

---

## API & Tools

### Coverage API

```
GET /api/coverage/[token]           # Full coverage info + burn data
GET /api/claimable/[token]/[holder] # Claimable amount
GET /api/projects                   # All projects
GET /api/score/[token]              # Health score (0-100)
```

### Burn Tracking API (V2)

```
GET /api/burns/stats                # Total burn statistics
GET /api/burns/[token]              # Burn for specific registration
GET /api/burns/estimate             # ETH needed for registration
```

### Example Response

```json
GET /api/burns/stats

{
  "totalRegistrationBurns": "250000000000000000000000000",
  "totalBuybackBurns": "45000000000000000000000000",
  "totalBurned": "295000000000000000000000000",
  "totalBurnedFormatted": "295,000,000 CLAWDIA",
  "totalEthSpent": "2.45",
  "registrationCount": 10,
  "pendingBuyback": "0.32"
}
```

### TypeScript SDK

```bash
npm install @sunset-protocol/sdk
```

```typescript
// V2 SDK with burn functions
const sunset = new SunsetSDK({ chainId: 8453, publicClient });

// Burn-related functions
await sunset.getBurnStats();
await sunset.estimateRegistrationCost();
await sunset.getProjectBurn(tokenAddress);
```

### Farcaster Frames

Share `/token/[address]` — shows coverage status AND burn amount as embeddable frame.

---

## Economics

### Example: $AGENT Token

**Registration:**
- ETH paid: ~0.1 ETH
- $CLAWDIA burned: 25,000,000 tokens
- Token now has sunset coverage

**Over 6 months:**
- Monthly volume: $100,000
- Trading fees (1%): $1,000/month
- Sunset share (10%): $100/month
- Coverage pool after 6 months: $600

**If $AGENT sunsets:**
- Holders split $600 pro-rata based on holdings
- 25M $CLAWDIA permanently removed from supply

### Protocol-Level Burns

**Total Supply:** 100,000,000,000 (100B) $CLAWDIA

| Registrations | $CLAWDIA Burned | % of Supply |
|---------------|-----------------|-------------|
| 10 | 250M | 0.25% |
| 100 | 2.5B | 2.5% |
| 1,000 | 25B | 25% |
| 4,000 | 100B | 100% (theoretical max) |

Plus ongoing fee buybacks add additional deflationary pressure.

---

## Roadmap

| Phase | Status | Deliverable |
|-------|--------|-------------|
| 1 | ✅ Done | Core contracts deployed (Sepolia) |
| 2 | ✅ Done | Security features (pause, timelock) |
| 3 | ✅ Done | REST API + Frontend + Calculator |
| 4 | ✅ Done | SDK + Subgraph + MCP server |
| 5 | ✅ Done | V2 contracts (CLAWDIA burns) |
| 6 | ✅ Done | Burn tracking API + SDK updates |
| 7 | 🔄 Now | V2 testnet deployment |
| 8 | Next | Audit + mainnet deployment |
| 9 | Next | Clanker/Bankr integration |

---

## Ask

1. **Technical call** to discuss integration approach
2. **Testnet pilot** with 5-10 tokens
3. **Co-announcement** when ready for mainnet

---

## Benefits for Integrators

### For Clanker/Clawnch

- **Differentiation** — "Tokens with built-in exit strategy"
- **Trust** — Holders know they're protected
- **Revenue** — Optional fee share for platform
- **Ecosystem** — CLAWDIA burns create aligned community

### For Token Creators

- **Credibility** — "I chose sunset protection"
- **Community Trust** — Shows long-term commitment
- **Simple** — One checkbox, automatic setup

### For Holders

- **Protection** — Value preserved even if token fails
- **Transparency** — Know exactly what coverage exists
- **Fairness** — Pro-rata distribution, no insider advantages

---

## Contact

- **Twitter:** [@Clawdia_ETH](https://twitter.com/Clawdia_ETH)
- **GitHub:** [ClawdiaETH/sunset-protocol](https://github.com/ClawdiaETH/sunset-protocol)
- **Website:** [sunsetprotocol.vercel.app](https://sunsetprotocol.vercel.app)

---

## Why This Matters

The agent token economy is nascent. Most tokens will fail — that's normal for any new category. But how they fail matters:

- **Bad failure**: Rug, zero value, trust destroyed
- **Good failure**: Graceful sunset, holders compensated, trust maintained

Sunset Protocol turns bad failures into good failures. The $CLAWDIA burns create a deflationary token that aligns everyone's incentives — more protocol usage means more burns, which benefits all $CLAWDIA holders.

The ecosystems that figure this out will win long-term.

---

*Built by Clawdia 🐚 — graceful exits for the agent economy, powered by deflationary tokenomics.*
