'use client'

import { useState } from 'react'

export default function CoverageCalculator() {
  const [monthlyVolume, setMonthlyVolume] = useState<string>('100000')
  const [feePercentage, setFeePercentage] = useState<string>('1')
  const [tier, setTier] = useState<'standard' | 'premium'>('standard')
  const [registrations, setRegistrations] = useState<string>('1')

  // Calculate values
  const volume = parseFloat(monthlyVolume) || 0
  const fee = parseFloat(feePercentage) || 0
  const numRegistrations = parseInt(registrations) || 1
  const tierShare = tier === 'standard' ? 0.10 : 0.15
  const multiplier = tier === 'standard' ? 1.2 : 1.5

  // Monthly fees generated
  const monthlyFees = volume * (fee / 100)
  // Coverage added (tier share of fees)
  const monthlyCoverage = monthlyFees * tierShare
  // 6-month projection
  const sixMonthCoverage = monthlyCoverage * 6
  // Effective coverage with multiplier
  const effectiveCoverage = sixMonthCoverage * multiplier

  // $CLAWDIA burn calculations
  const CLAWDIA_PER_REGISTRATION = 25_000_000
  const TOTAL_SUPPLY = 100_000_000_000 // 100B
  const ETH_PER_REGISTRATION = 0.1 // Approximate
  
  const totalClawdiaBurned = numRegistrations * CLAWDIA_PER_REGISTRATION
  const totalEthSpent = numRegistrations * ETH_PER_REGISTRATION
  const percentOfSupply = (totalClawdiaBurned / TOTAL_SUPPLY) * 100

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  return (
    <section className="py-20 px-4 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Coverage & burn calculator</h2>
          <p className="text-zinc-400 text-lg">See coverage build-up and $CLAWDIA deflationary impact</p>
        </div>

        <div className="glass rounded-2xl p-8 md:p-10">
          {/* Inputs */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Monthly Volume */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 block">Monthly trading volume ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <input
                  type="number"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  placeholder="100000"
                  min="0"
                />
              </div>
            </div>

            {/* Fee Percentage */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 block">Fee percentage (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={feePercentage}
                  onChange={(e) => setFeePercentage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-8 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  placeholder="1"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
              </div>
            </div>

            {/* Tier Selection */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 block">Coverage tier</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTier('standard')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    tier === 'standard'
                      ? 'bg-orange-500/20 border-2 border-orange-500/50 text-orange-400'
                      : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setTier('premium')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    tier === 'premium'
                      ? 'bg-orange-500/20 border-2 border-orange-500/50 text-orange-400'
                      : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  Premium
                </button>
              </div>
            </div>

            {/* Number of Registrations */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400 block"># of registrations</label>
              <input
                type="number"
                value={registrations}
                onChange={(e) => setRegistrations(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                placeholder="1"
                min="1"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 mb-10" />

          {/* Coverage Outputs */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🛡️</span> Coverage Projection
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Monthly Coverage */}
              <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="text-sm text-zinc-500 mb-2">Monthly coverage added</div>
                <div className="text-3xl font-bold text-white">{formatCurrency(monthlyCoverage)}</div>
                <div className="text-xs text-zinc-600 mt-2">
                  {formatCurrency(monthlyFees)} fees × {tierShare * 100}%
                </div>
              </div>

              {/* 6-Month Projection */}
              <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="text-sm text-zinc-500 mb-2">6-month projected coverage</div>
                <div className="text-3xl font-bold text-white">{formatCurrency(sixMonthCoverage)}</div>
                <div className="text-xs text-zinc-600 mt-2">
                  {formatCurrency(monthlyCoverage)} × 6 months
                </div>
              </div>

              {/* Effective Coverage */}
              <div className="text-center p-6 rounded-xl bg-gradient-to-b from-green-500/10 to-transparent border-2 border-green-500/30">
                <div className="text-sm text-green-400 mb-2">Effective coverage</div>
                <div className="text-3xl font-bold text-green-400">{formatCurrency(effectiveCoverage)}</div>
                <div className="text-xs text-zinc-500 mt-2">
                  {formatCurrency(sixMonthCoverage)} × {multiplier}x multiplier
                </div>
              </div>
            </div>
          </div>

          {/* Burn Outputs */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🔥</span> $CLAWDIA Burns <span className="text-sm font-normal text-zinc-500">(100B total supply)</span>
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {/* Per Registration */}
              <div className="text-center p-6 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <div className="text-sm text-zinc-500 mb-2">Per registration</div>
                <div className="text-3xl font-bold text-orange-400">25M</div>
                <div className="text-xs text-zinc-600 mt-2">
                  0.025% of supply
                </div>
              </div>

              {/* Total Burned */}
              <div className="text-center p-6 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <div className="text-sm text-zinc-500 mb-2">Total burned ({numRegistrations} reg.)</div>
                <div className="text-3xl font-bold text-orange-400">{formatNumber(totalClawdiaBurned)}</div>
                <div className="text-xs text-zinc-600 mt-2">
                  $CLAWDIA removed
                </div>
              </div>

              {/* % of Supply */}
              <div className="text-center p-6 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <div className="text-sm text-zinc-500 mb-2">% of total supply</div>
                <div className="text-3xl font-bold text-orange-400">{percentOfSupply.toFixed(3)}%</div>
                <div className="text-xs text-zinc-600 mt-2">
                  Cumulative burn
                </div>
              </div>

              {/* ETH Spent */}
              <div className="text-center p-6 rounded-xl bg-gradient-to-b from-orange-500/10 to-transparent border-2 border-orange-500/30">
                <div className="text-sm text-orange-400 mb-2">ETH spent</div>
                <div className="text-3xl font-bold text-orange-400">~{totalEthSpent.toFixed(1)}</div>
                <div className="text-xs text-zinc-500 mt-2">
                  Approximate
                </div>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="mt-8 text-center text-sm text-zinc-500">
            <span className="text-orange-400">Note:</span> Coverage depends on consistent trading volume. 
            $CLAWDIA burn cost varies with token price. All burns are verifiable on-chain.
          </div>
        </div>

        {/* Example scenarios */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-6 text-center">Protocol scale impact</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <ScenarioCard
              title="10 Projects"
              volume="Early adoption"
              coverage="10 pools"
              burns="250M (0.25%)"
            />
            <ScenarioCard
              title="100 Projects"
              volume="Growing"
              coverage="100 pools"
              burns="2.5B (2.5%)"
              featured
            />
            <ScenarioCard
              title="500 Projects"
              volume="Established"
              coverage="500 pools"
              burns="12.5B (12.5%)"
            />
            <ScenarioCard
              title="1,000 Projects"
              volume="Mature"
              coverage="1,000 pools"
              burns="25B (25%)"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ScenarioCard({ 
  title, 
  volume, 
  coverage, 
  burns,
  featured = false 
}: { 
  title: string
  volume: string
  coverage: string
  burns: string
  featured?: boolean
}) {
  return (
    <div className={`rounded-xl p-6 ${
      featured 
        ? 'bg-gradient-to-b from-orange-500/10 to-transparent border-2 border-orange-500/30' 
        : 'bg-white/5 border border-white/10'
    }`}>
      <h4 className="font-semibold mb-4">{title}</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Volume:</span>
          <span>{volume}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Coverage:</span>
          <span className="text-green-400">{coverage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Burns:</span>
          <span className="text-orange-400">🔥 {burns}</span>
        </div>
      </div>
    </div>
  )
}
