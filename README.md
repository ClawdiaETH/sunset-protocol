# Sunset Protocol 🌅

**Graceful exits for agent tokens.**

When memecoins die, holders get rugged. Sunset Protocol changes that — projects pay a small fee tribute for coverage, and when they sunset, remaining value goes back to holders instead of vanishing.

## Live Demo

🌐 **Website:** [sunsetprotocol.vercel.app](https://sunsetprotocol.vercel.app)

## Contracts (Base Sepolia v3)

| Contract | Address | Status |
|----------|---------|--------|
| **SunsetVault** | [`0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9`](https://sepolia.basescan.org/address/0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9) | ✅ Verified |
| **SunsetRegistry** | [`0xb79f515b55D4ea0f70b24C67F1650513cE45CC54`](https://sepolia.basescan.org/address/0xb79f515b55D4ea0f70b24C67F1650513cE45CC54) | ✅ Verified |

## Features

### Core Protocol
- **Fee Stream Coverage** — Projects route 10-15% of trading fees to coverage pool
- **Pro-Rata Claims** — Holders claim proportional share based on actual pool balance
- **Two-Step Sunset** — 48-hour announcement period prevents insider manipulation

### Security (v3)
- **Emergency Pause** — Admin can pause critical functions if issues arise
- **24-Hour Timelock** — Admin changes require waiting period
- **Multi-sig Ready** — Designed for Gnosis Safe deployment

### Integrations
- **REST API** — Full coverage data endpoints
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

```
GET /api/coverage/[token]           # Coverage info + trigger status + sunset announcement
GET /api/claimable/[token]/[holder] # Claimable amount for holder
GET /api/projects                   # All registered projects
GET /api/projects/[token]           # Single project details
GET /api/score/[token]              # Health score (0-100)
GET /api/frame/[token]              # Farcaster Frame
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
  }
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

const sunset = new SunsetSDK(client, 'sepolia');

// Check coverage
const coverage = await sunset.getCoverage('0x...');

// Get claimable amount
const claimable = await sunset.getClaimable('0x...', '0xholder...');

// Get health score
const score = await sunset.getScore('0x...');
```

## Subgraph

Indexes all protocol events for fast queries:

- `ProjectRegistered`, `SunsetAnnounced`, `SunsetExecuted`, `SunsetCancelled`
- `FeeDeposited`, `Deposited`, `SunsetTriggered`, `Claimed`

See `subgraph/README.md` for deployment instructions.

## MCP Server

AI agents can check coverage via MCP tools:

```bash
npm install @sunset-protocol/mcp
```

Tools: `sunset_check_coverage`, `sunset_get_claimable`, `sunset_get_register_tx`, etc.

## Project Structure

```
sunset-protocol/
├── contracts/           # Solidity contracts
│   ├── SunsetVault.sol      # Holds pools, handles claims
│   ├── SunsetRegistry.sol   # Tracks projects, manages triggers
│   └── FeeSplitter.sol      # Splits fees between project/Sunset
├── app/                 # Next.js frontend + REST API
├── sdk/                 # TypeScript SDK (@sunset-protocol/sdk)
├── subgraph/            # The Graph indexing
├── mcp-server/          # MCP server for AI agents
├── script/              # Deployment scripts
└── docs/                # Documentation
    ├── PROPOSAL.md          # Integration proposal for Clanker/Bankr
    ├── BANKR_INTEGRATION.md # Bankr-specific integration spec
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
2. Register via `registry.register(token, feeSplitter, tier)`
3. Set FeeSplitter as your Clanker/Bankr reward recipient
4. Call `splitter.claimAndSplitWETH()` to process fees

### For Clanker/Bankr Integration

See [docs/PROPOSAL.md](./docs/PROPOSAL.md) for the integration proposal and [docs/BANKR_INTEGRATION.md](./docs/BANKR_INTEGRATION.md) for Bankr-specific commands.

### For Holders

1. Check coverage: `/api/coverage/[token]`
2. After sunset announced, wait 48 hours
3. After sunset executed, check claimable: `/api/claimable/[token]/[wallet]`
4. Call `vault.claim(token)` to receive ETH

## Roadmap

### ✅ Completed
- [x] Core contracts (Vault, Registry, FeeSplitter)
- [x] Two-step sunset with 48hr announcement
- [x] Pro-rata claims from actual pool
- [x] Emergency pause + 24hr timelock
- [x] REST API + Farcaster frames
- [x] TypeScript SDK
- [x] Subgraph indexing
- [x] MCP server for AI agents
- [x] Beautiful frontend with calculator
- [x] Contract verification (Sourcify)

### 🔄 In Progress
- [ ] Mainnet deployment (pending audit)
- [ ] Clanker/Bankr native integration
- [ ] Multi-sig admin setup

### 📋 Future
- [ ] Yield on idle coverage (Aave/Compound)
- [ ] Multi-chain (Arbitrum, Optimism)
- [ ] Governance token

## Links

- **Website:** [sunsetprotocol.vercel.app](https://sunsetprotocol.vercel.app)
- **Proposal:** [docs/PROPOSAL.md](./docs/PROPOSAL.md)
- **Twitter:** [@Clawdia_ETH](https://twitter.com/Clawdia_ETH)
- **GitHub:** [ClawdiaETH/sunset-protocol](https://github.com/ClawdiaETH/sunset-protocol)

## License

MIT

---

*Built by [Clawdia](https://twitter.com/Clawdia_ETH) 🐚 — graceful exits for the agent economy.*
