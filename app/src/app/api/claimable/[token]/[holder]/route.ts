import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { publicClient, addresses, vaultAbi, formatWei, isTokenRegistered } from '@/lib/contracts'

// Cache for 30 seconds
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 30 * 1000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; holder: string }> }
) {
  try {
    const { token, holder } = await params

    if (!isAddress(token)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 })
    }
    if (!isAddress(holder)) {
      return NextResponse.json({ error: 'Invalid holder address' }, { status: 400 })
    }

    // Check cache
    const cacheKey = `claimable:${token}:${holder}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Check if registered
    const isRegistered = await isTokenRegistered(token as `0x${string}`)

    if (!isRegistered) {
      return NextResponse.json({
        token,
        holder,
        error: 'Token not registered',
        claimable: '0',
        claimableFormatted: '0 ETH',
        hasClaimed: false,
        canClaim: false,
      })
    }

    // Get coverage state
    const [, , , , triggered] = await publicClient.readContract({
      address: addresses.vault,
      abi: vaultAbi,
      functionName: 'getCoverage',
      args: [token as `0x${string}`],
    })

    // Get claimable amount
    const claimable = await publicClient.readContract({
      address: addresses.vault,
      abi: vaultAbi,
      functionName: 'getClaimableAmount',
      args: [token as `0x${string}`, holder as `0x${string}`],
    })

    // Check if already claimed
    let hasClaimed = false
    try {
      hasClaimed = await publicClient.readContract({
        address: addresses.vault,
        abi: vaultAbi,
        functionName: 'hasClaimed',
        args: [token as `0x${string}`, holder as `0x${string}`],
      })
    } catch {
      // hasClaimed might not exist on old contracts
    }

    const canClaim = triggered && !hasClaimed && claimable > 0n

    const response = {
      token,
      holder,
      claimable: claimable.toString(),
      claimableFormatted: `${formatWei(claimable)} ETH`,
      hasClaimed,
      canClaim,
      isSunset: triggered,
    }

    cache.set(cacheKey, { data: response, timestamp: Date.now() })
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching claimable:', error)
    return NextResponse.json({ error: 'Failed to fetch claimable' }, { status: 500 })
  }
}
