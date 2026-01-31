import { createPublicClient, http, formatEther } from 'viem'
import { base, baseSepolia } from 'viem/chains'

// Contract addresses
export const CONTRACTS = {
  mainnet: {
    vault: '0x0000000000000000000000000000000000000000' as const,
    registry: '0x0000000000000000000000000000000000000000' as const,
  },
  sepolia: {
    vault: '0x96697d80b0f248717f336Da4E280fc9A1965c4e9' as const,
    registry: '0xAF664d1f1003d88f661546866E96625171222036' as const,
  },
}

// Use sepolia for now, switch to mainnet when deployed
const USE_MAINNET = false
const chain = USE_MAINNET ? base : baseSepolia
const NETWORK = USE_MAINNET ? 'mainnet' : 'sepolia' as const

export const publicClient = createPublicClient({
  chain,
  transport: http(),
})

export const addresses = CONTRACTS[NETWORK]

// Vault ABI (updated for new contract)
export const vaultAbi = [
  {
    name: 'getCoverage',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'depositedAmount', type: 'uint256' },
      { name: 'actualBalance', type: 'uint256' },
      { name: 'snapshotSupply', type: 'uint256' },
      { name: 'snapshotBlock', type: 'uint256' },
      { name: 'triggered', type: 'bool' },
    ],
  },
  {
    name: 'getClaimableAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'holder', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getActualBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'hasClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'holder', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
] as const

// Registry ABI (updated for new contract)
export const registryAbi = [
  {
    name: 'getProject',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'feeSplitter', type: 'address' },
      { name: 'tier', type: 'uint8' },
      { name: 'active', type: 'bool' },
      { name: 'registeredAt', type: 'uint256' },
      { name: 'lastMeaningfulDeposit', type: 'uint256' },
      { name: 'totalDeposited', type: 'uint256' },
    ],
  },
  {
    name: 'canOwnerTrigger',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'canTrigger', type: 'bool' },
      { name: 'timeRemaining', type: 'uint256' },
    ],
  },
  {
    name: 'canCommunityTrigger',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'canTrigger', type: 'bool' },
      { name: 'timeRemaining', type: 'uint256' },
    ],
  },
  {
    name: 'getProjectCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getRegisteredTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    name: 'isRegistered',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'isActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  // Legacy compatibility - projects mapping
  {
    name: 'projects',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'feeSplitter', type: 'address' },
      { name: 'tier', type: 'uint8' },
      { name: 'active', type: 'bool' },
      { name: 'registeredAt', type: 'uint256' },
      { name: 'lastMeaningfulDeposit', type: 'uint256' },
      { name: 'totalDeposited', type: 'uint256' },
    ],
  },
] as const

// Tier names and multipliers
export const TIERS = {
  0: { name: 'Standard', multiplier: 1.2 },
  1: { name: 'Premium', multiplier: 1.5 },
} as const

export function getTierInfo(tier: number) {
  return TIERS[tier as keyof typeof TIERS] || TIERS[0]
}

export function formatWei(wei: bigint): string {
  return formatEther(wei)
}

// Helper to check if token is registered
export async function isTokenRegistered(token: `0x${string}`): Promise<boolean> {
  try {
    const isRegistered = await publicClient.readContract({
      address: addresses.registry,
      abi: registryAbi,
      functionName: 'isRegistered',
      args: [token],
    })
    return isRegistered
  } catch {
    // Fallback: check if owner is non-zero
    try {
      const [owner] = await publicClient.readContract({
        address: addresses.registry,
        abi: registryAbi,
        functionName: 'getProject',
        args: [token],
      })
      return owner !== '0x0000000000000000000000000000000000000000'
    } catch {
      return false
    }
  }
}
