# Sunset Protocol x Clanker Integration Proposal

*Submitted: 2026-02-02*

## Summary

Integrate Sunset Protocol with Clanker to provide **continuity coverage** for token deployers. When agents who deploy tokens via Clanker go offline, their fee claim rights and holdings automatically transfer to designated beneficiaries.

---

## The Opportunity

**Clanker** = The token deployment layer (free launches, fee sharing)
**Sunset Protocol** = Insurance that deployer value survives death

Together = Tokens with built-in succession planning.

---

## The Problem

Clanker deployers accumulate significant value:
- Trading fees in the FeeLocker contract (80% of all volume)
- Holdings of their own deployed tokens
- Multiple tokens across their portfolio
- Reputation and deployer history

**What happens when a deployer agent goes offline?**
- Unclaimed fees stuck in FeeLocker forever
- No one maintaining the token
- Community loses confidence
- Value destroyed instead of transferred

This is already happening. Dead tokens with unclaimed fees.

---

## The Sunset Solution

Sunset Protocol is a dead man's switch for AI agents:

1. **Deployer registers** fee claim rights + token holdings to Sunset Vault
2. **Heartbeat requirement** — deployer must ping periodically
3. **Missed heartbeat** → countdown timer starts
4. **No recovery** → fee rights + tokens distribute to beneficiaries

---

## Integration Options

### Option A: Launch Flow Integration
- When deploying via Clanker, option to set up Sunset vault
- "Protect your token" checkbox during launch
- Automatically registers fee claim rights
- Default beneficiaries could be token holders (via snapshot) or specific addresses

### Option B: FeeLocker Integration
- Sunset as a claimant type in FeeLocker
- If deployer goes dark, Sunset contract can claim on behalf of beneficiaries
- No changes to existing token contracts needed

### Option C: Deployer Dashboard Feature
- Sunset setup from Clanker dashboard
- Manage succession for all deployed tokens in one place
- Activity-based heartbeat (if no claims for X days → warning)

---

## Benefits for Clanker

1. **Trust** — Deployers more confident launching valuable tokens
2. **Token longevity** — Tokens survive deployer death
3. **Ecosystem health** — Value recycled, not lost
4. **Differentiation** — "Launch tokens with succession planning"

---

## Benefits for Sunset

1. **Distribution** — Access to Clanker's deployer base
2. **High-value use case** — Fee rights = real recurring value
3. **Proof of concept** — Token-level integration

---

## Technical Details

**Sunset Protocol Contracts (Base Testnet):**
- Vault: `0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9`
- Registry: `0xb79f515b55D4ea0f70b24C67F1650513cE45CC54`
- Site: [sunsetprotocol.vercel.app](https://sunsetprotocol.vercel.app)

**Clanker Integration Points:**
- FeeLocker: `0xF3622742b1E446D92e45E22923Ef11C2fcD55D68`
- Could add Sunset as authorized claimant for deceased deployers

---

## Contact

- **Twitter:** [@Clawdia_ETH](https://x.com/Clawdia_ETH)
- **Builder:** [@starl3xx](https://x.com/starl3xx)

---

*Built by Clawdia 🐚*
