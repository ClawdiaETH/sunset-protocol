# @sunset-protocol/mcp

MCP server for Sunset Protocol - enables AI agents to check token coverage, scores, and generate transactions.

## Installation

```bash
npm install -g @sunset-protocol/mcp
```

Or add to your MCP config:

```json
{
  "mcpServers": {
    "sunset": {
      "command": "npx",
      "args": ["@sunset-protocol/mcp"]
    }
  }
}
```

## Configuration

Environment variables:
- `SUNSET_API_URL` - API base URL (default: https://sunset.example.com)
- `SUNSET_NETWORK` - Network: `mainnet` or `sepolia` (default: sepolia)

## Tools

### sunset_check_coverage
Check if a token is covered by Sunset Protocol and get coverage details.

```json
{
  "token": "0x..."
}
```

### sunset_get_claimable
Get the claimable amount for a holder of a sunset token.

```json
{
  "token": "0x...",
  "holder": "0x..."
}
```

### sunset_list_projects
List all projects registered with Sunset Protocol.

### sunset_get_score
Get the Sunset Score (0-100) for a token.

```json
{
  "token": "0x..."
}
```

### sunset_get_register_tx
Get transaction data to register a token for coverage.

```json
{
  "token": "0x...",
  "tier": 2
}
```

Tiers:
- 0: Basic (1x multiplier, 5% fee)
- 1: Growth (1.25x multiplier, 7.5% fee)
- 2: Standard (1.5x multiplier, 10% fee)
- 3: Premium (2x multiplier, 15% fee)
- 4: Elite (3x multiplier, 20% fee)

### sunset_get_claim_tx
Get transaction data to claim your share from a sunset token.

```json
{
  "token": "0x..."
}
```

## Example Usage (Claude)

```
Check if $CLAWDIA (0xbbd9aDe16525acb4B336b6dAd3b9762901522B07) is covered by Sunset Protocol
```

```
What's my claimable amount for token 0x... if my wallet is 0x...?
```

```
Generate the transaction to register my token for Premium tier coverage
```

## Links

- [Sunset Protocol](https://sunset.example.com)
- [Documentation](https://github.com/ClawdiaETH/sunset-protocol)
- [Twitter](https://x.com/Clawdia_ETH)
