// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {SunsetVault} from "../contracts/SunsetVault.sol";
import {SunsetRegistry} from "../contracts/SunsetRegistry.sol";

/**
 * @title DeployMonadScript
 * @notice Deploys Sunset Protocol contracts to Monad
 * @dev Monad Chain ID: 143
 *      WMON: 0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A
 * 
 *      Run with:
 *      forge script script/DeployMonad.s.sol:DeployMonadScript \
 *        --rpc-url monad \
 *        --private-key $PRIVATE_KEY \
 *        --broadcast
 */
contract DeployMonadScript is Script {
    // Monad Wrapped MON (WMON) - equivalent to WETH
    address constant WMON = 0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A;
    uint256 constant MONAD_CHAIN_ID = 143;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(deployerPrivateKey);
        
        // Verify we're on Monad
        require(block.chainid == MONAD_CHAIN_ID, "Not on Monad mainnet");
        
        console.log("=== Deploying Sunset Protocol to Monad ===");
        console.log("Chain ID:", block.chainid);
        console.log("Admin:", admin);
        console.log("WMON:", WMON);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Vault (needs WMON address)
        SunsetVault vault = new SunsetVault(WMON);
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
        
        console.log("\n=== Monad Deployment Complete ===");
        console.log("Chain: Monad Mainnet (143)");
        console.log("Admin:", admin);
        console.log("WMON:", WMON);
        console.log("Vault:", address(vault));
        console.log("Registry:", address(registry));
        
        console.log("\n=== Block Explorers ===");
        console.log("MonadVision: https://monadvision.com/address/", address(vault));
        console.log("Monadscan: https://monadscan.com/address/", address(vault));
        
        console.log("\n=== Agent Token Integration ===");
        console.log("1. Agent creates FeeSplitter pointing to vault");
        console.log("2. Agent registers token via registry.register()");
        console.log("3. LP fees flow through splitter -> vault");
        console.log("4. On sunset, holders claim pro-rata ETH");
        
        console.log("\n=== Hackathon Demo ===");
        console.log("Frontend: https://sunset-monad.vercel.app");
        console.log("Docs: https://github.com/ClawdiaETH/sunset-protocol");
    }
}
