'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'

export default function DashboardPage() {
  const { isConnected, address } = useAccount()
  const [searchToken, setSearchToken] = useState('')

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-float">🔍</div>
          <h1 className="text-3xl font-bold mb-3">Check your coverage</h1>
          <p className="text-zinc-400 text-lg mb-8">Connect to see tokens you hold with sunset coverage</p>
          <div className="text-sm text-zinc-500">
            Use the connect button in the header ↗
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Connected: {address?.slice(0, 8)}...{address?.slice(-6)}
          </div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-400">Monitor your coverage and claim sunsets</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <QuickStat icon="🛡️" label="Covered tokens held" value="0" />
          <QuickStat icon="💰" label="Your coverage value" value="—" />
          <QuickStat icon="🎁" label="Claimable" value="—" />
        </div>

        {/* Search */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🔍</span> Search any token
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Token address (0x...)"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-orange-500/50 font-mono"
            />
            <button
              onClick={() => alert('Search coming soon — contracts not deployed yet')}
              className="btn-primary"
            >
              Check
            </button>
          </div>
        </div>

        {/* Your Covered Tokens */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span>🪙</span> Your covered tokens
          </h2>
          <div className="text-center py-12">
            <div className="text-5xl mb-4 opacity-50">🌅</div>
            <p className="text-zinc-400 mb-2">No covered tokens found</p>
            <p className="text-sm text-zinc-500 mb-6">Tokens with sunset coverage will appear here</p>
            <Link href="/tokens" className="btn-secondary inline-block">
              Browse covered tokens →
            </Link>
          </div>
        </div>

        {/* Claimable Sunsets */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span>🎁</span> Claimable sunsets
          </h2>
          <div className="text-center py-12">
            <div className="text-5xl mb-4 opacity-50">✅</div>
            <p className="text-zinc-400 mb-2">No claimable sunsets</p>
            <p className="text-sm text-zinc-500">
              When a covered token sunsets, you can claim your share here
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-5 flex items-center gap-4">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold gradient-text">{value}</div>
        <div className="text-sm text-zinc-500">{label}</div>
      </div>
    </div>
  )
}
