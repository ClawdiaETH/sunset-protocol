import {
  type Address,
  type PublicClient,
  type WalletClient,
  encodeFunctionData,
  getContract,
  zeroAddress,
} from "viem";

import { SunsetRegistryABI } from "./abis/SunsetRegistry";
import { SunsetVaultABI } from "./abis/SunsetVault";
import { getAddresses, isDeployed, type ChainId } from "./addresses";
import type {
  CoverageInfo,
  HealthScore,
  ProjectInfo,
  SunsetStatus,
  Tier,
  UnsignedTransaction,
} from "./types";

export interface SunsetSDKOptions {
  /** Chain ID to use */
  chainId: ChainId;
  /** viem public client for read operations */
  publicClient: PublicClient;
  /** Optional custom registry address */
  registryAddress?: Address;
  /** Optional custom vault address */
  vaultAddress?: Address;
}

export class SunsetSDK {
  private readonly chainId: ChainId;
  private readonly publicClient: PublicClient;
  private readonly registryAddress: Address;
  private readonly vaultAddress: Address;

  constructor(options: SunsetSDKOptions) {
    const { chainId, publicClient, registryAddress, vaultAddress } = options;

    this.chainId = chainId;
    this.publicClient = publicClient;

    // Use custom addresses or fall back to deployed addresses
    const addresses = getAddresses(chainId);

    this.registryAddress = registryAddress ?? addresses.registry;
    this.vaultAddress = vaultAddress ?? addresses.vault;

    // Warn if using placeholder addresses
    if (!isDeployed(chainId) && !registryAddress && !vaultAddress) {
      console.warn(
        `Sunset Protocol is not deployed on chain ${chainId}. ` +
          `Provide custom addresses or use a supported network.`
      );
    }
  }

  // ============================================
  // READ METHODS
  // ============================================

  /**
   * Get coverage information for a token
   */
  async getCoverage(token: Address): Promise<CoverageInfo> {
    const result = await this.publicClient.readContract({
      address: this.vaultAddress,
      abi: SunsetVaultABI,
      functionName: "getCoverage",
      args: [token],
    });

    const [depositedAmount, actualBalance, snapshotSupply, snapshotBlock, triggered] = result;

    return {
      depositedAmount,
      actualBalance,
      snapshotSupply,
      snapshotBlock,
      triggered,
    };
  }

  /**
   * Get claimable amount for a token holder
   */
  async getClaimable(token: Address, holder: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.vaultAddress,
      abi: SunsetVaultABI,
      functionName: "getClaimableAmount",
      args: [token, holder],
    });
  }

  /**
   * Get sunset announcement status for a token
   */
  async getSunsetStatus(token: Address): Promise<SunsetStatus> {
    const result = await this.publicClient.readContract({
      address: this.registryAddress,
      abi: SunsetRegistryABI,
      functionName: "getSunsetStatus",
      args: [token],
    });

    const [announced, announcedAt, announcedBy, executableAt, canExecute] = result;

    return {
      announced,
      announcedAt,
      announcedBy,
      executableAt,
      canExecute,
    };
  }

  /**
   * Get project information from the registry
   */
  async getProject(token: Address): Promise<ProjectInfo> {
    const result = await this.publicClient.readContract({
      address: this.registryAddress,
      abi: SunsetRegistryABI,
      functionName: "getProject",
      args: [token],
    });

    const [owner, feeSplitter, tier, active, registeredAt, lastMeaningfulDeposit, totalDeposited] =
      result;

    return {
      owner,
      feeSplitter,
      tier: tier as Tier,
      active,
      registeredAt,
      lastMeaningfulDeposit,
      totalDeposited,
    };
  }

  /**
   * Calculate health score for a token (0-100)
   */
  async getScore(token: Address): Promise<HealthScore> {
    const [project, coverage, sunsetStatus] = await Promise.all([
      this.getProject(token),
      this.getCoverage(token),
      this.getSunsetStatus(token),
    ]);

    // If already sunset, return critical status
    if (coverage.triggered || !project.active) {
      return {
        score: 0,
        factors: {
          coverageRatio: 0,
          activityScore: 0,
          timeScore: 0,
        },
        status: "sunset",
      };
    }

    // If sunset announced, show as critical
    if (sunsetStatus.announced) {
      return {
        score: 10,
        factors: {
          coverageRatio: 0,
          activityScore: 0,
          timeScore: 0,
        },
        status: "critical",
      };
    }

    // Constants from contracts
    const MIN_COVERAGE_PERIOD = 30n * 24n * 60n * 60n; // 30 days
    const INACTIVITY_THRESHOLD = 120n * 24n * 60n * 60n; // 120 days
    const MIN_MEANINGFUL_DEPOSIT = BigInt(1e15); // 0.001 ETH

    const now = BigInt(Math.floor(Date.now() / 1000));

    // Factor 1: Coverage ratio (0-40 points)
    // More ETH in the pool = higher score
    let coverageRatio = 0;
    if (project.totalDeposited > 0n) {
      const ratio = Number(coverage.actualBalance) / Number(project.totalDeposited);
      coverageRatio = Math.min(ratio * 40, 40);
    }

    // Factor 2: Activity score (0-40 points)
    // Based on time since last meaningful deposit
    let activityScore = 40;
    const timeSinceDeposit = now - project.lastMeaningfulDeposit;
    if (timeSinceDeposit > INACTIVITY_THRESHOLD) {
      activityScore = 0;
    } else if (timeSinceDeposit > INACTIVITY_THRESHOLD / 2n) {
      activityScore = 20;
    } else if (timeSinceDeposit > INACTIVITY_THRESHOLD / 4n) {
      activityScore = 30;
    }

    // Factor 3: Time score (0-20 points)
    // How long the project has been registered
    let timeScore = 0;
    const timeRegistered = now - project.registeredAt;
    if (timeRegistered >= MIN_COVERAGE_PERIOD) {
      timeScore = 20;
    } else {
      timeScore = Number((timeRegistered * 20n) / MIN_COVERAGE_PERIOD);
    }

    const totalScore = Math.round(coverageRatio + activityScore + timeScore);

    let status: HealthScore["status"];
    if (totalScore >= 70) {
      status = "healthy";
    } else if (totalScore >= 40) {
      status = "at-risk";
    } else {
      status = "critical";
    }

    return {
      score: totalScore,
      factors: {
        coverageRatio: Math.round(coverageRatio),
        activityScore: Math.round(activityScore),
        timeScore: Math.round(timeScore),
      },
      status,
    };
  }

  /**
   * Check if a token is registered
   */
  async isRegistered(token: Address): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.registryAddress,
      abi: SunsetRegistryABI,
      functionName: "isRegistered",
      args: [token],
    });
  }

  /**
   * Check if a holder has already claimed
   */
  async hasClaimed(token: Address, holder: Address): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.vaultAddress,
      abi: SunsetVaultABI,
      functionName: "hasClaimed",
      args: [token, holder],
    });
  }

  /**
   * Get all registered tokens
   */
  async getRegisteredTokens(): Promise<readonly Address[]> {
    return this.publicClient.readContract({
      address: this.registryAddress,
      abi: SunsetRegistryABI,
      functionName: "getRegisteredTokens",
    });
  }

  /**
   * Check if owner can trigger sunset
   */
  async canOwnerTrigger(token: Address): Promise<{ canTrigger: boolean; timeRemaining: bigint }> {
    const result = await this.publicClient.readContract({
      address: this.registryAddress,
      abi: SunsetRegistryABI,
      functionName: "canOwnerTrigger",
      args: [token],
    });
    return { canTrigger: result[0], timeRemaining: result[1] };
  }

  /**
   * Check if community can trigger sunset (due to inactivity)
   */
  async canCommunityTrigger(
    token: Address
  ): Promise<{ canTrigger: boolean; timeRemaining: bigint }> {
    const result = await this.publicClient.readContract({
      address: this.registryAddress,
      abi: SunsetRegistryABI,
      functionName: "canCommunityTrigger",
      args: [token],
    });
    return { canTrigger: result[0], timeRemaining: result[1] };
  }

  // ============================================
  // WRITE METHODS (return unsigned transactions)
  // ============================================

  /**
   * Create unsigned transaction to register a token
   */
  register(token: Address, feeSplitter: Address, tier: Tier): UnsignedTransaction {
    const data = encodeFunctionData({
      abi: SunsetRegistryABI,
      functionName: "register",
      args: [token, feeSplitter, tier],
    });

    return {
      to: this.registryAddress,
      data,
      chainId: this.chainId,
    };
  }

  /**
   * Create unsigned transaction to announce a sunset
   */
  announceSunset(token: Address): UnsignedTransaction {
    const data = encodeFunctionData({
      abi: SunsetRegistryABI,
      functionName: "announceSunset",
      args: [token],
    });

    return {
      to: this.registryAddress,
      data,
      chainId: this.chainId,
    };
  }

  /**
   * Create unsigned transaction to execute a sunset
   */
  executeSunset(token: Address): UnsignedTransaction {
    const data = encodeFunctionData({
      abi: SunsetRegistryABI,
      functionName: "executeSunset",
      args: [token],
    });

    return {
      to: this.registryAddress,
      data,
      chainId: this.chainId,
    };
  }

  /**
   * Create unsigned transaction to cancel a sunset
   */
  cancelSunset(token: Address): UnsignedTransaction {
    const data = encodeFunctionData({
      abi: SunsetRegistryABI,
      functionName: "cancelSunset",
      args: [token],
    });

    return {
      to: this.registryAddress,
      data,
      chainId: this.chainId,
    };
  }

  /**
   * Create unsigned transaction to claim from the vault
   */
  claim(token: Address): UnsignedTransaction {
    const data = encodeFunctionData({
      abi: SunsetVaultABI,
      functionName: "claim",
      args: [token],
    });

    return {
      to: this.vaultAddress,
      data,
      chainId: this.chainId,
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get the registry contract address
   */
  getRegistryAddress(): Address {
    return this.registryAddress;
  }

  /**
   * Get the vault contract address
   */
  getVaultAddress(): Address {
    return this.vaultAddress;
  }

  /**
   * Get the chain ID
   */
  getChainId(): ChainId {
    return this.chainId;
  }
}
