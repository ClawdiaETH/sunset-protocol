import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import { Attribution } from 'ox/erc8021'

// Base Builder Code attribution (ERC-8021) — bc_lul4sldw
const DATA_SUFFIX = Attribution.toDataSuffix({ codes: ['bc_lul4sldw'] })

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
  dataSuffix: DATA_SUFFIX,
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
