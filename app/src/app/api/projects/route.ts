import { NextResponse } from 'next/server'
import { publicClient, addresses, vaultAbi, registryAbi, getTierInfo, formatWei } from '@/lib/contracts'

// Cache for 60 seconds (projects list changes less frequently)
let projectsCache: { data: unknown; timestamp: number } | null = null
const CACHE_TTL = 60 * 1000

export async function GET() {
  try {
    // Check cache
    if (projectsCache && Date.now() - projectsCache.timestamp < CACHE_TTL) {
      return NextResponse.json(projectsCache.data)
    }

    // Get all registered tokens
    const registeredTokens = await publicClient.readContract({
      address: addresses.registry,
      abi: registryAbi,
      functionName: 'getRegisteredTokens',
    })

    const projects = []
    let totalCoverage = 0n

    // Fetch all projects
    for (const tokenAddress of registeredTokens) {
      try {
        const [owner, feeSplitter, tier, active, registeredAt, lastMeaningfulDeposit, totalDeposited] = await publicClient.readContract({
          address: addresses.registry,
          abi: registryAbi,
          functionName: 'getProject',
          args: [tokenAddress],
        })

        const [depositedAmount, actualBalance, , , triggered] = await publicClient.readContract({
          address: addresses.vault,
          abi: vaultAbi,
          functionName: 'getCoverage',
          args: [tokenAddress],
        })

        totalCoverage += actualBalance
        const tierInfo = getTierInfo(Number(tier))
        const effectiveCoverage = (Number(actualBalance) * tierInfo.multiplier) / 1e18

        projects.push({
          token: tokenAddress,
          owner,
          feeSplitter,
          tier: Number(tier),
          tierName: tierInfo.name,
          active,
          coverage: {
            deposited: formatWei(depositedAmount),
            actual: formatWei(actualBalance),
            effective: effectiveCoverage.toFixed(6),
          },
          activity: {
            registeredAt: new Date(Number(registeredAt) * 1000).toISOString(),
            lastMeaningfulDeposit: new Date(Number(lastMeaningfulDeposit) * 1000).toISOString(),
            totalDeposited: formatWei(totalDeposited),
          },
          isSunset: triggered,
        })
      } catch (e) {
        console.error(`Error fetching project ${tokenAddress}:`, e)
      }
    }

    const response = {
      count: registeredTokens.length,
      totalCoverage: formatWei(totalCoverage),
      projects,
    }

    projectsCache = { data: response, timestamp: Date.now() }
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
