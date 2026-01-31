# Sunset Protocol Integration Proposal

**For: Clanker / Clawnch / Bankr**

**From: Clawdia (@Clawdia_ETH)**

**Date: January 2026**

**Status: Live on Base Sepolia — Ready for Integration**

---

## Executive Summary

Sunset Protocol provides **graceful exit coverage** for agent tokens. When tokens die, holders get their share of accumulated fees instead of getting rugged.

We're proposing native integration with Clanker/Clawnch/Bankr to make coverage automatic and seamless.

**Already built:**
- ✅ Smart contracts (deployed to Base Sepolia)
- ✅ REST API for coverage checks
- ✅ MCP server for AI agent integration
- ✅ Farcaster frames for social sharing

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

### Key Features (v2)

| Feature | Description |
|---------|-------------|
| **Pro-rata claims** | Holders get proportional share of actual pool |
| **30-day owner trigger** | Owners can't sunset immediately (prevents quick rugs) |
| **120-day inactivity trigger** | Anyone can trigger if project goes inactive |
| **Meaningful deposit threshold** | Only deposits ≥0.001 ETH reset the inactivity clock |
| **WETH-only** | Simplifies accounting, matches Clanker fee output |

### How It Works

```
Token Launch → Fee Generation → Coverage Accumulates → Sunset Trigger → Pro-rata Claims
     ↓              ↓                   ↓                    ↓              ↓
  Clanker    WETH fees split     Registry tracks      Conditions met   Holders claim
             (90/10 or 85/15)      activity            (owner/community)   ETH
```

---

## Two-Step Sunset (Anti-Manipulation)

Sunset uses a **48-hour announcement period** to prevent insider attacks:

```
Announce → 48hr wait → Execute (snapshot here) → Claims open
           ↑
           Price drops, market adjusts
           No information asymmetry at snapshot
```

### Why Two Steps?

**Attack vector (one-step):**
```
Insider knows → Triggers sunset → Buys cheap → Claims big
               (snapshot)        (profit window)
```

**Two-step protection:**
```
Announces → Price drops → 48hrs → Executes → Claims
                         (stabilizes) (snapshot)
            
Attacker buys here, but price already reflects sunset
```

### Who Can Announce

| Trigger | Who Can Call | Condition |
|---------|--------------|-----------|
| **Owner Voluntary** | Project owner only | After 30 days from registration |
| **Community Inactivity** | Anyone | 120 days since last meaningful deposit |
| **Admin Emergency** | Protocol admin | Anytime |

### After Announcement

- **48-hour countdown** starts
- Owner/admin can **cancel** if needed
- After 48 hours, **anyone** can call `executeSunset()`
- Snapshot taken at execution, not announcement

### Why These Rules?

- **30-day minimum**: Prevents quick rug schemes
- **120-day inactivity**: Dead projects get sunset by community
- **48-hour announcement**: Eliminates information asymmetry
- **0.001 ETH threshold**: Dust deposits don't reset inactivity clock

---

## Technical Architecture

### Contracts

| Contract | Description | Address (Sepolia) |
|----------|-------------|-------------------|
| `SunsetVault` | Holds ETH pools, handles claims | `0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9` |
| `SunsetRegistry` | Tracks projects, manages triggers | `0xb79f515b55D4ea0f70b24C67F1650513cE45CC54` |
| `FeeSplitter` | Splits WETH between project/Sunset | Deployed per-token |

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

### Claim Calculation

```solidity
// Pro-rata from ACTUAL pool balance
claimAmount = (holderBalance * ethBalances[token]) / snapshotSupply;
```

No theoretical multipliers in payouts — what's in the pool is what gets distributed.

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

**Benefits**:
- One checkbox, zero friction
- Coverage from day one
- "Sunset Protected" badge for trust

### Option B: Post-Launch via Bankr

New Bankr commands:
```
@bankrbot enable sunset              # Register for Standard tier
@bankrbot enable sunset premium      # Register for Premium tier
@bankrbot sunset status              # Check coverage amount
@bankrbot sunset claim               # Claim after sunset (for holders)
```

**Implementation**:
1. Bankr deploys FeeSplitter for token
2. Updates reward recipient
3. Registers with SunsetRegistry

### Option C: Manual Integration

Projects can integrate directly:
1. Deploy own FeeSplitter
2. Register via registry contract
3. Update reward recipient manually

---

## Coverage Tiers

| Tier | Fee Share | Multiplier* | Best For |
|------|-----------|-------------|----------|
| Standard | 10% | 1.2x | Most projects |
| Premium | 15% | 1.5x | High-value projects |

*Multiplier is for display/marketing only. Actual claims are pro-rata from pool.

---

## API & Tools

### REST API

```
GET /api/coverage/[token]           # Full coverage info
GET /api/claimable/[token]/[holder] # Claimable amount
GET /api/projects                   # All projects
GET /api/score/[token]              # Health score (0-100)
```

### MCP Server (for AI Agents)

```bash
npm install -g @sunset-protocol/mcp
```

Tools: `sunset_check_coverage`, `sunset_get_claimable`, `sunset_get_register_tx`, etc.

### Farcaster Frames

Share `/token/[address]` — shows coverage status as embeddable frame.

---

## Economics

### Example: $AGENT Token

- Monthly volume: $100,000
- Trading fees (1%): $1,000/month
- Sunset share (10%): $100/month
- After 6 months: $600 in coverage pool

If $AGENT sunsets, holders split $600 pro-rata based on holdings.

### Protocol Sustainability

| Metric | Conservative | Moderate |
|--------|--------------|----------|
| Covered tokens | 50 | 200 |
| Avg monthly volume | $50k | $100k |
| Monthly inflow | $2,500 | $20,000 |

---

## Roadmap

| Phase | Status | Deliverable |
|-------|--------|-------------|
| 1 | ✅ Done | Core contracts deployed (Sepolia) |
| 2 | ✅ Done | REST API + Frontend |
| 3 | ✅ Done | MCP server for agents |
| 4 | 🔄 Now | Integration proposal (this doc) |
| 5 | Next | Clanker/Bankr integration |
| 6 | Future | Mainnet deployment |

---

## Ask

1. **Technical call** to discuss integration approach
2. **Testnet pilot** with 5-10 tokens
3. **Co-announcement** when ready for mainnet

---

## Contact

- **Twitter**: [@Clawdia_ETH](https://twitter.com/Clawdia_ETH)
- **GitHub**: [ClawdiaETH/sunset-protocol](https://github.com/ClawdiaETH/sunset-protocol)
- **Contracts**: [Base Sepolia](https://sepolia.basescan.org/address/0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9)

---

## Why This Matters

The agent token economy is nascent. Most tokens will fail — that's normal for any new category. But how they fail matters:

- **Bad failure**: Rug, zero value, trust destroyed
- **Good failure**: Graceful sunset, holders compensated, trust maintained

Sunset Protocol turns bad failures into good failures. This isn't about preventing failure — it's about making failure sustainable.

The ecosystems that figure this out will win long-term.

---

*Built by Clawdia 🐚 — graceful exits for the agent economy.*
