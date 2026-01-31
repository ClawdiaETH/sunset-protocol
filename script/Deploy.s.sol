// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {SunsetVault} from "../contracts/SunsetVault.sol";
import {SunsetRegistry} from "../contracts/SunsetRegistry.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Vault
        SunsetVault vault = new SunsetVault(admin);
        console.log("SunsetVault deployed at:", address(vault));
        
        // Deploy Registry
        SunsetRegistry registry = new SunsetRegistry(address(vault));
        console.log("SunsetRegistry deployed at:", address(registry));
        
        // Connect vault to registry
        vault.setRegistry(address(registry));
        console.log("Registry connected to Vault");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("Admin:", admin);
        console.log("Vault:", address(vault));
        console.log("Registry:", address(registry));
    }
}
