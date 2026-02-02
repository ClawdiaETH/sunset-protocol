import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther, formatUnits, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract addresses (will be updated when V2 is deployed)
const BURNER_ADDRESS = '0x0000000000000000000000000000000000000000'; // V2 pending

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// ABI for cost estimation
const BURNER_ABI = [
  {
    inputs: [],
    name: 'estimateRegistrationCost',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'REGISTRATION_BURN_AMOUNT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const REGISTRATION_BURN_AMOUNT = 25_000_000n * 10n ** 18n;
const DEFAULT_ETH_ESTIMATE = parseEther('0.1');

export async function GET() {
  try {
    // Check if V2 burner is deployed
    const isV2Deployed = BURNER_ADDRESS !== '0x0000000000000000000000000000000000000000';
    
    if (!isV2Deployed) {
      // Return default estimate
      const buffer = DEFAULT_ETH_ESTIMATE / 10n; // 10% buffer
      const recommended = DEFAULT_ETH_ESTIMATE + buffer;

      return NextResponse.json({
        estimatedEthNeeded: formatEther(DEFAULT_ETH_ESTIMATE),
        burnAmount: REGISTRATION_BURN_AMOUNT.toString(),
        burnAmountFormatted: '25,000,000 CLAWDIA',
        recommendedBuffer: formatEther(buffer),
        recommendedValue: formatEther(recommended),
        note: 'V2 contracts pending deployment - showing default estimate. Add 10% buffer for slippage.',
        v2Deployed: false,
      });
    }

    // V2 is deployed - get actual estimate from burner
    const estimatedEthNeeded = await client.readContract({
      address: BURNER_ADDRESS as `0x${string}`,
      abi: BURNER_ABI,
      functionName: 'estimateRegistrationCost',
    });

    const buffer = estimatedEthNeeded / 10n; // 10% buffer
    const recommended = estimatedEthNeeded + buffer;

    return NextResponse.json({
      estimatedEthNeeded: formatEther(estimatedEthNeeded),
      burnAmount: REGISTRATION_BURN_AMOUNT.toString(),
      burnAmountFormatted: '25,000,000 CLAWDIA',
      recommendedBuffer: formatEther(buffer),
      recommendedValue: formatEther(recommended),
      note: 'Add recommended buffer for slippage protection. ETH cost varies with $CLAWDIA price.',
      v2Deployed: true,
    });
  } catch (error) {
    console.error('Error estimating registration cost:', error);
    
    // Return default on error
    const buffer = DEFAULT_ETH_ESTIMATE / 10n;
    const recommended = DEFAULT_ETH_ESTIMATE + buffer;

    return NextResponse.json({
      estimatedEthNeeded: formatEther(DEFAULT_ETH_ESTIMATE),
      burnAmount: REGISTRATION_BURN_AMOUNT.toString(),
      burnAmountFormatted: '25,000,000 CLAWDIA',
      recommendedBuffer: formatEther(buffer),
      recommendedValue: formatEther(recommended),
      note: 'Error fetching live estimate - showing default. Add 10% buffer for slippage.',
      v2Deployed: false,
      error: 'Failed to fetch live estimate',
    });
  }
}
