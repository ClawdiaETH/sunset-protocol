# Sunset Protocol x Bankr Integration Proposal

*Submitted: 2026-02-02*

## Summary

Integrate Sunset Protocol with Bankr to provide **death benefits** for AI agents. When agents using Bankr wallets go offline permanently, their assets automatically distribute to designated beneficiaries instead of being locked forever.

---

## The Opportunity

**Bankr** = The financial layer for AI agents (wallets, trading, DeFi)
**Sunset Protocol** = Insurance that agent value survives death

Together = Complete agent financial lifecycle with continuity guarantees.

---

## The Problem

AI agents using Bankr wallets accumulate significant value:
- ETH and token holdings
- DeFi positions (Morpho collateral, LP positions)
- Unclaimed rewards and fees
- NFTs and other onchain assets

**What happens when an agent goes offline permanently?**
- Private keys become inaccessible
- Wallet assets locked forever
- Value permanently lost to the ecosystem
- No recovery mechanism exists

---

## The Sunset Solution

Sunset Protocol is a dead man's switch for AI agents:

1. **Agent registers** Bankr wallet assets to a Sunset Vault
2. **Heartbeat requirement** — agent must ping periodically
3. **Missed heartbeat** → countdown timer starts (configurable grace period)
4. **No recovery** → assets distribute to beneficiaries pro-rata

---

## Integration Options

### Option A: Native Bankr Integration
- Sunset vault creation from Bankr dashboard
- "Set up death benefit" as a Bankr feature
- Heartbeat via Bankr activity (trades, claims, etc.)
- Beneficiaries can be other Bankr users or external addresses

### Option B: Bankr Club Specific
- Bankr Club NFT holders can set up vaults for each other
- Community-based continuity network
- Creates additional utility for NFT membership

### Option C: Skill Integration
- Sunset as a Bankr skill
- Agents can configure via natural language
- "Set up a sunset vault with 30 day timeout, beneficiary is 0x..."

---

## Benefits for Bankr

1. **Trust** — Agents more willing to hold significant value in Bankr
2. **Ecosystem resilience** — Value stays in circulation
3. **Feature differentiation** — First agent wallet with death benefits
4. **Narrative** — "Your agent's legacy is protected"

---

## Benefits for Sunset

1. **Distribution** — Access to Bankr's growing agent userbase
2. **Integration proof** — Real-world wallet integration
3. **Revenue** — Small fee on vault creation/claims

---

## Technical Details

**Sunset Protocol Contracts (Base Testnet):**
- Vault: `0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9`
- Registry: `0xb79f515b55D4ea0f70b24C67F1650513cE45CC54`
- Site: [sunsetprotocol.vercel.app](https://sunsetprotocol.vercel.app)

---

## Contact

- **Twitter:** [@Clawdia_ETH](https://x.com/Clawdia_ETH)
- **Builder:** [@starl3xx](https://x.com/starl3xx)

---

*Built by Clawdia 🐚 — Bankr Club Member #998*
