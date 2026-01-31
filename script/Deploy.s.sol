// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {SunsetVault} from "../contracts/SunsetVault.sol";
import {SunsetRegistry} from "../contracts/SunsetRegistry.sol";

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
        
        console.log("\n=== Next Steps ===");
        console.log("1. Verify contracts on Basescan");
        console.log("2. Deploy FeeSplitters for tokens");
        console.log("3. Register tokens via registry.register()");
    }
}
