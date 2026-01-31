// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {SunsetVault} from "../contracts/SunsetVault.sol";
import {SunsetRegistry} from "../contracts/SunsetRegistry.sol";

/**
 * @title DeployScript
 * @notice Deploys Sunset Protocol contracts
 * @dev SECURITY RECOMMENDATIONS FOR MAINNET:
 *      1. Deploy with EOA, then transfer ownership to multi-sig
 *      2. Use Gnosis Safe with 2-of-3 or 3-of-5 threshold
 *      3. Set admin to multi-sig address (can be same as owner)
 *      4. Use OpenZeppelin Defender for monitoring and execution
 *      5. All critical admin changes have 24-hour timelock
 * 
 *      POST-DEPLOYMENT STEPS:
 *      1. vault.proposeSetAdmin(MULTISIG_ADDRESS)
 *      2. registry.proposeSetAdmin(MULTISIG_ADDRESS)
 *      3. Wait 24 hours, then execute both actions
 *      4. Transfer ownership: vault.transferOwnership(MULTISIG_ADDRESS)
 *      5. Transfer ownership: registry.transferOwnership(MULTISIG_ADDRESS)
 */
contract DeployScript is Script {
    // WETH addresses
    address constant WETH_BASE_MAINNET = 0x4200000000000000000000000000000000000006;
    address constant WETH_BASE_SEPOLIA = 0x4200000000000000000000000000000000000006;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(deployerPrivateKey);
        
        // Detect network
        uint256 chainId = block.chainid;
        address weth = chainId == 8453 ? WETH_BASE_MAINNET : WETH_BASE_SEPOLIA;
        
        console.log("Deploying to chain:", chainId);
        console.log("Admin:", admin);
        console.log("WETH:", weth);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Vault (needs WETH address)
        SunsetVault vault = new SunsetVault(weth);
        console.log("SunsetVault deployed at:", address(vault));
        
        // 2. Deploy Registry (needs admin address)
        SunsetRegistry registry = new SunsetRegistry(admin);
        console.log("SunsetRegistry deployed at:", address(registry));
        
        // 3. Connect vault to registry
        vault.setRegistry(address(registry));
        console.log("Vault registry set");
        
        // 4. Connect registry to vault
        registry.setVault(address(vault));
        console.log("Registry vault set");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("Chain ID:", chainId);
        console.log("Admin:", admin);
        console.log("WETH:", weth);
        console.log("Vault:", address(vault));
        console.log("Registry:", address(registry));
        
        console.log("\n=== Security Features ===");
        console.log("- Emergency pause: vault.setPaused(true) / registry.setPaused(true)");
        console.log("- 24-hour timelock on: setAdmin, tier parameter changes");
        console.log("- Pause applies to: deposits, claims, registrations, sunset triggers");
        
        console.log("\n=== Next Steps ===");
        console.log("1. Verify contracts on Basescan");
        console.log("2. Deploy FeeSplitters for tokens");
        console.log("3. Register tokens via registry.register()");
        console.log("\n=== MAINNET SECURITY (DO BEFORE GOING LIVE) ===");
        console.log("4. Set up Gnosis Safe multi-sig (2-of-3 or 3-of-5)");
        console.log("5. vault.proposeSetAdmin(MULTISIG_ADDRESS)");
        console.log("6. registry.proposeSetAdmin(MULTISIG_ADDRESS)");
        console.log("7. Wait 24 hours, then executeAction() on both");
        console.log("8. vault.transferOwnership(MULTISIG_ADDRESS)");
        console.log("9. registry.transferOwnership(MULTISIG_ADDRESS)");
    }
}
