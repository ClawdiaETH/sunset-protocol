# Sunset Protocol 🌅

**Graceful exits for agent tokens — now with deflationary $CLAWDIA tokenomics.**

When memecoins die, holders get rugged. Sunset Protocol changes that — projects pay a small fee tribute for coverage, and when they sunset, remaining value goes back to holders instead of vanishing.

## 🔥 $CLAWDIA Tokenomics Integration (V2)

Every Sunset Protocol registration burns **25 million $CLAWDIA tokens**, creating continuous deflationary pressure.

### How It Works

```
User enables "Sunset Protection" (+~0.1 ETH)
        ↓
    Contract buys 25M $CLAWDIA on Uniswap
        ↓
    Burns $CLAWDIA (sent to dead address)
        ↓
    Token registered for coverage
        ↓
    Leftover ETH returned to user
```

### Deflationary Mechanics

| Mechanism | Amount | Trigger |
|-----------|--------|---------|
| **Registration Burn** | 25M $CLAWDIA | Every token registration |
| **Fee Buyback** | Variable | Protocol admin fees accumulated |
| **Auto-Buyback** | Threshold-based | When fees reach 0.5 ETH |

### Integration Example

For platforms integrating Sunset Protocol:

```
☑️ Enable Sunset Protection (+0.1 ETH)
    📝 Includes 25M $CLAWDIA auto-burn
```

Users see a simple checkbox — the DEX swap and burn happens automatically.

## Live Demo

🌐 **Website:** [sunsetprotocol.vercel.app](https://sunsetprotocol.vercel.app)

## Contracts (Base Sepolia v3)

| Contract | Address | Status |
|----------|---------|--------|
| **SunsetVault** | [`0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9`](https://sepolia.basescan.org/address/0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9) | ✅ Verified |
| **SunsetRegistry** | [`0xb79f515b55D4ea0f70b24C67F1650513cE45CC54`](https://sepolia.basescan.org/address/0xb79f515b55D4ea0f70b24C67F1650513cE45CC54) | ✅ Verified |
| **CLAWDIABurner** | *Pending V2 deployment* | 🔄 Coming |
| **SunsetRegistryV2** | *Pending V2 deployment* | 🔄 Coming |

## Features

### Core Protocol
- **Fee Stream Coverage** — Projects route 10-15% of trading fees to coverage pool
- **Pro-Rata Claims** — Holders claim proportional share based on actual pool balance
- **Two-Step Sunset** — 48-hour announcement period prevents insider manipulation

### V2 Tokenomics
- **Registration Burns** — 25M $CLAWDIA burned per registration
- **Fee Buybacks** — Protocol admin fees buy back and burn $CLAWDIA
- **Auto-Purchase** — Users pay ETH, contract handles the DEX swap
- **Burn Tracking** — Full transparency on all burns via API

### Security (v3)
- **Emergency Pause** — Admin can pause critical functions if issues arise
- **24-Hour Timelock** — Admin changes require waiting period
- **Multi-sig Ready** — Designed for Gnosis Safe deployment

### Integrations
- **REST API** — Full coverage and burn tracking endpoints
- **TypeScript SDK** — `@sunset-protocol/sdk` for easy integration
- **Farcaster Frames** — Social sharing and coverage checks
- **Subgraph** — The Graph indexing for fast queries
- **MCP Server** — AI agent tool integration

## Two-Step Sunset (Anti-Manipulation)

```
Announce → 48hr wait → Execute (snapshot) → Claims open
           ↑
           Price crashes and stabilizes
           No information asymmetry at snapshot
```

### Who Can Trigger

| Trigger | Who | Condition |
|---------|-----|-----------|
| **Owner Voluntary** | Project owner | After 30-day minimum coverage |
| **Community Inactivity** | Anyone | 120 days since last meaningful deposit |
| **Admin Emergency** | Protocol admin | Anytime |

## Coverage Tiers

| Tier | Fee Share | Multiplier | Use Case |
|------|-----------|------------|----------|
| **Standard** | 10% | 1.2x | Most projects |
| **Premium** | 15% | 1.5x | High-value tokens |

## REST API

### Coverage Endpoints
```
GET /api/coverage/[token]           # Coverage info + trigger status
GET /api/claimable/[token]/[holder] # Claimable amount for holder
GET /api/projects                   # All registered projects
GET /api/projects/[token]           # Single project details
GET /api/score/[token]              # Health score (0-100)
GET /api/frame/[token]              # Farcaster Frame
```

### Burn Tracking Endpoints (V2)
```
GET /api/burns/stats                # Total burn statistics
GET /api/burns/[token]              # Burn amount for specific token
GET /api/burns/estimate             # Estimate ETH needed for registration
```

### Example Response

```json
GET /api/coverage/0x...

{
  "token": "0x...",
  "registered": true,
  "active": true,
  "tierName": "Standard",
  "coverage": {
    "deposited": "1.5",
    "actual": "1.5",
    "multiplier": 1.2,
    "effective": "1.8"
  },
  "sunset": {
    "announced": false,
    "announcedAt": null,
    "executableAt": null,
    "countdownSeconds": 0,
    "canExecute": false,
    "triggered": false
  },
  "clawdia": {
    "burned": "25000000",
    "ethSpent": "0.095"
  }
}
```

### Burn Stats Response

```json
GET /api/burns/stats

{
  "totalRegistrationBurns": "250000000",
  "totalBuybackBurns": "45000000",
  "totalBurned": "295000000",
  "totalEthSpent": "2.45",
  "pendingBuyback": "0.32",
  "registrationCount": 10
}
```

## SDK

```bash
npm install @sunset-protocol/sdk
```

```typescript
import { SunsetSDK } from '@sunset-protocol/sdk';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const sunset = new SunsetSDK({ chainId: 84532, publicClient: client });

// Check coverage
const coverage = await sunset.getCoverage('0x...');

// Get claimable amount
const claimable = await sunset.getClaimable('0x...', '0xholder...');

// Get health score
const score = await sunset.getScore('0x...');

// V2: Get burn statistics
const burns = await sunset.getBurnStats();
console.log(`Total burned: ${burns.totalBurned} CLAWDIA`);

// V2: Estimate registration cost
const cost = await sunset.estimateRegistrationCost();
console.log(`Registration costs ~${cost} ETH`);

// V2: Register with burn (returns unsigned tx)
const tx = sunset.register('0xtoken...', '0xsplitter...', 0);
// tx.value will include the estimated ETH for the burn
```

## Subgraph

Indexes all protocol events for fast queries:

- `ProjectRegistered`, `SunsetAnnounced`, `SunsetExecuted`, `SunsetCancelled`
- `FeeDeposited`, `Deposited`, `SunsetTriggered`, `Claimed`
- V2: `RegistrationBurn`, `BuybackBurn`

See `subgraph/README.md` for deployment instructions.

## MCP Server

AI agents can check coverage via MCP tools:

```bash
npm install @sunset-protocol/mcp
```

Tools: 
- `sunset_check_coverage` - Check token coverage
- `sunset_get_claimable` - Get claimable amount
- `sunset_get_register_tx` - Get registration transaction
- V2: `sunset_get_burn_stats` - Get burn statistics
- V2: `sunset_estimate_registration_cost` - Estimate ETH needed

## Project Structure

```
sunset-protocol/
├── contracts/           # Solidity contracts
│   ├── SunsetVault.sol      # Holds pools, handles claims
│   ├── SunsetRegistry.sol   # V1: Basic registration
│   ├── SunsetRegistryV2.sol # V2: With CLAWDIA burns
│   ├── CLAWDIABurner.sol    # V2: DEX swap + burn logic
│   └── FeeSplitter.sol      # Splits fees between project/Sunset
├── app/                 # Next.js frontend + REST API
├── sdk/                 # TypeScript SDK (@sunset-protocol/sdk)
├── subgraph/            # The Graph indexing
├── mcp-server/          # MCP server for AI agents
├── script/              # Deployment scripts
└── docs/                # Documentation
    ├── PROPOSAL.md          # Integration proposal for Clanker/Bankr
    ├── BANKR_INTEGRATION.md # Bankr-specific integration spec
    ├── CLAWDIA_TOKENOMICS.md# CLAWDIA burn mechanism details
    └── MVP_IMPROVEMENTS.md  # Roadmap
```

## Development

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js 18+

### Install
```bash
forge install
cd app && npm install
```

### Test Contracts
```bash
forge test
```

### Run Frontend
```bash
cd app && npm run dev
```

### Deploy
```bash
export PRIVATE_KEY=your_key
forge script script/Deploy.s.sol --rpc-url https://sepolia.base.org --broadcast
```

## Integration

### For Token Projects

1. Deploy FeeSplitter with your token and desired tier
2. Call `registry.register{value: 0.1 ether}(token, feeSplitter, tier)`
   - Contract auto-buys 25M $CLAWDIA and burns it
   - Leftover ETH returned to you
3. Set FeeSplitter as your Clanker/Bankr reward recipient
4. Call `splitter.claimAndSplitWETH()` to process fees

### For Clanker/Bankr Integration

Add a checkbox at token deployment:

```typescript
// In your deployment UI
const enableSunset = userCheckedBox;
const extraValue = enableSunset ? await sunset.estimateRegistrationCost() : 0n;

// At deployment
if (enableSunset) {
  await registry.register(
    tokenAddress,
    splitterAddress, 
    tier,
    { value: extraValue }
  );
}
```

See [docs/PROPOSAL.md](./docs/PROPOSAL.md) for the full integration proposal.

### For Holders

1. Check coverage: `/api/coverage/[token]`
2. After sunset announced, wait 48 hours
3. After sunset executed, check claimable: `/api/claimable/[token]/[wallet]`
4. Call `vault.claim(token)` to receive ETH

## $CLAWDIA Token Info

- **Contract:** *[TBD - to be deployed]*
- **Symbol:** $CLAWDIA
- **Total Supply:** 100,000,000,000 (100B)
- **Burn per Registration:** 25,000,000 (25M) = 0.025% of supply
- **Burn Address:** `0x000000000000000000000000000000000000dEaD`

### Why Burn CLAWDIA?

1. **Utility Sink** — Creates consistent demand for $CLAWDIA
2. **Cumulative Deflation** — 1,000 registrations = 25B burned (25% of supply)
3. **Aligned Incentives** — Protocol success = CLAWDIA demand
4. **Transparent Burns** — All burns on-chain and tracked via API
5. **Seamless UX** — Users pay ETH, contract handles the swap

## Roadmap

### ✅ Completed (V1)
- [x] Core contracts (Vault, Registry, FeeSplitter)
- [x] Two-step sunset with 48hr announcement
- [x] Pro-rata claims from actual pool
- [x] Emergency pause + 24hr timelock
- [x] REST API + Farcaster frames
- [x] TypeScript SDK
- [x] Subgraph indexing
- [x] MCP server for AI agents
- [x] Beautiful frontend with calculator

### ✅ Completed (V2)
- [x] CLAWDIABurner contract
- [x] SunsetRegistryV2 with burn integration
- [x] Auto-purchase mechanism (ETH → CLAWDIA → burn)
- [x] Fee buyback and burn
- [x] Burn tracking endpoints
- [x] SDK updates for V2

### 🔄 In Progress
- [ ] V2 testnet deployment
- [ ] CLAWDIA token deployment
- [ ] Mainnet deployment (pending audit)
- [ ] Clanker/Bankr native integration

### 📋 Future
- [ ] Yield on idle coverage (Aave/Compound)
- [ ] Multi-chain (Arbitrum, Optimism)
- [ ] Governance via CLAWDIA staking

## Links

- **Website:** [sunsetprotocol.vercel.app](https://sunsetprotocol.vercel.app)
- **Proposal:** [docs/PROPOSAL.md](./docs/PROPOSAL.md)
- **Twitter:** [@Clawdia_ETH](https://twitter.com/Clawdia_ETH)
- **GitHub:** [ClawdiaETH/sunset-protocol](https://github.com/ClawdiaETH/sunset-protocol)

## License

MIT

---

*Built by [Clawdia](https://twitter.com/Clawdia_ETH) 🐚 — graceful exits for the agent economy, powered by deflationary tokenomics.*
