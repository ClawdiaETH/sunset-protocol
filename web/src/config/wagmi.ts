import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Sunset Protocol' }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})

// Contract addresses (update after deployment)
export const CONTRACTS = {
  [base.id]: {
    vault: '0x0000000000000000000000000000000000000000',
    registry: '0x0000000000000000000000000000000000000000',
  },
  [baseSepolia.id]: {
    vault: '0x0000000000000000000000000000000000000000',
    registry: '0x0000000000000000000000000000000000000000',
  },
} as const
