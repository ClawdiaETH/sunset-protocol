'use client'

import { useState } from 'react'

// Mock data - will be replaced with contract reads
const MOCK_TOKENS = [
  {
    address: '0x1234...5678',
    name: '$EXAMPLE',
    tier: 'Standard',
    coverage: '0.5 ETH',
    status: 'active',
    registeredAt: '2 days ago',
  },
]

export default function TokensPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'sunset'>('all')

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Covered tokens</h1>
        <p className="text-zinc-400 mb-8">Browse all tokens registered with Sunset Protocol</p>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterButton>
          <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
            Active
          </FilterButton>
          <FilterButton active={filter === 'sunset'} onClick={() => setFilter('sunset')}>
            Sunset
          </FilterButton>
        </div>

        {/* Token List */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-zinc-800/50 text-sm text-zinc-400">
            <div>Token</div>
            <div>Tier</div>
            <div>Coverage</div>
            <div>Status</div>
            <div>Registered</div>
          </div>

          {/* Empty State */}
          <div className="px-6 py-12 text-center text-zinc-500">
            <div className="text-4xl mb-4">🌅</div>
            <p>No tokens registered yet</p>
            <p className="text-sm mt-1">Be the first to register your token for coverage!</p>
          </div>

          {/* Example Row (hidden for now) */}
          {false && MOCK_TOKENS.map((token) => (
            <div 
              key={token.address}
              className="grid grid-cols-5 gap-4 px-6 py-4 border-t border-zinc-800 hover:bg-zinc-800/50 transition"
            >
              <div>
                <span className="font-medium">{token.name}</span>
                <span className="text-zinc-500 text-sm block">{token.address}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm bg-zinc-800 px-2 py-1 rounded">{token.tier}</span>
              </div>
              <div className="flex items-center font-mono">{token.coverage}</div>
              <div className="flex items-center">
                <StatusBadge status={token.status as 'active' | 'sunset'} />
              </div>
              <div className="flex items-center text-zinc-400 text-sm">{token.registeredAt}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <StatBox label="Total registered" value="—" />
          <StatBox label="Total coverage" value="—" />
          <StatBox label="Sunsets processed" value="—" />
        </div>
      </div>
    </div>
  )
}

function FilterButton({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode
  active: boolean
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        active 
          ? 'bg-orange-500 text-white' 
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
      }`}
    >
      {children}
    </button>
  )
}

function StatusBadge({ status }: { status: 'active' | 'sunset' }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${
      status === 'active' 
        ? 'bg-green-500/20 text-green-400' 
        : 'bg-orange-500/20 text-orange-400'
    }`}>
      {status === 'active' ? '● Active' : '◐ Sunset'}
    </span>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
      <div className="text-2xl font-bold text-orange-400 mb-1">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  )
}
