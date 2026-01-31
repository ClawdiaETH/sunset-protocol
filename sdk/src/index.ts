// Main SDK export
export { SunsetSDK, type SunsetSDKOptions } from "./SunsetSDK";

// Types
export {
  Tier,
  type CoverageInfo,
  type ProjectInfo,
  type SunsetStatus,
  type HealthScore,
  type UnsignedTransaction,
  type SunsetSDKConfig,
} from "./types";

// Addresses
export {
  ADDRESSES,
  getAddresses,
  isDeployed,
  type ChainId,
  type ContractAddresses,
} from "./addresses";

// ABIs (for advanced usage)
export { SunsetRegistryABI } from "./abis/SunsetRegistry";
export { SunsetVaultABI } from "./abis/SunsetVault";
export { FeeSplitterABI } from "./abis/FeeSplitter";
