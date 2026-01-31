# Sunset Protocol Subgraph

Indexes all events from Sunset Protocol contracts on Base Sepolia.

## Indexed Events

### SunsetRegistry
- `ProjectRegistered` - New project registered
- `SunsetAnnounced` - Sunset countdown started (48h)
- `SunsetExecuted` - Sunset completed, snapshot taken
- `SunsetCancelled` - Sunset announcement cancelled
- `FeeDeposited` - Fees deposited (activity tracking)

### SunsetVault
- `Deposited` - ETH deposited to coverage pool
- `SunsetTriggered` - Vault snapshot taken
- `Claimed` - Holder claimed their share

## Entities

- **Project** - Token registered with Sunset Protocol
- **Deposit** - Individual deposit records
- **Claim** - Holder claim records
- **SunsetEvent** - All sunset lifecycle events
- **Protocol** - Global statistics

## Deployment Instructions

### Prerequisites

```bash
# Install dependencies
npm install

# Install Graph CLI globally (optional)
npm install -g @graphprotocol/graph-cli
```

### 1. Update Contract Addresses

Edit `subgraph.yaml` and replace placeholder addresses:

```yaml
dataSources:
  - name: SunsetRegistry
    source:
      address: "0xYOUR_REGISTRY_ADDRESS"
      startBlock: DEPLOYMENT_BLOCK
  
  - name: SunsetVault
    source:
      address: "0xYOUR_VAULT_ADDRESS"
      startBlock: DEPLOYMENT_BLOCK
```

### 2. Generate Types

```bash
npm run codegen
```

### 3. Build

```bash
npm run build
```

### 4. Deploy

#### Option A: The Graph Studio (Recommended for Base Sepolia)

1. Go to https://thegraph.com/studio/
2. Connect wallet and create a new subgraph
3. Get your deploy key

```bash
graph auth --studio YOUR_DEPLOY_KEY
npm run deploy:studio
```

#### Option B: Hosted Service (Legacy)

```bash
graph auth --product hosted-service YOUR_ACCESS_TOKEN
npm run deploy:hosted
```

#### Option C: Local Graph Node (Development)

```bash
# Start a local graph node first
docker-compose up -d

# Create and deploy
npm run create:local
npm run deploy:local
```

## Example Queries

### Get All Active Projects

```graphql
{
  projects(where: { active: true }) {
    id
    token
    owner
    tier
    totalDeposited
    actualBalance
    sunsetStatus
  }
}
```

### Get Project with All Events

```graphql
{
  project(id: "0xTOKEN_ADDRESS") {
    token
    owner
    tier
    active
    sunsetStatus
    sunsetAnnouncedAt
    executableAt
    reason
    deposits(orderBy: timestamp, orderDirection: desc) {
      amount
      timestamp
    }
    sunsetEvents(orderBy: timestamp, orderDirection: desc) {
      eventType
      actor
      timestamp
    }
  }
}
```

### Get Recent Claims

```graphql
{
  claims(first: 10, orderBy: timestamp, orderDirection: desc) {
    token
    holder
    amount
    timestamp
    transactionHash
  }
}
```

### Get Protocol Stats

```graphql
{
  protocol(id: "sunset-protocol") {
    totalProjects
    activeProjects
    sunsettedProjects
    totalDeposited
    totalClaimed
  }
}
```

### Get Sunset Timeline for a Token

```graphql
{
  sunsetEvents(
    where: { token: "0xTOKEN_ADDRESS" }
    orderBy: timestamp
    orderDirection: asc
  ) {
    eventType
    actor
    reason
    executableAt
    actualBalance
    snapshotSupply
    timestamp
    transactionHash
  }
}
```

## Network

- **Network:** Base Sepolia (chain ID 84532)
- **Explorer:** https://sepolia.basescan.org/

## Development

```bash
# Watch mode for development
graph codegen --watch

# Test mappings (requires matchstick)
npm run test
```

## License

MIT
