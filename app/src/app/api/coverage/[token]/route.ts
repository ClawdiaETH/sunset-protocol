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
    const cacheKey = `coverage:${token}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Check if registered
    const isRegistered = await isTokenRegistered(token as `0x${string}`)

    if (!isRegistered) {
      const response = {
        token,
        registered: false,
        active: false,
        tier: null,
        tierName: null,
        coverage: {
          deposited: '0',
          actual: '0',
          multiplier: 1,
          effective: '0',
        },
        activity: {
          registeredAt: null,
          lastMeaningfulDeposit: null,
          totalDeposited: '0',
        },
        triggers: {
          ownerCanTrigger: false,
          ownerUnlockAt: null,
          ownerUnlockIn: 0,
          communityCanTrigger: false,
          communityUnlockAt: null,
          communityUnlockIn: 0,
        },
        isSunset: false,
      }
      cache.set(cacheKey, { data: response, timestamp: Date.now() })
      return NextResponse.json(response)
    }

    // Get project info using getProject
    const [owner, feeSplitter, tier, active, registeredAt, lastMeaningfulDeposit, totalDeposited] = await publicClient.readContract({
      address: addresses.registry,
      abi: registryAbi,
      functionName: 'getProject',
      args: [token as `0x${string}`],
    })

    // Get coverage info from vault
    const [depositedAmount, actualBalance, snapshotSupply, snapshotBlock, triggered] = await publicClient.readContract({
      address: addresses.vault,
      abi: vaultAbi,
      functionName: 'getCoverage',
      args: [token as `0x${string}`],
    })

    // Get trigger status
    let ownerCanTrigger = false
    let ownerTimeRemaining = 0n
    let communityCanTrigger = false
    let communityTimeRemaining = 0n
    let sunsetAnnounced = false
    let sunsetAnnouncedAt = 0n
    let sunsetAnnouncedBy = '0x0000000000000000000000000000000000000000'
    let sunsetExecutableAt = 0n
    let sunsetCanExecute = false

    try {
      [ownerCanTrigger, ownerTimeRemaining] = await publicClient.readContract({
        address: addresses.registry,
        abi: registryAbi,
        functionName: 'canOwnerTrigger',
        args: [token as `0x${string}`],
      })
      ;[communityCanTrigger, communityTimeRemaining] = await publicClient.readContract({
        address: addresses.registry,
        abi: registryAbi,
        functionName: 'canCommunityTrigger',
        args: [token as `0x${string}`],
      })
      ;[sunsetAnnounced, sunsetAnnouncedAt, sunsetAnnouncedBy, sunsetExecutableAt, sunsetCanExecute] = await publicClient.readContract({
        address: addresses.registry,
        abi: registryAbi,
        functionName: 'getSunsetStatus',
        args: [token as `0x${string}`],
      })
    } catch {
      // Functions might not exist on old contracts
    }

    const tierInfo = getTierInfo(Number(tier))
    const effectiveCoverage = (Number(actualBalance) * tierInfo.multiplier) / 1e18

    // Calculate unlock timestamps
    const now = Math.floor(Date.now() / 1000)
    const ownerUnlockAt = ownerTimeRemaining > 0n ? new Date((now + Number(ownerTimeRemaining)) * 1000).toISOString() : null
    const communityUnlockAt = communityTimeRemaining > 0n ? new Date((now + Number(communityTimeRemaining)) * 1000).toISOString() : null

    // Calculate countdown for announced sunsets
    const currentTime = Math.floor(Date.now() / 1000)
    const countdownSeconds = sunsetAnnounced && sunsetExecutableAt > currentTime 
      ? Number(sunsetExecutableAt) - currentTime 
      : 0

    const response = {
      token,
      registered: true,
      active,
      tier: Number(tier),
      tierName: tierInfo.name,
      owner,
      feeSplitter,
      coverage: {
        deposited: formatWei(depositedAmount),
        actual: formatWei(actualBalance),
        multiplier: tierInfo.multiplier,
        effective: effectiveCoverage.toFixed(6),
      },
      activity: {
        registeredAt: new Date(Number(registeredAt) * 1000).toISOString(),
        lastMeaningfulDeposit: new Date(Number(lastMeaningfulDeposit) * 1000).toISOString(),
        totalDeposited: formatWei(totalDeposited),
      },
      triggers: {
        ownerCanTrigger,
        ownerUnlockAt,
        ownerUnlockIn: Number(ownerTimeRemaining),
        communityCanTrigger,
        communityUnlockAt,
        communityUnlockIn: Number(communityTimeRemaining),
      },
      sunset: {
        announced: sunsetAnnounced,
        announcedAt: sunsetAnnounced ? new Date(Number(sunsetAnnouncedAt) * 1000).toISOString() : null,
        announcedBy: sunsetAnnounced ? sunsetAnnouncedBy : null,
        executableAt: sunsetAnnounced ? new Date(Number(sunsetExecutableAt) * 1000).toISOString() : null,
        countdownSeconds,
        canExecute: sunsetCanExecute,
        triggered,
      },
      snapshotSupply: snapshotSupply.toString(),
      snapshotBlock: Number(snapshotBlock),
    }

    cache.set(cacheKey, { data: response, timestamp: Date.now() })
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching coverage:', error)
    return NextResponse.json({ error: 'Failed to fetch coverage' }, { status: 500 })
  }
}
