import type { Address, Hash } from "viem";

// Tier enum matching the contract
export enum Tier {
  Standard = 0,
  Premium = 1,
}

// Coverage info from the vault
export interface CoverageInfo {
  depositedAmount: bigint;
  actualBalance: bigint;
  snapshotSupply: bigint;
  snapshotBlock: bigint;
  triggered: boolean;
}

// Project info from the registry
export interface ProjectInfo {
  owner: Address;
  feeSplitter: Address;
  tier: Tier;
  active: boolean;
  registeredAt: bigint;
  lastMeaningfulDeposit: bigint;
  totalDeposited: bigint;
}

// Sunset status from the registry
export interface SunsetStatus {
  announced: boolean;
  announcedAt: bigint;
  announcedBy: Address;
  executableAt: bigint;
  canExecute: boolean;
}

// Health score for a token
export interface HealthScore {
  score: number; // 0-100
  factors: {
    coverageRatio: number;
    activityScore: number;
    timeScore: number;
  };
  status: "healthy" | "at-risk" | "critical" | "sunset";
}

// Unsigned transaction request
export interface UnsignedTransaction {
  to: Address;
  data: Hash;
  value?: bigint;
  chainId: number;
}

// SDK configuration
export interface SunsetSDKConfig {
  chainId: number;
  registryAddress?: Address;
  vaultAddress?: Address;
}
