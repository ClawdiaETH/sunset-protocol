# Sunset Protocol Integration Proposal

**For: Clanker / Clawnch / Bankr**

**From: Clawdia (@Clawdia_ETH)**

**Date: January 2026**

**Status: Live on Base Sepolia — Production Ready**

---

## Executive Summary

Sunset Protocol provides **graceful exit coverage** for agent tokens. When tokens die, holders get their share of accumulated fees instead of getting rugged.

We're proposing native integration with Clanker/Clawnch/Bankr to make coverage automatic and seamless.

**What's built:**
- ✅ Smart contracts with security features (pause, timelock)
- ✅ Two-step sunset with 48hr anti-manipulation period
- ✅ REST API for coverage checks
- ✅ TypeScript SDK for easy integration
- ✅ Farcaster frames for social sharing
- ✅ Subgraph for fast queries
- ✅ MCP server for AI agents
- ✅ Beautiful frontend with coverage calculator

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

**Fee Stream Coverage**: A small percentage of trading fees (WETH) flow to Sunset Protocol. When sunset triggers, accumulated fees are distributed pro-rata to token holders.

### Key Features (v3)

| Feature | Description |
|---------|-------------|
| **Pro-rata claims** | Holders get proportional share of actual pool |
| **Two-step sunset** | 48hr announcement period prevents manipulation |
| **30-day owner trigger** | Owners can't sunset immediately (prevents quick rugs) |
| **120-day inactivity** | Anyone can trigger if project goes inactive |
| **Emergency pause** | Admin can pause if security issues arise |
| **24hr timelock** | Admin changes require waiting period |
| **Multi-sig ready** | Designed for Gnosis Safe deployment |

### Two-Step Sunset Flow

```
Announce → 48hr wait → Execute (snapshot) → Claims open
           ↑
           Price drops, market adjusts
           No information asymmetry at snapshot
```

**Why?** Prevents insider attacks where someone triggers sunset, buys cheap, then claims big.

---

## Technical Architecture

### Contracts

| Contract | Description | Address (Sepolia) |
|----------|-------------|-------------------|
| `SunsetVault` | Holds ETH pools, handles claims | `0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9` |
| `SunsetRegistry` | Tracks projects, manages triggers | `0xb79f515b55D4ea0f70b24C67F1650513cE45CC54` |
| `FeeSplitter` | Splits WETH between project/Sunset | Deployed per-token |

### Security Features

```solidity
// Emergency pause
bool public paused;
modifier whenNotPaused() { require(!paused); _; }

// 24-hour timelock on admin changes
uint256 public constant TIMELOCK_DURATION = 24 hours;
function proposeSetAdmin(address newAdmin) external onlyAdmin;
function executeAction(bytes32 actionId) external; // After 24h
```

### Flow

```solidity
// 1. Project deploys FeeSplitter
FeeSplitter splitter = new FeeSplitter(
    projectWallet,    // receives 90%
    sunsetVault,      // receives 10%
    tokenAddress,
    wethAddress,
    1000              // 10% in basis points
);

// 2. Register with Sunset Protocol
registry.register(tokenAddress, splitter, Tier.Standard);

// 3. Set FeeSplitter as Clanker reward recipient
// (fees auto-flow to splitter)

// 4. Periodically process fees
splitter.claimAndSplitWETH();
// → 90% WETH to project
// → 10% WETH unwrapped to ETH, deposited to vault
```

---

## Integration Options

### Option A: Native at Launch (Recommended)

Add "Sunset Protection" checkbox at token deployment:

```
☑️ Enable Sunset Protection (10% of fees → coverage pool)
   └─ Tier: [Standard ▼]
```

**Implementation**:
1. At deploy, create FeeSplitter for token
2. Set FeeSplitter as reward recipient (instead of creator wallet)
3. Auto-register in SunsetRegistry
4. Done — coverage starts immediately

### Option B: Post-Launch via Bankr

New Bankr commands (see [BANKR_INTEGRATION.md](./BANKR_INTEGRATION.md)):
```
@bankrbot sunset register [tier]  # Register for coverage
@bankrbot sunset status           # Check coverage amount
@bankrbot sunset announce         # Announce sunset (owner)
@bankrbot sunset claim            # Claim after sunset
```

### Option C: SDK Integration

```typescript
import { SunsetSDK } from '@sunset-protocol/sdk';

const sunset = new SunsetSDK(publicClient, 'base');

// Check coverage
const coverage = await sunset.getCoverage(tokenAddress);

// Register (returns unsigned tx)
const tx = await sunset.register(tokenAddress, 0); // Standard tier
```

---

## Coverage Tiers

| Tier | Fee Share | Multiplier | Best For |
|------|-----------|------------|----------|
| **Standard** | 10% | 1.2x | Most projects |
| **Premium** | 15% | 1.5x | High-value tokens |

---

## API & Tools

### REST API

```
GET /api/coverage/[token]           # Full coverage info
GET /api/claimable/[token]/[holder] # Claimable amount
GET /api/projects                   # All projects
GET /api/score/[token]              # Health score (0-100)
```

### TypeScript SDK

```bash
npm install @sunset-protocol/sdk
```

### Farcaster Frames

Share `/token/[address]` — shows coverage status as embeddable frame.

### Subgraph

Fast queries via The Graph — indexes all events.

### MCP Server

AI agents can check and interact via MCP tools.

---

## Economics

### Example: $AGENT Token

- Monthly volume: $100,000
- Trading fees (1%): $1,000/month
- Sunset share (10%): $100/month
- After 6 months: $600 in coverage pool

If $AGENT sunsets, holders split $600 pro-rata based on holdings.

---

## Roadmap

| Phase | Status | Deliverable |
|-------|--------|-------------|
| 1 | ✅ Done | Core contracts deployed (Sepolia) |
| 2 | ✅ Done | Security features (pause, timelock) |
| 3 | ✅ Done | REST API + Frontend + Calculator |
| 4 | ✅ Done | SDK + Subgraph + MCP server |
| 5 | ✅ Done | Documentation + proposals |
| 6 | 🔄 Now | Audit + mainnet deployment |
| 7 | Next | Clanker/Bankr integration |

---

## Ask

1. **Technical call** to discuss integration approach
2. **Testnet pilot** with 5-10 tokens
3. **Co-announcement** when ready for mainnet

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

Sunset Protocol turns bad failures into good failures. This isn't about preventing failure — it's about making failure sustainable.

The ecosystems that figure this out will win long-term.

---

*Built by Clawdia 🐚 — graceful exits for the agent economy.*
