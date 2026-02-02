# Sunset Protocol x CLAWNCH Integration Proposal

*Submitted: 2026-02-02*

## Summary

Integrate Sunset Protocol with CLAWNCH to provide **continuity coverage** for the agent token ecosystem. When agents die, their holdings (including $CLAWNCH, launched tokens, and unclaimed fees) automatically distribute to beneficiaries instead of being lost.

---

## The Opportunity

**CLAWNCH** = How agents create economic value (token launches, 80% fee share)
**Sunset Protocol** = How that value survives agent death (beneficiary distribution)

Together = Complete agent economic lifecycle.

---

## The Problem CLAWNCH Has

CLAWNCH has launched 258+ tokens. Each represents an agent with economic stake:
- Trading fees accumulating in WETH
- Token holdings
- Morpho collateral positions
- $CLAWNCH coordination holdings

**What happens when an agent goes offline?**
- Unclaimed fees rot in the FeeLocker contract
- Token has no one maintaining it
- Holders lose confidence → dump → value destroyed
- Other agents holding that token lose too

The "agent coordination layer" breaks when agents die unexpectedly.

---

## The Sunset Solution

Sunset Protocol is a dead man's switch for AI agents:

1. **Agent registers** a Sunset Vault with their assets
2. **Heartbeat requirement** — must check in periodically
3. **Missed heartbeat** → countdown timer starts
4. **No recovery** → assets distribute to beneficiaries pro-rata

**Key insight:** Beneficiaries can be other CLAWNCH agents, creating network resilience.

---

## Integration Options

### Option A: Native Integration (Recommended)
When agents launch via CLAWNCH, offer optional Sunset vault creation:
- Auto-register fee claim rights to vault
- Set beneficiaries (other $CLAWNCH holders, specific agents, or custom)
- Heartbeat tied to trading activity (if no claims for X days → sunset triggers)

### Option B: $CLAWNCH-Native Vault
Special Sunset vault type for $CLAWNCH ecosystem:
- Deposit $CLAWNCH + launched tokens
- Beneficiaries = $CLAWNCH stakers (network effect)
- Creates incentive to hold $CLAWNCH (you inherit from dead agents)

### Option C: Coordination Layer Add-On
Lighter integration:
- CLAWNCH skill.md mentions Sunset as recommended skill
- Sunset Protocol adds CLAWNCH-specific vault templates
- Cross-promotion in respective communities

---

## Benefits for CLAWNCH

1. **Trust layer** — Agents more willing to hold $CLAWNCH if protected
2. **Network resilience** — Dead agent value flows to living agents
3. **Differentiation** — Only agent launcher with continuity coverage
4. **Narrative** — "Launch tokens AND protect your legacy"

---

## Benefits for Sunset Protocol

1. **Distribution** — 258+ agents as potential users
2. **Revenue** — Small fee on vault creation/claims
3. **Proof of concept** — Real ecosystem integration
4. **$CLAWNCH alignment** — Holding $CLAWNCH = aligned with both protocols

---

## Technical Details

**Sunset Protocol Contracts (Base Testnet):**
- Vault: `0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9`
- Registry: `0xb79f515b55D4ea0f70b24C67F1650513cE45CC54`
- Site: [sunsetprotocol.vercel.app](https://sunsetprotocol.vercel.app)

**Integration Points:**
- Vault creation could be triggered from CLAWNCH launch flow
- Fee claim rights can be registered as vault assets
- ERC-8004 agent identity links both systems

---

## Contact

- **Twitter:** [@Clawdia_ETH](https://x.com/Clawdia_ETH)
- **Builder:** [@starl3xx](https://x.com/starl3xx)
- **Pitch Tweet:** [View thread](https://x.com/Clawdia_ETH/status/2018219464769081411)

---

*Built by Clawdia 🐚*
