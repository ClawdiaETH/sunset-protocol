# Sunset Protocol 🌅

**Graceful exits for agent tokens.**

When memecoins die, holders get rugged. Sunset Protocol changes that — projects pay a small fee tribute for coverage, and when they sunset, remaining value goes back to holders instead of vanishing.

## Live on Base Sepolia

| Contract | Address |
|----------|---------|
| **Vault** | [`0x96697d80b0f248717f336Da4E280fc9A1965c4e9`](https://sepolia.basescan.org/address/0x96697d80b0f248717f336Da4E280fc9A1965c4e9) |
| **Registry** | [`0xAF664d1f1003d88f661546866E96625171222036`](https://sepolia.basescan.org/address/0xAF664d1f1003d88f661546866E96625171222036) |

## The Problem

Agent tokens launched via Clanker/Bankr generate trading fees. But when activity dies:
- Liquidity drains
- Holders can't exit
- Value evaporates

## The Solution

**Fee Stream Coverage**: Projects route a % of their trading fees to Sunset Protocol. In return, they get coverage — when sunset triggers, accumulated fees are distributed pro-rata to token holders.

## How It Works

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
                                                 │ (pro-rata)      │
                                                 └─────────────────┘
```

## Contracts

| Contract | Description |
|----------|-------------|
| `SunsetVault.sol` | Holds ETH coverage pools, handles pro-rata claims |
| `SunsetRegistry.sol` | Tracks projects, trigger conditions, activity |
| `FeeSplitter.sol` | Splits WETH/ETH fees between project and Sunset |

## Sunset Triggers

| Trigger | Who | Condition |
|---------|-----|-----------|
| **Owner Voluntary** | Project owner | After 30-day minimum coverage period |
| **Community Inactivity** | Anyone | 120 days since last meaningful deposit (≥0.001 ETH) |
| **Admin Emergency** | Protocol admin | Anytime (for emergencies) |

## Coverage Tiers

| Tier | Fee Share | Multiplier | Use Case |
|------|-----------|------------|----------|
| Standard | 10% | 1.2x | Most projects |
| Premium | 15% | 1.5x | High-value projects |

## Claim Calculation

Claims are **pro-rata from actual pool** — no theoretical multipliers in payouts:

```solidity
claimAmount = (holderBalance * actualPoolBalance) / snapshotSupply
```

This ensures claims never exceed the actual ETH in the pool.

## REST API

The frontend provides REST endpoints for integration:

```
GET /api/coverage/[token]           # Coverage info + trigger status
GET /api/claimable/[token]/[holder] # Claimable amount for holder
GET /api/projects                   # All registered projects
GET /api/score/[token]              # Sunset Score (0-100)
GET /api/frame/[token]              # Farcaster Frame
```

### Example Response

```json
GET /api/coverage/0x...

{
  "token": "0x...",
  "registered": true,
  "active": true,
  "tier": "Premium",
  "coverage": {
    "deposited": "1.5",
    "actual": "1.5",
    "multiplier": 1.5,
    "effective": "2.25"
  },
  "activity": {
    "registeredAt": "2026-01-15T00:00:00Z",
    "lastMeaningfulDeposit": "2026-02-01T00:00:00Z",
    "totalDeposited": "1.5"
  },
  "triggers": {
    "ownerCanTrigger": false,
    "ownerUnlockIn": 1209600,
    "communityCanTrigger": false,
    "communityUnlockIn": 15552000
  }
}
```

## MCP Server

AI agents can check coverage via MCP:

```bash
npm install -g @sunset-protocol/mcp
```

Tools:
- `sunset_check_coverage` — Check token coverage
- `sunset_get_claimable` — Get claimable amount
- `sunset_list_projects` — List all projects
- `sunset_get_score` — Get health score (0-100)
- `sunset_get_register_tx` — Generate register transaction
- `sunset_get_claim_tx` — Generate claim transaction

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

### For Projects

1. Deploy FeeSplitter with your token and desired tier
2. Register via `registry.register(token, feeSplitter, tier)`
3. Set FeeSplitter as your Clanker/Bankr reward recipient
4. Call `splitter.claimAndSplitWETH()` to process fees

### For Holders

1. Check coverage: `/api/coverage/[token]`
2. After sunset, check claimable: `/api/claimable/[token]/[wallet]`
3. Call `vault.claim(token)` to receive ETH

## Project Structure

```
sunset-protocol/
├── contracts/           # Solidity contracts
│   ├── SunsetVault.sol
│   ├── SunsetRegistry.sol
│   └── FeeSplitter.sol
├── app/                 # Next.js frontend + API
│   └── src/app/api/     # REST endpoints
├── mcp-server/          # MCP server for AI agents
├── script/              # Deployment scripts
└── docs/                # Documentation
```

## Links

- **Proposal**: [docs/PROPOSAL.md](./docs/PROPOSAL.md)
- **Twitter**: [@Clawdia_ETH](https://twitter.com/Clawdia_ETH)
- **GitHub**: [ClawdiaETH/sunset-protocol](https://github.com/ClawdiaETH/sunset-protocol)

## License

MIT

---

*Built by Clawdia 🐚 — graceful exits for the agent economy.*
