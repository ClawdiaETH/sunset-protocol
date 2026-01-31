# Sunset Protocol: MVP Improvements

Focus: Ship fast, iterate later. No budget required.

---

## 1. Security (Free)

### Already Fixed ✅
- Splitter authorization in registry
- ReentrancyGuard on claim()
- View functions for frontend

### Add Before Mainnet

**Multi-sig admin**
- Use a Gnosis Safe instead of single EOA
- Free to deploy
- 2-of-3 minimum (you + 2 trusted people)
- Protects against key compromise

**Timelock on critical functions**
- Add 24hr delay on:
  - setSunsetBps() changes
  - Admin transfers
- Use OpenZeppelin's TimelockController (free)

**Emergency pause**
```solidity
bool public paused;

modifier whenNotPaused() {
    require(!paused, "paused");
    _;
}

function setPaused(bool _paused) external onlyAdmin {
    paused = _paused;
}
```

---

## 2. Make It More Attractive to Projects

### Trust Signals (Free)
- **Immutable splitter** - Once deployed, fee split can't be lowered (already true)
- **Public coverage stats** - Show total ETH protected on landing page
- **Verified contracts** - Verify on Basescan immediately after deploy

### Better UX
- **One-click registration** - Current flow is good
- **Coverage calculator** - "If your token does $X volume, you'll have $Y coverage"
- **Sunset simulator** - Show what holders would get at current coverage

### Social Proof
- **First 10 projects free Premium tier** - Bootstrap with quality projects
- **Coverage badges** - Shareable "Protected by Sunset" image for socials
- **Leaderboard** - Top covered projects on homepage

---

## 3. Make It More Lucrative

### Fee Optimization
Current tiers are fine for MVP. Future consideration:

| Tier | Fee | Multiplier | Target |
|------|-----|------------|--------|
| Basic | 5% | 1x | Testing the waters |
| Standard | 10% | 1.5x | Most projects |
| Premium | 15% | 2x | Serious projects |
| Ultra | 20% | 3x | Add post-launch for whales |

### Yield on Idle Funds (Post-MVP)
- Deposit coverage pools to Aave/Compound
- 3-5% APY on idle ETH
- Adds value without extra fees

### Protocol Revenue (Post-MVP)
- Take small cut (1-2%) of coverage pool on sunset
- Or flat registration fee (0.01 ETH)
- Funds development without VC

---

## 4. AI Agent Integration (Differentiator)

### Why This Matters
- AI agent tokens are the primary Clanker use case
- Agents can programmatically register and monitor
- First-mover advantage in "agent insurance"

### Quick Wins

**Simple API/SDK**
```javascript
// sunset-sdk (build this)
import { SunsetSDK } from '@sunset-protocol/sdk';

const sunset = new SunsetSDK({
  rpcUrl: 'https://base.llamarpc.com'
});

// Check coverage
const coverage = await sunset.getCoverage(tokenAddress);

// Register (requires signer)
const tx = await sunset.register(tokenAddress, 2); // tier 2
```

**Bankr Integration Proposal**
Reach out to Bankr team with:
- `@bankrbot sunset register [tier]` - Register token
- `@bankrbot sunset status` - Check coverage
- `@bankrbot sunset claim` - Claim (for holders)

**Farcaster Frame**
- "Check your coverage" frame
- "Register for Sunset" frame
- Free viral distribution

---

## 5. Technical Quick Wins

### Subgraph (Free via The Graph hosted service)
Index all events for fast frontend queries:
- ProjectRegistered
- DepositRecorded
- SunsetTriggered
- Claimed

### Better Events
Add indexed params for filtering:
```solidity
event ProjectRegistered(
    address indexed token,
    address indexed splitter,
    address indexed owner,
    uint256 tier
);
```

### Gas Optimization
- Use uint128 for amounts (unlikely to exceed)
- Pack structs to save storage slots
- Batch operations where possible

---

## 6. Growth Strategy (Zero Budget)

### Launch Checklist
- [ ] Verify contracts on Basescan
- [ ] Post in /base and /clanker Farcaster channels
- [ ] DM top Clanker token creators
- [ ] Create "Why Sunset?" thread on X
- [ ] Submit to DeFi directories (DeFiLlama, etc)

### Partnerships (Free)
- **Clanker/Clawnch** - Native integration (proposal already written)
- **Bankr** - Bot commands
- **Base ecosystem** - Get on their radar

---

## Content
- "How to protect your token holders" guide
- Comparison with rug pulls (fear sells)
- Case study when first sunset happens

---

## 7. Roadmap

### Week 1 (Now)
- [x] Fix critical bugs
- [ ] Deploy to Base Sepolia
- [ ] Test full flow
- [ ] Deploy to Base mainnet
- [ ] Verify contracts

### Week 2-4
- [ ] Register first 5 projects (manually recruit)
- [ ] Build subgraph
- [ ] Farcaster frame
- [ ] Coverage calculator on site

### Month 2
- [ ] Bankr integration
- [ ] SDK release
- [ ] First sunset event (proof it works)

### Month 3+
- [ ] Multi-sig migration
- [ ] Timelock implementation
- [ ] Yield strategy
- [ ] Multi-chain (Arbitrum, Solana)

---

## 8. Competitive Advantage

You're not competing with Nexus Mutual ($230M TVL). You're the only protocol built specifically for:

1. **Agent tokens** - Native to Clanker ecosystem
2. **Fair launch protection** - Not insurance, coverage from fees
3. **Social-first** - Built for Farcaster/X native projects
4. **Zero upfront cost** - Coverage comes from trading fees

This is a new category. Own it.

---

## Key Metrics to Track

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Registered tokens | 10 | 100 |
| Total coverage (ETH) | 5 ETH | 50 ETH |
| First sunset claim | - | ✅ |
| Bankr integration | - | ✅ |

---

*Ship it. Iterate. Don't overthink.*
