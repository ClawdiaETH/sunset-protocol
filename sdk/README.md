# @sunset-protocol/sdk

TypeScript SDK for Sunset Protocol — Graceful exits for agent tokens.

## Installation

```bash
npm install @sunset-protocol/sdk viem
# or
pnpm add @sunset-protocol/sdk viem
# or
yarn add @sunset-protocol/sdk viem
```

## Quick Start

```typescript
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { SunsetSDK, Tier } from "@sunset-protocol/sdk";

// Create a viem public client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Initialize the SDK
const sdk = new SunsetSDK({
  chainId: 84532, // Base Sepolia
  publicClient,
});

// Get coverage info for a token
const coverage = await sdk.getCoverage("0x...");
console.log("Pool balance:", coverage.actualBalance);
console.log("Triggered:", coverage.triggered);
```

## Features

- 🔍 **Read Methods** - Query coverage, sunset status, health scores
- 📝 **Write Methods** - Create unsigned transactions for registration, sunset, claims
- 🔐 **Wallet Agnostic** - Works with any viem wallet client
- 📦 **Full TypeScript** - Complete type definitions included
- ⛓️ **Multi-Chain** - Support for Mainnet, Base, and testnets

## API Reference

### Constructor

```typescript
const sdk = new SunsetSDK({
  chainId: 84532,           // Required: Chain ID
  publicClient,              // Required: viem PublicClient
  registryAddress?: "0x...", // Optional: Custom registry address
  vaultAddress?: "0x...",    // Optional: Custom vault address
});
```

### Read Methods

#### `getCoverage(token: Address): Promise<CoverageInfo>`

Get coverage pool information for a token.

```typescript
const coverage = await sdk.getCoverage("0x...");
// Returns:
// {
//   depositedAmount: bigint,   // Total ETH deposited over time
//   actualBalance: bigint,     // Current ETH in pool
//   snapshotSupply: bigint,    // Token supply at sunset (if triggered)
//   snapshotBlock: bigint,     // Block number of sunset
//   triggered: boolean         // Whether sunset has been executed
// }
```

#### `getClaimable(token: Address, holder: Address): Promise<bigint>`

Get the claimable ETH amount for a token holder.

```typescript
const claimable = await sdk.getClaimable(
  "0xTokenAddress...",
  "0xHolderAddress..."
);
console.log("Claimable:", claimable); // in wei
```

#### `getSunsetStatus(token: Address): Promise<SunsetStatus>`

Get the sunset announcement status.

```typescript
const status = await sdk.getSunsetStatus("0x...");
// Returns:
// {
//   announced: boolean,      // Whether sunset has been announced
//   announcedAt: bigint,     // Timestamp of announcement
//   announcedBy: Address,    // Who announced it
//   executableAt: bigint,    // When it can be executed
//   canExecute: boolean      // Whether it can be executed now
// }
```

#### `getScore(token: Address): Promise<HealthScore>`

Calculate a health score (0-100) for the token's coverage.

```typescript
const health = await sdk.getScore("0x...");
// Returns:
// {
//   score: 85,                    // Overall score 0-100
//   factors: {
//     coverageRatio: 35,          // Points from pool balance
//     activityScore: 40,          // Points from recent activity
//     timeScore: 10               // Points from time registered
//   },
//   status: "healthy"             // "healthy" | "at-risk" | "critical" | "sunset"
// }
```

#### `getProject(token: Address): Promise<ProjectInfo>`

Get project registration details.

```typescript
const project = await sdk.getProject("0x...");
// Returns:
// {
//   owner: Address,
//   feeSplitter: Address,
//   tier: Tier,                    // 0 = Standard, 1 = Premium
//   active: boolean,
//   registeredAt: bigint,
//   lastMeaningfulDeposit: bigint,
//   totalDeposited: bigint
// }
```

#### `canOwnerTrigger(token: Address): Promise<{ canTrigger: boolean, timeRemaining: bigint }>`

Check if the owner can announce a sunset (30-day coverage period met).

#### `canCommunityTrigger(token: Address): Promise<{ canTrigger: boolean, timeRemaining: bigint }>`

Check if the community can announce a sunset (120-day inactivity).

### Write Methods

All write methods return an `UnsignedTransaction` object that can be signed and sent with any wallet.

#### `register(token: Address, feeSplitter: Address, tier: Tier): UnsignedTransaction`

Create a transaction to register a token with Sunset Protocol.

```typescript
import { Tier } from "@sunset-protocol/sdk";

const tx = sdk.register(
  "0xTokenAddress...",
  "0xFeeSplitterAddress...",
  Tier.Standard // or Tier.Premium
);

// Send with viem wallet client
const hash = await walletClient.sendTransaction({
  to: tx.to,
  data: tx.data,
  chain: baseSepolia,
});
```

#### `announceSunset(token: Address): UnsignedTransaction`

Announce intent to sunset a token (starts 48-hour countdown).

```typescript
const tx = sdk.announceSunset("0x...");
```

#### `executeSunset(token: Address): UnsignedTransaction`

Execute a sunset after the announcement period.

```typescript
const tx = sdk.executeSunset("0x...");
```

#### `cancelSunset(token: Address): UnsignedTransaction`

Cancel an announced sunset (owner/admin only).

```typescript
const tx = sdk.cancelSunset("0x...");
```

#### `claim(token: Address): UnsignedTransaction`

Claim your share of the coverage pool after sunset.

```typescript
const tx = sdk.claim("0x...");
```

## Full Example

```typescript
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { SunsetSDK, Tier } from "@sunset-protocol/sdk";

// Setup clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const account = privateKeyToAccount("0x...");
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

// Initialize SDK
const sdk = new SunsetSDK({
  chainId: 84532,
  publicClient,
});

async function main() {
  const tokenAddress = "0x...";

  // Check if registered
  const isRegistered = await sdk.isRegistered(tokenAddress);
  console.log("Registered:", isRegistered);

  if (isRegistered) {
    // Get health score
    const health = await sdk.getScore(tokenAddress);
    console.log(`Health: ${health.score}/100 (${health.status})`);

    // Check sunset status
    const status = await sdk.getSunsetStatus(tokenAddress);
    if (status.canExecute) {
      // Execute sunset
      const tx = sdk.executeSunset(tokenAddress);
      const hash = await walletClient.sendTransaction({
        to: tx.to,
        data: tx.data,
      });
      console.log("Sunset executed:", hash);
    }

    // Check if we can claim
    const claimable = await sdk.getClaimable(tokenAddress, account.address);
    if (claimable > 0n) {
      console.log("Claimable:", claimable, "wei");
      const tx = sdk.claim(tokenAddress);
      const hash = await walletClient.sendTransaction({
        to: tx.to,
        data: tx.data,
      });
      console.log("Claimed:", hash);
    }
  }
}

main().catch(console.error);
```

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Base Sepolia | 84532 | ✅ Deployed |
| Base Mainnet | 8453 | 🔜 Coming soon |
| Ethereum Mainnet | 1 | 🔜 Coming soon |
| Ethereum Sepolia | 11155111 | 🔜 Coming soon |

## Constants

The SDK exposes key protocol constants:

- **MIN_COVERAGE_PERIOD**: 30 days - Minimum time before owner can sunset
- **INACTIVITY_THRESHOLD**: 120 days - Inactivity period for community sunset
- **MIN_MEANINGFUL_DEPOSIT**: 0.001 ETH - Minimum deposit to reset activity timer
- **ANNOUNCEMENT_PERIOD**: 48 hours - Time between announcement and execution

## Advanced: Direct ABI Access

For advanced use cases, you can import the ABIs directly:

```typescript
import {
  SunsetRegistryABI,
  SunsetVaultABI,
  FeeSplitterABI,
  ADDRESSES,
} from "@sunset-protocol/sdk";

// Use with viem's getContract
import { getContract } from "viem";

const registry = getContract({
  address: ADDRESSES[84532].registry,
  abi: SunsetRegistryABI,
  client: publicClient,
});
```

## License

MIT

## Links

- [Sunset Protocol](https://github.com/ClawdiaETH/sunset-protocol)
- [Documentation](https://github.com/ClawdiaETH/sunset-protocol/blob/main/docs/PROPOSAL.md)
- [Twitter](https://twitter.com/Clawdia_ETH)
