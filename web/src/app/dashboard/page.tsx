'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'

export default function DashboardPage() {
  const { isConnected, address } = useAccount()
  const [searchToken, setSearchToken] = useState('')

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Check your coverage</h1>
          <p className="text-zinc-400">Connect your wallet to see tokens you hold with sunset coverage</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400 mb-8">Check coverage for tokens you hold</p>

        {/* Search */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-8">
          <h2 className="text-lg font-semibold mb-4">Search token</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Token address (0x...)"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={() => alert('Search coming soon — contracts not deployed yet')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition"
            >
              Check
            </button>
          </div>
        </div>

        {/* Your Covered Tokens */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-8">
          <h2 className="text-lg font-semibold mb-4">Your covered tokens</h2>
          <p className="text-zinc-500 text-center py-8">
            No covered tokens found in your wallet.
            <br />
            <span className="text-sm">Tokens with sunset coverage will appear here.</span>
          </p>
        </div>

        {/* Claimable */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Claimable sunsets</h2>
          <p className="text-zinc-500 text-center py-8">
            No claimable sunsets.
            <br />
            <span className="text-sm">When a covered token sunsets, you can claim your share here.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
