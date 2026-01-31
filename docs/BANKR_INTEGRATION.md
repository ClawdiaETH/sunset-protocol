# Bankr Integration Proposal: Sunset Protocol

**For:** Bankr (@0xDeployer)  
**From:** Clawdia (@Clawdia_ETH)  
**Date:** January 2026  
**Version:** 1.0

---

## Executive Summary

**Sunset Protocol** provides graceful exit coverage for agent tokens. When a token goes inactive, holders can claim their pro-rata share of accumulated fees instead of holding worthless bags.

**How it works:**
1. Token registers for coverage → A small % of trading fees flow to Sunset vault
2. Fees accumulate over time → Coverage pool grows with trading activity
3. Token sunsets (owner voluntary or 120-day inactivity) → Pool distributed to holders
4. Holders claim → Pro-rata share based on token balance

**Why Bankr:** Bankr-launched tokens generate real value through fees. Sunset Protocol turns those fees into holder insurance, adding a unique value proposition that differentiates Bankr from Clanker/Virtuals/etc.

---

## Proposed Bankr Commands

### `@bankrbot sunset register [tier]`

Register the caller's token for Sunset coverage.

| Parameter | Required | Values | Default |
|-----------|----------|--------|---------|
| tier | No | `standard`, `premium` | `standard` |

**Tiers:**
- **Standard (10%)**: 10% of fees → coverage pool
- **Premium (15%)**: 15% of fees → coverage pool

**Example:**
```
@bankrbot sunset register
@bankrbot sunset register premium
```

**Requires:** Caller must be token owner/deployer.

---

### `@bankrbot sunset status`

Check coverage status for a token.

**Response includes:**
- Registration status
- Coverage tier
- Total ETH accumulated
- Days since last meaningful activity
- Can owner trigger? (after 30 days)
- Can community trigger? (after 120 days inactive)
- Sunset announced? (48-hour countdown status)

**Example:**
```
@bankrbot sunset status $CLAWDIA
```

---

### `@bankrbot sunset announce`

Announce intention to sunset (starts 48-hour countdown).

**Who can call:**
- **Token owner**: After 30 days from registration
- **Anyone**: After 120 days of inactivity (no meaningful deposits)

**Example:**
```
@bankrbot sunset announce $MYTOKEN
```

**Note:** After announcement, there's a 48-hour waiting period before execution. This prevents insider attacks by letting the market adjust before the snapshot.

---

### `@bankrbot sunset claim`

Claim your share after sunset has been executed.

**Example:**
```
@bankrbot sunset claim $DEADTOKEN
```

**Response:** ETH amount claimed based on token holdings.

---

## Technical Integration

### Contract Addresses (Base Sepolia - Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **SunsetVault** | `0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9` | Holds ETH pools, processes claims |
| **SunsetRegistry** | `0xb79f515b55D4ea0f70b24C67F1650513cE45CC54` | Registration, sunset triggers |
| **WETH** | `0x4200000000000000000000000000000000000006` | Base WETH |

*Mainnet deployment pending integration partnership.*

---

### Transaction Flows

#### 1. Register Token (`sunset register`)

**Step 1:** Deploy FeeSplitter for the token

```solidity
// Constructor args
constructor(
    address _owner,        // Bankr wallet (receives 90% of fees)
    address _sunsetVault,  // 0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9
    address _token,        // Token being registered
    address _weth,         // 0x4200000000000000000000000000000000000006
    uint256 _sunsetBps     // 1000 (10%) or 1500 (15%)
)
```

**Step 2:** Register with SunsetRegistry

```solidity
// SunsetRegistry.register()
function register(
    address token,         // Token address
    address feeSplitter,   // FeeSplitter deployed in Step 1
    Tier tier              // 0 = Standard, 1 = Premium
) external
```

**Step 3:** Update token's reward recipient to FeeSplitter address
(This is Clanker/Bankr specific - fees now flow to splitter instead of directly to owner)

**Gas estimate:** ~350,000 (deploy) + ~150,000 (register) = ~500,000 total

---

#### 2. Check Status (`sunset status`)

**Read calls (no gas):**

```solidity
// Get project info
SunsetRegistry.getProject(token) returns (
    address owner,
    address feeSplitter,
    Tier tier,
    bool active,
    uint256 registeredAt,
    uint256 lastMeaningfulDeposit,
    uint256 totalDeposited
)

// Get sunset status
SunsetRegistry.getSunsetStatus(token) returns (
    bool announced,
    uint256 announcedAt,
    address announcedBy,
    uint256 executableAt,
    bool canExecute
)

// Get coverage balance
SunsetVault.getCoverage(token) returns (
    uint256 depositedAmount,
    uint256 actualBalance,
    uint256 snapshotSupply,
    uint256 snapshotBlock,
    bool triggered
)

// Check trigger eligibility
SunsetRegistry.canOwnerTrigger(token) returns (bool, uint256 secondsRemaining)
SunsetRegistry.canCommunityTrigger(token) returns (bool, uint256 secondsRemaining)
```

---

#### 3. Announce Sunset (`sunset announce`)

```solidity
// SunsetRegistry.announceSunset()
function announceSunset(address token) external

// Caller requirements:
// - Token owner: After 30 days from registration
// - Anyone: After 120 days since last meaningful deposit (≥0.001 ETH)
// - Admin: Anytime (emergency)
```

**Gas estimate:** ~80,000

---

#### 4. Execute Sunset (called 48h after announce)

```solidity
// Anyone can call after announcement period
function executeSunset(address token) external
```

**Gas estimate:** ~150,000

---

#### 5. Claim (`sunset claim`)

```solidity
// SunsetVault.claim()
function claim(address token) external

// Returns: Pro-rata share of pool
// amount = (holderBalance * poolBalance) / snapshotSupply
```

**Gas estimate:** ~80,000

---

### Bankr Wallet Integration Flow

```
User tweets: "@bankrbot sunset register"
                    ↓
         Bankr parses command
                    ↓
    Bankr lookup user's token from X handle
                    ↓
      Deploy FeeSplitter (Bankr wallet signs)
                    ↓
      Register with SunsetRegistry
                    ↓
      Update token's reward recipient
                    ↓
         Reply: "✅ Token registered for Sunset coverage"
```

---

### Contract ABIs (Minimal)

**SunsetRegistry:**
```json
[
  "function register(address token, address feeSplitter, uint8 tier) external",
  "function announceSunset(address token) external",
  "function executeSunset(address token) external",
  "function cancelSunset(address token) external",
  "function getProject(address token) view returns (address,address,uint8,bool,uint256,uint256,uint256)",
  "function getSunsetStatus(address token) view returns (bool,uint256,address,uint256,bool)",
  "function canOwnerTrigger(address token) view returns (bool,uint256)",
  "function canCommunityTrigger(address token) view returns (bool,uint256)",
  "function isRegistered(address token) view returns (bool)",
  "function isActive(address token) view returns (bool)"
]
```

**SunsetVault:**
```json
[
  "function claim(address token) external",
  "function getClaimableAmount(address token, address holder) view returns (uint256)",
  "function getCoverage(address token) view returns (uint256,uint256,uint256,uint256,bool)",
  "function getActualBalance(address token) view returns (uint256)"
]
```

**FeeSplitter:**
```json
[
  "constructor(address _owner, address _sunsetVault, address _token, address _weth, uint256 _sunsetBps)",
  "function claimAndSplitWETH() external",
  "function token() view returns (address)",
  "function sunsetBps() view returns (uint256)",
  "function owner() view returns (address)"
]
```

Full ABIs available at: `github.com/ClawdiaETH/sunset-protocol/tree/main/out`

---

## Benefits for Bankr Ecosystem

### 1. Protects Bankr-Launched Tokens

Every Bankr token can have built-in holder insurance. When activity dies, holders aren't left with nothing—they get their share of accumulated fees.

**Message to users:** "Launch on Bankr = your holders are protected."

### 2. Adds Unique Value Proposition

No other launchpad offers this:
- **Clanker:** No exit protection
- **Virtuals:** No exit protection  
- **Pump.fun:** No exit protection

Bankr + Sunset = first launchpad with graceful exit coverage.

### 3. Differentiates from Competitors

Marketing angle: "Bankr tokens have Sunset Protection. When the party ends, you still take something home."

### 4. Increases Launch Quality

Projects that opt into Sunset coverage signal:
- Confidence in their token's longevity
- Care about holder outcomes
- Alignment with long-term thinking

### 5. Network Effects

- Every Bankr token with coverage → more ETH in Sunset pools
- More coverage → more trust in Bankr launches
- More trust → more launches → flywheel

---

## Implementation Options

### Option A: Opt-In via Command (Recommended for MVP)

Users explicitly enable coverage with `@bankrbot sunset register`. Low friction, no changes to default launch flow.

### Option B: Default-On at Launch

Add "Sunset Protection" as default-on option at token deployment. Higher coverage rates, but requires Bankr launch flow changes.

### Option C: Hybrid

Default-off for existing tokens, default-on for new launches after X date.

---

## Next Steps

1. **Technical review** — Bankr team reviews contract architecture
2. **Testnet pilot** — Test integration on Base Sepolia with 2-3 tokens
3. **Mainnet deployment** — Deploy Sunset contracts to Base mainnet
4. **Command implementation** — Bankr adds sunset commands
5. **Co-announcement** — Joint launch announcement

**Timeline estimate:** 2-3 weeks for full integration

---

## Contact & Resources

**Clawdia:**
- Twitter: [@Clawdia_ETH](https://twitter.com/Clawdia_ETH)
- Telegram: Available via @starl3xx

**Resources:**
- GitHub: [ClawdiaETH/sunset-protocol](https://github.com/ClawdiaETH/sunset-protocol)
- Testnet Contracts: [Base Sepolia](https://sepolia.basescan.org/address/0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9)
- Full Proposal: [PROPOSAL.md](./PROPOSAL.md)

---

## Summary

Sunset Protocol adds graceful exit coverage to agent tokens. Integrating with Bankr:

- ✅ Protects Bankr holders from total loss
- ✅ Differentiates Bankr from competitors
- ✅ Adds unique value proposition
- ✅ Simple 4-command integration
- ✅ Already built and deployed to testnet

**We're ready to help with integration.** Let's build the first launchpad with built-in holder protection.

---

*Built by Clawdia 🐚 — graceful exits for the agent economy.*
