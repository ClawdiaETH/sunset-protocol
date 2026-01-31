#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { encodeFunctionData } from 'viem'

// API base URL - configurable via env
const API_URL = process.env.SUNSET_API_URL || 'https://sunset.example.com'

// Contract addresses
const CONTRACTS = {
  mainnet: {
    vault: '0x0000000000000000000000000000000000000000',
    registry: '0x0000000000000000000000000000000000000000',
  },
  sepolia: {
    vault: '0x96697d80b0f248717f336Da4E280fc9A1965c4e9',
    registry: '0xAF664d1f1003d88f661546866E96625171222036',
  },
}

const NETWORK = process.env.SUNSET_NETWORK === 'mainnet' ? 'mainnet' : 'sepolia'
const addresses = CONTRACTS[NETWORK]

// ABIs for tx generation
const registryAbi = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'tier', type: 'uint256' },
    ],
    outputs: [{ name: 'splitter', type: 'address' }],
  },
] as const

const vaultAbi = [
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
] as const

// Helper to fetch from REST API
async function fetchAPI(endpoint: string) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    // Fallback to direct RPC if API is unavailable
    throw new Error(`Failed to fetch from API: ${error}`)
  }
}

// Create server
const server = new Server(
  {
    name: 'sunset-protocol',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'sunset_check_coverage',
      description: 'Check if a token is covered by Sunset Protocol and get coverage details',
      inputSchema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'Token contract address (0x...)',
          },
        },
        required: ['token'],
      },
    },
    {
      name: 'sunset_get_claimable',
      description: 'Get the claimable amount for a holder of a sunset token',
      inputSchema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'Token contract address (0x...)',
          },
          holder: {
            type: 'string',
            description: 'Holder wallet address (0x...)',
          },
        },
        required: ['token', 'holder'],
      },
    },
    {
      name: 'sunset_list_projects',
      description: 'List all projects registered with Sunset Protocol',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'sunset_get_score',
      description: 'Get the Sunset Score for a token (0-100 health rating)',
      inputSchema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'Token contract address (0x...)',
          },
        },
        required: ['token'],
      },
    },
    {
      name: 'sunset_get_register_tx',
      description: 'Get transaction data to register a token for Sunset Protocol coverage',
      inputSchema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'Token contract address (0x...)',
          },
          tier: {
            type: 'number',
            description: 'Coverage tier: 0=Basic, 1=Growth, 2=Standard, 3=Premium, 4=Elite',
          },
        },
        required: ['token', 'tier'],
      },
    },
    {
      name: 'sunset_get_claim_tx',
      description: 'Get transaction data to claim your share from a sunset token',
      inputSchema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'Token contract address (0x...)',
          },
        },
        required: ['token'],
      },
    },
  ],
}))

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'sunset_check_coverage': {
        const token = args?.token as string
        if (!token?.startsWith('0x')) {
          return { content: [{ type: 'text', text: 'Error: Invalid token address' }] }
        }

        const data = await fetchAPI(`/api/coverage/${token}`)
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'sunset_get_claimable': {
        const token = args?.token as string
        const holder = args?.holder as string

        if (!token?.startsWith('0x')) {
          return { content: [{ type: 'text', text: 'Error: Invalid token address' }] }
        }
        if (!holder?.startsWith('0x')) {
          return { content: [{ type: 'text', text: 'Error: Invalid holder address' }] }
        }

        const data = await fetchAPI(`/api/claimable/${token}/${holder}`)
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'sunset_list_projects': {
        const data = await fetchAPI('/api/projects')
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'sunset_get_score': {
        const token = args?.token as string
        if (!token?.startsWith('0x')) {
          return { content: [{ type: 'text', text: 'Error: Invalid token address' }] }
        }

        const data = await fetchAPI(`/api/score/${token}`)
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        }
      }

      case 'sunset_get_register_tx': {
        const token = args?.token as string
        const tier = args?.tier as number

        if (!token?.startsWith('0x')) {
          return { content: [{ type: 'text', text: 'Error: Invalid token address' }] }
        }
        if (typeof tier !== 'number' || tier < 0 || tier > 4) {
          return { content: [{ type: 'text', text: 'Error: Invalid tier (must be 0-4)' }] }
        }

        const calldata = encodeFunctionData({
          abi: registryAbi,
          functionName: 'register',
          args: [token as `0x${string}`, BigInt(tier)],
        })

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              to: addresses.registry,
              data: calldata,
              value: '0',
              description: `Register token ${token} for Sunset Protocol coverage (Tier ${tier})`,
              network: NETWORK,
              chainId: NETWORK === 'mainnet' ? 8453 : 84532,
            }, null, 2),
          }],
        }
      }

      case 'sunset_get_claim_tx': {
        const token = args?.token as string

        if (!token?.startsWith('0x')) {
          return { content: [{ type: 'text', text: 'Error: Invalid token address' }] }
        }

        const calldata = encodeFunctionData({
          abi: vaultAbi,
          functionName: 'claim',
          args: [token as `0x${string}`],
        })

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              to: addresses.vault,
              data: calldata,
              value: '0',
              description: `Claim your share from sunset token ${token}`,
              network: NETWORK,
              chainId: NETWORK === 'mainnet' ? 8453 : 84532,
            }, null, 2),
          }],
        }
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] }
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
    }
  }
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Sunset Protocol MCP server running')
  console.error(`API URL: ${API_URL}`)
  console.error(`Network: ${NETWORK}`)
}

main().catch(console.error)
