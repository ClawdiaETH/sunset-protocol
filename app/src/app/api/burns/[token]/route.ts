import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther, formatUnits, isAddress } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract addresses
const REGISTRY_ADDRESS = '0xb79f515b55D4ea0f70b24C67F1650513cE45CC54';
const BURNER_ADDRESS = '0x0000000000000000000000000000000000000000'; // V2 pending

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// ABI for project info (V1)
const REGISTRY_ABI_V1 = [
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'getProject',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'feeSplitter', type: 'address' },
      { name: 'tier', type: 'uint8' },
      { name: 'active', type: 'bool' },
      { name: 'registeredAt', type: 'uint256' },
      { name: 'lastMeaningfulDeposit', type: 'uint256' },
      { name: 'totalDeposited', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'isRegistered',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ABI for V2 registry (includes clawdiaBurned)
const REGISTRY_ABI_V2 = [
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'getProject',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'feeSplitter', type: 'address' },
      { name: 'tier', type: 'uint8' },
      { name: 'active', type: 'bool' },
      { name: 'registeredAt', type: 'uint256' },
      { name: 'lastMeaningfulDeposit', type: 'uint256' },
      { name: 'totalDeposited', type: 'uint256' },
      { name: 'clawdiaBurned', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ABI for burner
const BURNER_ABI = [
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'registrationBurnAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const REGISTRATION_BURN_AMOUNT = 25_000_000n * 10n ** 18n;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!isAddress(token)) {
      return NextResponse.json(
        { error: 'Invalid token address' },
        { status: 400 }
      );
    }

    // Check if token is registered
    const isRegistered = await client.readContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI_V1,
      functionName: 'isRegistered',
      args: [token as `0x${string}`],
    });

    if (!isRegistered) {
      return NextResponse.json({
        token,
        registered: false,
        clawdiaBurned: '0',
        burnedFormatted: '0 CLAWDIA',
        ethSpent: '0',
        registeredAt: 0,
        note: 'Token not registered with Sunset Protocol',
      });
    }

    // Get project info
    const project = await client.readContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI_V1,
      functionName: 'getProject',
      args: [token as `0x${string}`],
    });

    const [owner, feeSplitter, tier, active, registeredAt, lastMeaningfulDeposit, totalDeposited] = project;

    // Check if V2 burner is deployed
    const isV2Deployed = BURNER_ADDRESS !== '0x0000000000000000000000000000000000000000';
    
    let clawdiaBurned = 0n;
    let ethSpent = '0';

    if (isV2Deployed) {
      // Try to get actual burn data from burner
      try {
        clawdiaBurned = await client.readContract({
          address: BURNER_ADDRESS as `0x${string}`,
          abi: BURNER_ABI,
          functionName: 'registrationBurnAmount',
          args: [token as `0x${string}`],
        });
      } catch {
        // Use default if not found
        clawdiaBurned = REGISTRATION_BURN_AMOUNT;
      }
    } else {
      // V1 registry - estimate based on registration (all V2 registrations burn 25M)
      // For V1 registrations, burn would be 0
      clawdiaBurned = 0n;
    }

    return NextResponse.json({
      token,
      registered: true,
      owner,
      tier: tier === 0 ? 'Standard' : 'Premium',
      active,
      clawdiaBurned: clawdiaBurned.toString(),
      burnedFormatted: clawdiaBurned > 0n 
        ? `${formatUnits(clawdiaBurned, 18)} CLAWDIA` 
        : '0 CLAWDIA (V1 registration)',
      ethSpent,
      registeredAt: Number(registeredAt),
      registeredAtDate: new Date(Number(registeredAt) * 1000).toISOString(),
      note: clawdiaBurned > 0n 
        ? 'V2 registration with $CLAWDIA burn'
        : 'V1 registration (before burn mechanism)',
      v2Deployed: isV2Deployed,
    });
  } catch (error) {
    console.error('Error fetching burn info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch burn information',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
