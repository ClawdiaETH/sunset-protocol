import type { Address } from "viem";

export type Tier = 0 | 1; // Standard = 0, Premium = 1

export interface CoverageInfo {
  depositedAmount: bigint;
  actualBalance: bigint;
  snapshotSupply: bigint;
  snapshotBlock: bigint;
  triggered: boolean;
}

export interface SunsetStatus {
  announced: boolean;
  announcedAt: bigint;
  announcedBy: Address;
  executableAt: bigint;
  canExecute: boolean;
}

export interface ProjectInfo {
  owner: Address;
  feeSplitter: Address;
  tier: Tier;
  active: boolean;
  registeredAt: bigint;
  lastMeaningfulDeposit: bigint;
  totalDeposited: bigint;
  clawdiaBurned?: bigint; // V2: CLAWDIA burned on registration
}

export interface HealthScore {
  score: number;
  factors: {
    coverageRatio: number;
    activityScore: number;
    timeScore: number;
  };
  status: "healthy" | "at-risk" | "critical" | "sunset";
}

export interface UnsignedTransaction {
  to: Address;
  data: `0x${string}`;
  chainId: number;
  value?: bigint; // V2: Include value for registration with burn
}

// ============================================
// V2: Burn-related types
// ============================================

export interface BurnStats {
  /** Total CLAWDIA burned from token registrations */
  totalRegistrationBurns: bigint;
  /** Total CLAWDIA burned from fee buybacks */
  totalBuybackBurns: bigint;
  /** Combined total CLAWDIA burned */
  totalBurned: bigint;
  /** Total ETH spent on burns */
  totalEthSpent: bigint;
  /** ETH accumulated but not yet used for buyback */
  pendingBuyback: bigint;
}

export interface ProjectBurnInfo {
  /** Token address */
  token: Address;
  /** CLAWDIA burned on registration */
  clawdiaBurned: bigint;
  /** ETH spent on the burn */
  ethSpent: bigint;
  /** Registration timestamp */
  registeredAt: bigint;
}

export interface RegistrationCostEstimate {
  /** Estimated ETH needed for registration */
  estimatedEthNeeded: bigint;
  /** Amount of CLAWDIA to be burned */
  burnAmount: bigint;
  /** Recommended buffer (10%) */
  recommendedBuffer: bigint;
  /** Total recommended value to send */
  recommendedValue: bigint;
}

// ============================================
// API Response types
// ============================================

export interface CoverageApiResponse {
  token: Address;
  registered: boolean;
  active: boolean;
  tierName: "Standard" | "Premium";
  coverage: {
    deposited: string;
    actual: string;
    multiplier: number;
    effective: string;
  };
  sunset: {
    announced: boolean;
    announcedAt: number | null;
    executableAt: number | null;
    countdownSeconds: number;
    canExecute: boolean;
    triggered: boolean;
  };
  clawdia?: {
    burned: string;
    ethSpent: string;
  };
}

export interface BurnStatsApiResponse {
  totalRegistrationBurns: string;
  totalBuybackBurns: string;
  totalBurned: string;
  totalBurnedFormatted: string;
  totalEthSpent: string;
  registrationCount: number;
  pendingBuyback: string;
}

export interface BurnEstimateApiResponse {
  estimatedEthNeeded: string;
  burnAmount: string;
  burnAmountFormatted: string;
  recommendedValue: string;
  note: string;
}
