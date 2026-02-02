import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract addresses (will be updated when V2 is deployed)
const REGISTRY_ADDRESS = '0xb79f515b55D4ea0f70b24C67F1650513cE45CC54';
const BURNER_ADDRESS = '0x0000000000000000000000000000000000000000'; // V2 pending

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// ABI for burn stats
const BURNER_ABI = [
  {
    inputs: [],
    name: 'getBurnStats',
    outputs: [
      { name: '_totalRegistrationBurns', type: 'uint256' },
      { name: '_totalBuybackBurns', type: 'uint256' },
      { name: '_totalBurned', type: 'uint256' },
      { name: '_totalEthSpent', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const REGISTRY_ABI = [
  {
    inputs: [],
    name: 'getProjectCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'accumulatedAdminFees',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const REGISTRATION_BURN_AMOUNT = 25_000_000n * 10n ** 18n;

export async function GET() {
  try {
    // Check if V2 burner is deployed
    const isV2Deployed = BURNER_ADDRESS !== '0x0000000000000000000000000000000000000000';
    
    if (!isV2Deployed) {
      // Return estimated stats based on registration count
      let registrationCount = 0n;
      
      try {
        registrationCount = await client.readContract({
          address: REGISTRY_ADDRESS as `0x${string}`,
          abi: REGISTRY_ABI,
          functionName: 'getProjectCount',
        });
      } catch (e) {
        // If registry not deployed or error, return zeros
      }

      const estimatedBurns = registrationCount * REGISTRATION_BURN_AMOUNT;
      
      return NextResponse.json({
        totalRegistrationBurns: estimatedBurns.toString(),
        totalBuybackBurns: '0',
        totalBurned: estimatedBurns.toString(),
        totalBurnedFormatted: `${formatUnits(estimatedBurns, 18)} CLAWDIA`,
        totalEthSpent: '0',
        registrationCount: Number(registrationCount),
        pendingBuyback: '0',
        note: 'V2 contracts pending deployment - showing estimated burns based on registrations',
        v2Deployed: false,
      });
    }

    // V2 is deployed - get actual stats
    const [burnStats, projectCount, pendingBuyback] = await Promise.all([
      client.readContract({
        address: BURNER_ADDRESS as `0x${string}`,
        abi: BURNER_ABI,
        functionName: 'getBurnStats',
      }),
      client.readContract({
        address: REGISTRY_ADDRESS as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'getProjectCount',
      }),
      client.readContract({
        address: REGISTRY_ADDRESS as `0x${string}`,
        abi: REGISTRY_ABI,
        functionName: 'accumulatedAdminFees',
      }).catch(() => 0n),
    ]);

    const [totalRegistrationBurns, totalBuybackBurns, totalBurned, totalEthSpent] = burnStats;

    return NextResponse.json({
      totalRegistrationBurns: totalRegistrationBurns.toString(),
      totalBuybackBurns: totalBuybackBurns.toString(),
      totalBurned: totalBurned.toString(),
      totalBurnedFormatted: `${formatUnits(totalBurned, 18)} CLAWDIA`,
      totalEthSpent: formatEther(totalEthSpent),
      registrationCount: Number(projectCount),
      pendingBuyback: formatEther(pendingBuyback),
      v2Deployed: true,
    });
  } catch (error) {
    console.error('Error fetching burn stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch burn statistics',
        totalRegistrationBurns: '0',
        totalBuybackBurns: '0',
        totalBurned: '0',
        totalBurnedFormatted: '0 CLAWDIA',
        totalEthSpent: '0',
        registrationCount: 0,
        pendingBuyback: '0',
        v2Deployed: false,
      },
      { status: 500 }
    );
  }
}
