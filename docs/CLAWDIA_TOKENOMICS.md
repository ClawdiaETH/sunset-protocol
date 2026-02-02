# $CLAWDIA Tokenomics Integration

**Sunset Protocol V2 — Deflationary Token Burns**

---

## Overview

Sunset Protocol V2 integrates $CLAWDIA token burns into the registration flow, creating continuous deflationary pressure while maintaining a seamless user experience.

## Burn Mechanisms

### 1. Registration Burns (Primary)

Every token registration burns exactly **25,000,000 $CLAWDIA** tokens.

**Flow:**
```
User enables "Sunset Protection" 
    ↓ pays ~0.1 ETH
CLAWDIABurner receives ETH
    ↓ wraps to WETH
Uniswap V3 swap (WETH → CLAWDIA)
    ↓ exact output: 25M CLAWDIA
Tokens sent to dead address
    ↓ 0x000000000000000000000000000000000000dEaD
Leftover ETH returned to user
    ↓
Registration completes
```

**Why 25M?**
- Creates consistent utility demand for $CLAWDIA
- 0.025% of total supply (100B) per registration
- Cumulative: 1,000 registrations = 25% of supply burned
- Small enough that registration remains accessible (~0.1 ETH at typical prices)
- Round number that's easy to communicate

### 2. Fee Buyback Burns (Secondary)

Protocol admin fees are periodically used to buy back and burn additional $CLAWDIA.

**Flow:**
```
FeeSplitter collects trading fees
    ↓ 10-15% to Sunset Protocol
Small portion goes to admin fees
    ↓ accumulates in Registry
When threshold reached (0.5 ETH)
    ↓ auto-triggers buyback
CLAWDIABurner swaps ETH → CLAWDIA
    ↓
Burns all purchased tokens
```

**Threshold:**
- Default: 0.5 ETH accumulated triggers buyback
- Admin can manually trigger earlier
- Configurable by owner

## Smart Contracts

### CLAWDIABurner.sol

```solidity
// Key constants
uint256 public constant REGISTRATION_BURN_AMOUNT = 25_000_000 * 1e18;
address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

// Key functions
function burnForRegistration(address token, address payer) 
    external payable 
    returns (uint256 ethSpent, uint256 clawdiaBurned);

function buybackAndBurn() external payable;

function getBurnStats() external view returns (
    uint256 totalRegistrationBurns,
    uint256 totalBuybackBurns,
    uint256 totalBurned,
    uint256 totalEthSpent
);
```

### SunsetRegistryV2.sol

```solidity
// Registration now accepts ETH and triggers burn
function register(
    address token,
    address feeSplitter,
    Tier tier
) external payable whenNotPaused;

// New view functions
function getRegistrationCost() external view returns (uint256);
function getTotalClawdiaBurned() external view returns (uint256);
function getBurnStats() external view returns (...);
```

## Tracking Burns

### On-Chain

All burns are transparent and verifiable:

1. **Registration Burns:** `RegistrationBurn` event with token, payer, clawdiaBurned, ethSpent
2. **Buyback Burns:** `BuybackBurn` event with ethSpent, clawdiaBurned
3. **Project-Level:** Each project stores `clawdiaBurned` in its struct

### API Endpoints

```
GET /api/burns/stats
{
  "totalRegistrationBurns": "250000000000000000000000000",
  "totalBuybackBurns": "45000000000000000000000000",
  "totalBurned": "295000000000000000000000000",
  "totalBurnedFormatted": "295M CLAWDIA",
  "totalEthSpent": "2.45 ETH",
  "registrationCount": 10,
  "pendingBuyback": "0.32 ETH"
}

GET /api/burns/[token]
{
  "token": "0x...",
  "clawdiaBurned": "25000000000000000000000000",
  "burnedFormatted": "25M CLAWDIA",
  "ethSpent": "0.095 ETH",
  "registeredAt": 1738450000,
  "txHash": "0x..."
}

GET /api/burns/estimate
{
  "estimatedEthNeeded": "0.1 ETH",
  "burnAmount": "25M CLAWDIA",
  "note": "Add 10% buffer for slippage"
}
```

### SDK Functions

```typescript
// Get total burn statistics
const stats = await sunset.getBurnStats();

// Estimate registration cost
const cost = await sunset.estimateRegistrationCost();

// Get burn for specific token
const projectBurn = await sunset.getProjectBurn(tokenAddress);
```

## Integration Guide

### For Platforms (Clanker/Bankr)

**1. Add Checkbox UI**

```jsx
<label>
  <input 
    type="checkbox" 
    checked={enableSunset}
    onChange={(e) => setEnableSunset(e.target.checked)}
  />
  Enable Sunset Protection (+{estimatedCost} ETH)
  <small>Includes 25M $CLAWDIA auto-burn</small>
</label>
```

**2. Estimate Cost on Load**

```typescript
const estimatedCost = await sunset.estimateRegistrationCost();
// Display: ~0.1 ETH (varies with CLAWDIA price)
```

**3. Include in Deployment Transaction**

```typescript
// After token deployment
if (enableSunset) {
  await registry.register(
    tokenAddress,
    splitterAddress,
    tier,
    { value: estimatedCost + parseEther("0.01") } // 0.01 buffer
  );
}
```

### For Token Creators

**Manual Registration**

```bash
# Using cast
cast send $REGISTRY "register(address,address,uint8)" \
  $TOKEN $SPLITTER 0 \
  --value 0.12ether \
  --private-key $KEY
```

**Via SDK**

```typescript
const tx = sunset.register(tokenAddress, splitterAddress, 0);
const txWithValue = {
  ...tx,
  value: await sunset.estimateRegistrationCost() + parseEther("0.01")
};
// Sign and send...
```

## Price Dynamics

### ETH Cost Variation

The ETH needed for registration varies with:

1. **$CLAWDIA price** — Higher price = more ETH needed
2. **Liquidity depth** — Thin liquidity = higher slippage
3. **Gas prices** — Higher gas = slightly more ETH

**Typical Range:** 0.05 - 0.2 ETH

### Slippage Protection

The CLAWDIABurner uses Uniswap V3's `exactOutputSingle`:
- Specifies exact 25M CLAWDIA output
- User's msg.value is max input
- Unused ETH returned automatically

**Recommendation:** Add 10% buffer to estimated cost

## Token Supply & Impact

**Total Supply:** 100,000,000,000 (100 billion) $CLAWDIA
**Burn per Registration:** 25,000,000 (25 million) = 0.025% of supply

### Impact by Scale

| Registrations | $CLAWDIA Burned | % of Total Supply |
|---------------|-----------------|-------------------|
| 1 | 25M | 0.025% |
| 10 | 250M | 0.25% |
| 100 | 2.5B | 2.5% |
| 500 | 12.5B | 12.5% |
| 1,000 | 25B | 25% |
| 2,000 | 50B | 50% |
| 4,000 | 100B | 100% (theoretical max) |

### Realistic Projections

**Year 1 (Conservative):** 50-100 registrations
- Burns: 1.25B - 2.5B CLAWDIA (1.25% - 2.5% of supply)

**Year 1 (Optimistic):** 500 registrations  
- Burns: 12.5B CLAWDIA (12.5% of supply)

### Sustainable Utility

The burn mechanism creates:
- **Consistent Demand** — Every registration requires buying CLAWDIA
- **Cumulative Effect** — Burns compound over time
- **Price Floor Support** — Utility-driven demand regardless of speculation
- **Aligned Incentives** — Protocol growth = CLAWDIA demand

## Security Considerations

### Burner Contract

1. **Slippage Protection** — Max input enforced
2. **Refund Mechanism** — Unused ETH returned
3. **Owner Controls** — Can update pool fee, rescue stuck tokens
4. **24hr Timelock** — Burner address changes require waiting period

### Cannot Be Exploited

- No way to extract CLAWDIA (it's burned immediately)
- Refunds go to original payer
- Pool fee limited to valid Uniswap tiers

## FAQ

**Q: What if I don't have enough ETH?**
A: Transaction reverts. Estimate cost first and add 10% buffer.

**Q: Can registration fail mid-burn?**
A: If swap fails, entire transaction reverts. No partial burns.

**Q: What if CLAWDIA price moons?**
A: Registration becomes more expensive in ETH terms. This is by design — protocol success should make registration more valuable.

**Q: Is 0.025% per registration meaningful?**
A: Individually small, but cumulative. 1,000 registrations burns 25% of supply. Plus ongoing fee buybacks add more. The key is consistent utility demand, not one-time spikes.

**Q: Can burn amount be changed?**
A: Current: 25M fixed in contract. Could be made governable in future versions.

**Q: Where do burned tokens go?**
A: Dead address `0x000000000000000000000000000000000000dEaD` — verifiable by anyone.

---

## Resources

- **Contract:** [CLAWDIABurner.sol](../contracts/CLAWDIABurner.sol)
- **Registry V2:** [SunsetRegistryV2.sol](../contracts/SunsetRegistryV2.sol)
- **API Docs:** [README.md](../README.md#rest-api)
- **SDK:** [@sunset-protocol/sdk](../sdk/README.md)

---

*Deflationary tokenomics for graceful exits 🔥🌅*
