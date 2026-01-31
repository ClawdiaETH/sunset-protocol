import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { publicClient, addresses, vaultAbi, registryAbi, getTierInfo, formatWei } from '@/lib/contracts'

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

    // Get project info using getProject
    const projectResult = await publicClient.readContract({
      address: addresses.registry,
      abi: registryAbi,
      functionName: 'getProject',
      args: [token as `0x${string}`],
    })
    const [owner, feeSplitter, tier, active, registeredAt, lastMeaningfulDeposit, totalDeposited] = projectResult

    // Check if registered
    if (!active || feeSplitter === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json({ error: 'Token not registered' }, { status: 404 })
    }

    // Get coverage info from vault
    const coverageResult = await publicClient.readContract({
      address: addresses.vault,
      abi: vaultAbi,
      functionName: 'getCoverage',
      args: [token as `0x${string}`],
    })
    const [depositedAmount, actualBalance, snapshotSupply, snapshotBlock, triggered] = coverageResult

    const tierInfo = getTierInfo(Number(tier))
    const effectiveCoverage = (Number(actualBalance) * tierInfo.multiplier) / 1e18

    const response = {
      token,
      feeSplitter,
      owner,
      tier: Number(tier),
      tierName: tierInfo.name,
      multiplier: tierInfo.multiplier,
      sunsetBps: tierInfo.bps,
      registeredAt: Number(registeredAt),
      registeredAtISO: new Date(Number(registeredAt) * 1000).toISOString(),
      active,
      coverage: {
        deposited: depositedAmount.toString(),
        depositedFormatted: `${formatWei(depositedAmount)} ETH`,
        actual: actualBalance.toString(),
        actualFormatted: `${formatWei(actualBalance)} ETH`,
        effective: effectiveCoverage.toFixed(6),
        effectiveFormatted: `${effectiveCoverage.toFixed(6)} ETH`,
        isSunset: triggered,
        snapshotSupply: snapshotSupply.toString(),
        snapshotBlock: Number(snapshotBlock),
      },
      activity: {
        lastMeaningfulDeposit: new Date(Number(lastMeaningfulDeposit) * 1000).toISOString(),
        totalDeposited: formatWei(totalDeposited),
      },
    }

    cache.set(cacheKey, { data: response, timestamp: Date.now() })
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}
