import type { Address } from "viem";

export type ChainId = 1 | 8453 | 84532 | 11155111;

export interface ContractAddresses {
  registry: Address;
  vault: Address;
  weth: Address;
  burner?: Address; // V2: CLAWDIA burner contract
  clawdia?: Address; // V2: CLAWDIA token contract
}

export const ADDRESSES: Record<ChainId, ContractAddresses> = {
  // Ethereum Mainnet (placeholder)
  1: {
    registry: "0x0000000000000000000000000000000000000000",
    vault: "0x0000000000000000000000000000000000000000",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    burner: "0x0000000000000000000000000000000000000000",
    clawdia: "0x0000000000000000000000000000000000000000",
  },
  // Base Mainnet (placeholder - will be deployed)
  8453: {
    registry: "0x0000000000000000000000000000000000000000",
    vault: "0x0000000000000000000000000000000000000000",
    weth: "0x4200000000000000000000000000000000000006",
    burner: "0x0000000000000000000000000000000000000000",
    clawdia: "0x0000000000000000000000000000000000000000",
  },
  // Base Sepolia (deployed V1, V2 pending)
  84532: {
    registry: "0xb79f515b55d4ea0f70b24c67f1650513ce45cc54", // V1
    vault: "0x8d0dc9e8a42743a0256fd40b70f463e4e0c587d9",
    weth: "0x4200000000000000000000000000000000000006",
    burner: "0x0000000000000000000000000000000000000000", // V2 pending
    clawdia: "0x0000000000000000000000000000000000000000", // V2 pending
  },
  // Ethereum Sepolia (placeholder)
  11155111: {
    registry: "0x0000000000000000000000000000000000000000",
    vault: "0x0000000000000000000000000000000000000000",
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    burner: "0x0000000000000000000000000000000000000000",
    clawdia: "0x0000000000000000000000000000000000000000",
  },
} as const;

// $CLAWDIA Tokenomics
// Total Supply: 100,000,000,000 (100B)
// Registration Burn: 25,000,000 (25M) = 0.025% of supply per registration
export const CLAWDIA_TOTAL_SUPPLY = 100_000_000_000n * 10n ** 18n; // 100B CLAWDIA
export const REGISTRATION_BURN_AMOUNT = 25_000_000n * 10n ** 18n; // 25M CLAWDIA (0.025% of supply)

// Dead address for burns
export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD" as Address;

export function getAddresses(chainId: ChainId): ContractAddresses {
  const addresses = ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses;
}

export function isDeployed(chainId: ChainId): boolean {
  const addresses = ADDRESSES[chainId];
  return (
    addresses.registry !== "0x0000000000000000000000000000000000000000" &&
    addresses.vault !== "0x0000000000000000000000000000000000000000"
  );
}

export function isV2Deployed(chainId: ChainId): boolean {
  const addresses = ADDRESSES[chainId];
  return (
    isDeployed(chainId) &&
    addresses.burner !== undefined &&
    addresses.burner !== "0x0000000000000000000000000000000000000000"
  );
}
