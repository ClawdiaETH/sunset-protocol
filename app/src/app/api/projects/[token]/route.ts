import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { publicClient, addresses, vaultAbi, registryAbi, getTierInfo, formatWei, isTokenRegistered } from '@/lib/contracts'

// Cache for 30 seconds
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 30 * 1000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!isAddress(token)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 })
    }

    // Check cache
    const cacheKey = `project:${token}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Get project info
    const [, splitter, owner, tier, registeredAt, active] = await publicClient.readContract({
      address: addresses.registry,
      abi: registryAbi,
      functionName: 'projects',
      args: [token as `0x${string}`],
    })

    // Check if registered
    if (!active || splitter === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ error: 'Token not registered' }, { status: 404 })
    }

    // Get coverage info
    const [deposited, effective, isSunset, snapshotSupply] = await publicClient.readContract({
      address: addresses.vault,
      abi: vaultAbi,
      functionName: 'getTotalCoverage',
      args: [token as `0x${string}`],
    })

    const tierInfo = getTierInfo(Number(tier))

    const response = {
      token,
      splitter,
      owner,
      tier: Number(tier),
      tierName: tierInfo.name,
      multiplier: tierInfo.multiplier,
      sunsetBps: tierInfo.bps,
      registeredAt: Number(registeredAt),
      active,
      coverage: {
        deposited: deposited.toString(),
        depositedFormatted: `${formatWei(deposited)} ETH`,
        effective: effective.toString(),
        effectiveFormatted: `${formatWei(effective)} ETH`,
        isSunset,
        snapshotSupply: snapshotSupply.toString(),
      },
    }

    cache.set(cacheKey, { data: response, timestamp: Date.now() })
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}
