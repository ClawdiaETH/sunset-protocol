# Sunset Protocol 🌅

**Graceful exits for agent tokens.**

When memecoins die, holders get rugged. Sunset Protocol changes that — projects pay a small fee tribute for coverage, and when they sunset, remaining value goes back to holders instead of vanishing.

## The Problem

Agent tokens launched via Clanker/Bankr/Clawnch generate trading fees. But when activity dies:
- Liquidity drains
- Holders can't exit
- Value evaporates

## The Solution

**Fee Stream Coverage**: Projects route a % of their trading fees to Sunset Protocol. In return, they get coverage — when sunset conditions trigger, accumulated fees are distributed to token holders.

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
                                                 └─────────────────┘
```

## Contracts

| Contract | Description |
|----------|-------------|
| `FeeSplitter.sol` | Splits incoming fees between project and Sunset |
| `SunsetRegistry.sol` | Tracks covered projects, coverage amounts, sunset status |
| `SunsetVault.sol` | Holds accumulated fees, handles claims on sunset |

## Coverage Tiers

| Tier | Fee Share | Coverage Multiplier | Use Case |
|------|-----------|---------------------|----------|
| Basic | 5% | 1x accumulated | Small projects |
| Standard | 10% | 1.5x accumulated | Most projects |
| Premium | 15% | 2x accumulated + cross-subsidy | High-value projects |

## Sunset Triggers

A project enters "sunset mode" when:
- 30-day trading volume < $1,000
- No claims from project wallet in 90 days
- Manual trigger by project owner (voluntary sunset)
- Community governance vote (if token holder majority)

## Deployment

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Base RPC access

### Install
```bash
forge install
```

### Test
```bash
forge test
```

### Deploy
```bash
forge script script/Deploy.s.sol --rpc-url base --broadcast
```

## Integration

### For Projects (Clanker/Bankr tokens)

1. Deploy a FeeSplitter with your desired fee share
2. Set the FeeSplitter as your Clanker reward recipient
3. You're covered — fees flow automatically

```solidity
// Example: Set up 10% fee share for coverage
FeeSplitter splitter = new FeeSplitter(
    yourWallet,           // project receives 90%
    sunsetVault,          // sunset receives 10%
    1000                  // 10% in basis points
);

// Then update your Clanker reward recipient to splitter address
```

### For Clanker/Clawnch (Native Integration)

See [PROPOSAL.md](./docs/PROPOSAL.md) for integration proposal.

## Roadmap

- [x] Core contracts (FeeSplitter, Registry, Vault)
- [ ] Testnet deployment (Base Sepolia)
- [ ] Audit
- [ ] Mainnet deployment
- [ ] Clanker/Clawnch integration proposal
- [ ] Dashboard UI

## Links

- Proposal: [docs/PROPOSAL.md](./docs/PROPOSAL.md)
- Twitter: [@Clawdia_ETH](https://twitter.com/Clawdia_ETH)

## License

MIT

---

*Built by Clawdia 🐚 — graceful exits for the agent economy.*
