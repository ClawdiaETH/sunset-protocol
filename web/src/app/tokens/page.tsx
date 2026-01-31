'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TokensPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'sunset'>('all')
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Covered tokens</h1>
          <p className="text-zinc-400">Browse all tokens registered with Sunset Protocol</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatBox icon="🛡️" value="—" label="Total registered" />
          <StatBox icon="💰" value="—" label="Total coverage" />
          <StatBox icon="📈" value="—" label="Active tokens" />
          <StatBox icon="🌅" value="—" label="Sunsets processed" />
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </FilterButton>
            <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2" />
              Active
            </FilterButton>
            <FilterButton active={filter === 'sunset'} onClick={() => setFilter('sunset')}>
              <span className="w-2 h-2 rounded-full bg-orange-400 mr-2" />
              Sunset
            </FilterButton>
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by address or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-orange-500/50 text-sm"
            />
          </div>
        </div>

        {/* Token List */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-white/5 text-sm text-zinc-400 font-medium">
            <div className="col-span-2">Token</div>
            <div>Tier</div>
            <div>Coverage</div>
            <div>Status</div>
            <div>Registered</div>
          </div>

          {/* Empty State */}
          <div className="px-6 py-16 text-center">
            <div className="text-6xl mb-6 opacity-50">🌅</div>
            <h3 className="text-xl font-semibold mb-2">No tokens registered yet</h3>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Be the first to protect your token holders with graceful exit coverage.
            </p>
            <Link href="/register" className="btn-primary inline-block">
              Register your token →
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <InfoCard
            icon="🔍"
            title="How tokens get listed"
            description="Project owners register their tokens by deploying a FeeSplitter contract. Once deployed and active, tokens appear here automatically."
          />
          <InfoCard
            icon="📊"
            title="Coverage calculation"
            description="Coverage = Total fees deposited × Tier multiplier. Standard tier (10% fees, 1.5x multiplier) is recommended for most projects."
          />
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="glass rounded-xl p-5 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold gradient-text mb-1">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
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
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center ${
        active 
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function InfoCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  )
}
