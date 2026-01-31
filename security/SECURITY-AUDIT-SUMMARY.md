# Sunset Protocol Security Audit Summary

**Date:** 2026-02-01
**Contracts Analyzed:** FeeSplitter.sol, SunsetVault.sol, SunsetRegistry.sol

---

## Tool Status

| Tool | Status | Notes |
|------|--------|-------|
| **Slither** | ✅ Ran | 45 findings |
| **Aderyn** | ❌ Not installed | Requires Rust/Cargo |
| **Mythril** | ❌ Not installed | pip install timed out |

---

## Summary by Severity

| Severity | Count | Details |
|----------|-------|---------|
| **HIGH** | 1 | Arbitrary ETH send |
| **MEDIUM** | 3 | Strict equality, reentrancy (non-eth), unused return |
| **LOW** | 6 | Shadowing, zero-check, benign reentrancy, events-after-calls |
| **INFO** | 35 | Timestamp usage, naming, pragma versions, immutability |

---

## HIGH Severity Issues (1)

### 1. Arbitrary ETH Send - FeeSplitter.claimAndSplitETH()
**File:** `contracts/FeeSplitter.sol#127-146`
**Issue:** Function sends ETH to arbitrary addresses via external calls
**Dangerous calls:**
- `ISunsetVault(sunsetVault).deposit{value: sunsetAmount}(token)`
- `(success,) = owner.call{value: projectAmount}()`

**Recommendation:** This is likely intentional by design (sending to project owner). Add access control documentation to clarify the trust model.

---

## MEDIUM Severity Issues (3)

### 1. Dangerous Strict Equality
**Files:** FeeSplitter.sol, SunsetVault.sol
**Issue:** Using `== 0` for balance checks
**Locations:**
- `FeeSplitter.claimAndSplitETH()` - `balance == 0`
- `FeeSplitter.claimAndSplitToken()` - `balance == 0`
- `FeeSplitter.claimAndSplitWETH()` - `balance == 0`
- `SunsetVault.claim()` - `holderBalance == 0`, `amount == 0`
- `SunsetVault.getClaimableAmount()` - `holderBalance == 0`

**Recommendation:** Review if these early returns could cause issues with dust amounts. Consider using `<= 0` or explicit revert messages.

### 2. Reentrancy (Non-ETH) - SunsetRegistry.executeSunset()
**File:** `contracts/SunsetRegistry.sol#366-379`
**Issue:** State variable `project.active` written after external call to vault
```solidity
ISunsetVault(vault).triggerSunset(token);  // External call
project.active = false;  // State update AFTER
```
**Recommendation:** Apply CEI pattern - set `project.active = false` BEFORE the external call.

### 3. Unused Return Value
**File:** `contracts/FeeSplitter.sol#95`
**Issue:** `IERC20(_weth).approve()` return value ignored in constructor
**Recommendation:** Use SafeERC20's `safeApprove()` or check return value.

---

## LOW Severity Issues (6)

### 1. Local Variable Shadowing
**File:** `SunsetRegistry.sol#399`
**Issue:** `getProject().owner` shadows `Ownable.owner()`
**Recommendation:** Rename to `projectOwner` for clarity.

### 2. Missing Zero-Check on Address
**Files:** SunsetVault.sol
**Locations:**
- Constructor `_weth` parameter
- `setRegistry()` `_registry` parameter
**Recommendation:** Add `require(_weth != address(0))` checks.

### 3. Benign Reentrancy - SunsetVault.depositWETH()
**File:** `contracts/SunsetVault.sol#259-276`
**Issue:** State updated after WETH withdraw call (but marked benign by Slither)
**Recommendation:** Consider CEI pattern for consistency, though risk is low.

### 4. Event Reentrancy (Multiple)
**Issue:** Events emitted after external calls in:
- FeeSplitter.claimAndSplitETH()
- FeeSplitter.claimAndSplitToken()
- FeeSplitter.claimAndSplitWETH()
- SunsetVault.deposit()
- SunsetVault.depositWETH()
- SunsetRegistry.executeSunset()
- SunsetRegistry.register()
**Recommendation:** Emit events before external calls for better indexing reliability.

---

## INFORMATIONAL Issues (35)

### Timestamp Comparisons (11 instances)
All timestamp usage is for timelock/delay mechanisms - **acceptable pattern**.

### Naming Conventions (5 instances)
Parameters like `_token`, `_paused`, `_vault`, `_registry` use underscores.
**Recommendation:** Consider renaming to camelCase for Solidity conventions.

### Pragma Versions (4 different versions)
Mixed pragma constraints across files. Consider standardizing to `^0.8.20`.

### Missing Immutability (2 instances)
- `MockToken.totalSupply` - should be immutable
- `SunsetVault.weth` - should be immutable

### Low-Level Calls (2 instances)
Using `.call{value:}()` for ETH transfers - **acceptable pattern** (gas-efficient).

### Missing Interface Inheritance
`SunsetVault` should explicitly inherit from `ISunsetVault`.

---

## Recommendations Priority

### Must Fix (Before Mainnet)
1. **Reentrancy in executeSunset()** - Move state update before external call

### Should Fix
2. **Unused approve return value** - Use SafeERC20
3. **Missing zero checks** - Add address validation
4. **SunsetVault inheritance** - Explicitly inherit ISunsetVault
5. **Make weth immutable** in SunsetVault

### Consider
6. Review strict equality checks for dust edge cases
7. Emit events before external calls
8. Standardize naming conventions

---

## Installation Guide for Additional Tools

### Aderyn (Rust-based)
```bash
# Install Rust first
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Aderyn
cargo install aderyn

# Run
cd ~/clawd/projects/sunset-protocol
aderyn contracts/ 2>&1 | tee security/aderyn-report.txt
```

### Mythril (Symbolic Execution)
```bash
# Via pip (can be slow)
pip3 install mythril

# Or via Docker (recommended)
docker pull mythril/myth
docker run -v $(pwd):/tmp mythril/myth analyze /tmp/contracts/SunsetVault.sol
```

---

## Files Generated
- `security/slither-report.txt` - Full Slither output
- `security/SECURITY-AUDIT-SUMMARY.md` - This summary

---

*Generated by Clawdia security-audit subagent*
