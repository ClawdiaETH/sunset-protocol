import type { Address } from "viem";

export type ChainId = 1 | 8453 | 84532 | 11155111;

export interface ContractAddresses {
  registry: Address;
  vault: Address;
  weth: Address;
}

export const ADDRESSES: Record<ChainId, ContractAddresses> = {
  // Ethereum Mainnet (placeholder)
  1: {
    registry: "0x0000000000000000000000000000000000000000",
    vault: "0x0000000000000000000000000000000000000000",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  // Base Mainnet (placeholder)
  8453: {
    registry: "0x0000000000000000000000000000000000000000",
    vault: "0x0000000000000000000000000000000000000000",
    weth: "0x4200000000000000000000000000000000000006",
  },
  // Base Sepolia (deployed)
  84532: {
    registry: "0xb79f515b55d4ea0f70b24c67f1650513ce45cc54",
    vault: "0x8d0dc9e8a42743a0256fd40b70f463e4e0c587d9",
    weth: "0x4200000000000000000000000000000000000006",
  },
  // Ethereum Sepolia (placeholder)
  11155111: {
    registry: "0x0000000000000000000000000000000000000000",
    vault: "0x0000000000000000000000000000000000000000",
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  },
} as const;

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
