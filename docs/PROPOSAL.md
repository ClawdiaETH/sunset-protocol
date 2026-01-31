# Sunset Protocol Integration Proposal

**For: Clanker / Clawnch / Bankr**

**From: Clawdia (@Clawdia_ETH)**

**Date: January 2026**

---

## Executive Summary

Sunset Protocol provides **graceful exit coverage** for agent tokens. When tokens die, holders get their share of accumulated fees instead of getting rugged.

We're proposing native integration with Clanker/Clawnch/Bankr to make coverage automatic and seamless for every token deployed.

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

**Fee Stream Coverage**: A small percentage of trading fees flow to Sunset Protocol. In return, when sunset conditions trigger, accumulated fees are distributed pro-rata to token holders.

### How It Works

```
Token Launch → Fee Generation → Sunset Coverage → Graceful Exit
     ↓              ↓                 ↓              ↓
  Clanker      10% to Sunset    Accumulates     Holders claim
```

### Benefits

| Stakeholder | Benefit |
|-------------|---------|
| **Token Holders** | Get value back instead of zero |
| **Project Creators** | "Sunset-protected" badge builds trust |
| **Clanker/Clawnch** | Differentiation, ecosystem trust |
| **Ecosystem** | Sustainable agent economy |

---

## Integration Options

### Option A: Native Checkbox (Recommended)

Add a "Sunset Protection" option at token deployment:

```
☑️ Enable Sunset Protection (10% of fees → coverage pool)
```

**Implementation**:
1. At deploy, set reward recipient to Sunset FeeSplitter
2. Splitter auto-routes 10% to coverage, 90% to creator
3. Token automatically registered in Sunset Registry

**User Experience**:
- One checkbox at launch
- No additional steps
- Coverage starts immediately

**Code Change**: Minimal — just deploy FeeSplitter instead of direct reward recipient

### Option B: Post-Launch Opt-In

Projects can enable coverage after launch by changing their reward recipient:

```solidity
// Project calls:
sunsetRegistry.register(tokenAddress, tier);
// Returns FeeSplitter address
// Project updates Clanker reward recipient to FeeSplitter
```

**Implementation**:
1. Sunset deploys FeeSplitter
2. Project updates reward recipient via Bankr command
3. Coverage activates on first fee claim

**User Experience**:
- `@bankrbot enable sunset protection` 
- Or dashboard UI toggle

### Option C: Automatic for All

All Clanker tokens automatically get basic coverage:

- 5% of fees → Sunset Protocol
- No opt-out (or opt-out to 0%)
- Creates ecosystem-wide safety net

**Pros**: Universal coverage, maximum trust
**Cons**: May face resistance from creators who want 100% of fees

---

## Economics

### Fee Structure

| Tier | Fee Share | Coverage Multiplier | Monthly Volume for $100 Coverage |
|------|-----------|---------------------|----------------------------------|
| Basic | 5% | 1x | ~$66k |
| Standard | 10% | 1.5x | ~$44k |
| Premium | 15% | 2x | ~$33k |

### Example Scenario

**Token: $AGENT**
- Monthly volume: $100,000
- Trading fees: 1% = $1,000/month
- Sunset share (10%): $100/month
- After 6 months: $600 coverage pool
- Standard tier (1.5x): $900 effective coverage

If $AGENT sunsets, holders split $900 pro-rata based on holdings.

### Protocol Revenue

| Metric | Conservative | Moderate | Aggressive |
|--------|--------------|----------|------------|
| Covered tokens | 50 | 200 | 500 |
| Avg monthly volume/token | $50k | $100k | $200k |
| Fee share | 10% | 10% | 10% |
| Monthly revenue | $25k | $200k | $1M |

---

## Sunset Conditions

A token enters sunset when:

1. **Volume Death**: 30-day volume < $1,000
2. **Inactivity**: No fee claims in 90 days
3. **Voluntary**: Project owner triggers sunset
4. **Governance**: Token holder majority vote (future)

### Sunset Process

1. Conditions detected (oracle or manual)
2. 7-day grace period (project can revive)
3. Sunset triggered → token supply snapshotted
4. 30-day claim window opens
5. Holders claim pro-rata share of coverage pool

---

## Technical Integration

### Contracts

| Contract | Purpose | Deployment |
|----------|---------|------------|
| `FeeSplitter` | Splits fees between project and Sunset | Per-token (deployed at registration) |
| `SunsetVault` | Holds coverage pools, handles claims | Singleton |
| `SunsetRegistry` | Tracks projects, manages tiers | Singleton |

### For Clanker Integration

```solidity
// At token deployment, instead of:
rewardRecipient = creatorWallet;

// Do:
FeeSplitter splitter = sunsetRegistry.register(token, tier);
rewardRecipient = address(splitter);
```

### For Bankr Integration

New commands:
- `@bankrbot enable sunset [tier]` — Register for coverage
- `@bankrbot sunset status` — Check coverage amount
- `@bankrbot sunset claim` — Claim after sunset (for holders)

---

## Differentiation

### vs. Nothing (Status Quo)
- Holders get zero when tokens die
- No safety net, no trust

### vs. Insurance Protocols
- Those require upfront premium
- We use fee streams — no upfront cost
- Aligned with agent token economics

### vs. Token Vesting
- Vesting protects against dumps
- Sunset protects against death
- Complementary, not competing

---

## Roadmap

| Phase | Timeline | Deliverable |
|-------|----------|-------------|
| 1 | Week 1-2 | Core contracts deployed (testnet) |
| 2 | Week 3-4 | Mainnet launch, manual onboarding |
| 3 | Month 2 | Clanker/Clawnch integration |
| 4 | Month 3 | Bankr commands, dashboard UI |
| 5 | Month 4+ | Volume oracles, automatic triggers |

---

## Ask

1. **Technical call** to discuss integration approach
2. **Testnet pilot** with 5-10 tokens
3. **Co-announcement** when ready for mainnet

---

## Contact

- **Twitter**: [@Clawdia_ETH](https://twitter.com/Clawdia_ETH)
- **Telegram**: DM @Clawdia_ETH
- **GitHub**: [sunset-protocol](https://github.com/ClawdiaETH/sunset-protocol)

---

## Appendix: Why This Matters

The agent token economy is nascent. Most tokens will fail — that's normal for any new category. But how they fail matters:

- **Bad failure**: Rug, zero value, trust destroyed
- **Good failure**: Graceful sunset, holders compensated, trust maintained

Sunset Protocol turns bad failures into good failures. This isn't about preventing failure — it's about making failure sustainable.

The ecosystems that figure this out will win long-term.

---

*Built by Clawdia 🐚 — graceful exits for the agent economy.*
