import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { publicClient, addresses, vaultAbi, registryAbi, getTierInfo, formatWei, isTokenRegistered } from '@/lib/contracts'

// Cache for 30 seconds
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 30 * 1000

function calculateActivityScore(registeredAt: number): number {
  const currentTime = Math.floor(Date.now() / 1000)
  const daysSinceRegistration = (currentTime - registeredAt) / 86400
  
  // More recent = higher score
  if (daysSinceRegistration < 7) return 20    // Less than a week
  if (daysSinceRegistration < 30) return 15   // Less than a month
  if (daysSinceRegistration < 90) return 10   // Less than 3 months
  if (daysSinceRegistration < 180) return 5   // Less than 6 months
  return 0                                      // 6+ months
}

function getStatus(score: number, isSunset: boolean, isRegistered: boolean): string {
  if (!isRegistered) return 'unprotected'
  if (isSunset) return 'sunset'
  if (score >= 70) return 'healthy'
  if (score >= 40) return 'warning'
  return 'at-risk'
}

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
    const cacheKey = `score:${token}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Check if registered
    const registered = await isTokenRegistered(token as `0x${string}`)

    if (!registered) {
      const response = {
        token,
        score: 0,
        breakdown: {
          registered: 0,
          coverage: 0,
          tier: 0,
          activity: 0,
        },
        status: 'unprotected',
        message: 'Token is not registered with Sunset Protocol',
      }
      cache.set(cacheKey, { data: response, timestamp: Date.now() })
      return NextResponse.json(response)
    }

    // Get project info using getProject
    const projectResult = await publicClient.readContract({
      address: addresses.registry,
      abi: registryAbi,
      functionName: 'getProject',
      args: [token as `0x${string}`],
    })
    const [owner, feeSplitter, tier, active, registeredAt, lastMeaningfulDeposit, totalDeposited] = projectResult

    // Get coverage info
    const coverageResult = await publicClient.readContract({
      address: addresses.vault,
      abi: vaultAbi,
      functionName: 'getCoverage',
      args: [token as `0x${string}`],
    })
    const [depositedAmount, actualBalance, snapshotSupply, snapshotBlock, triggered] = coverageResult

    // Calculate score breakdown
    const breakdown = {
      registered: 40, // +40 for being registered
      coverage: 0,
      tier: 0,
      activity: 0,
    }

    // Coverage score (max 30 points)
    // Convert wei to ETH for scoring
    const coverageEth = Number(actualBalance) / 1e18
    if (coverageEth >= 5) breakdown.coverage = 30
    else if (coverageEth >= 1) breakdown.coverage = 20
    else if (coverageEth >= 0.1) breakdown.coverage = 10
    else if (coverageEth >= 0.01) breakdown.coverage = 5
    else breakdown.coverage = Math.min(30, Math.floor(coverageEth * 60))

    // Tier bonus (max 10 points)
    const tierNum = Number(tier)
    if (tierNum >= 1) breakdown.tier = 10  // Premium
    else breakdown.tier = 5                 // Standard

    // Activity score (max 20 points)
    breakdown.activity = calculateActivityScore(Number(registeredAt))

    // Total score
    const score = Math.min(100, breakdown.registered + breakdown.coverage + breakdown.tier + breakdown.activity)
    const status = getStatus(score, triggered, true)

    const tierInfo = getTierInfo(tierNum)
    const effectiveCoverage = (Number(actualBalance) * tierInfo.multiplier) / 1e18

    const response = {
      token,
      score,
      breakdown,
      status,
      details: {
        tier: tierNum,
        tierName: tierInfo.name,
        coverage: `${formatWei(actualBalance)} ETH`,
        effectiveCoverage: `${effectiveCoverage.toFixed(6)} ETH`,
        isSunset: triggered,
        registeredAt: Number(registeredAt),
        feeSplitter,
        owner,
      },
    }

    cache.set(cacheKey, { data: response, timestamp: Date.now() })
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error calculating score:', error)
    return NextResponse.json({ error: 'Failed to calculate score' }, { status: 500 })
  }
}
