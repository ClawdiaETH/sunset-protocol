'use client'

import { useState } from 'react'

export default function CoverageCalculator() {
  const [monthlyVolume, setMonthlyVolume] = useState<string>('100000')
  const [feePercentage, setFeePercentage] = useState<string>('1')
  const [tier, setTier] = useState<'standard' | 'premium'>('standard')

  // Calculate values
  const volume = parseFloat(monthlyVolume) || 0
  const fee = parseFloat(feePercentage) || 0
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

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  return (
    <section className="py-20 px-4 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Coverage calculator</h2>
          <p className="text-zinc-400 text-lg">See how much protection your token could build</p>
        </div>

        <div className="glass rounded-2xl p-8 md:p-10">
          {/* Inputs */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
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
                  Standard (10%)
                </button>
                <button
                  onClick={() => setTier('premium')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    tier === 'premium'
                      ? 'bg-orange-500/20 border-2 border-orange-500/50 text-orange-400'
                      : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  Premium (15%)
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 mb-10" />

          {/* Outputs */}
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
            <div className="text-center p-6 rounded-xl bg-gradient-to-b from-orange-500/10 to-transparent border-2 border-orange-500/30">
              <div className="text-sm text-orange-400 mb-2">Effective coverage</div>
              <div className="text-3xl font-bold gradient-text">{formatCurrency(effectiveCoverage)}</div>
              <div className="text-xs text-zinc-500 mt-2">
                {formatCurrency(sixMonthCoverage)} × {multiplier}x multiplier
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="mt-8 text-center text-sm text-zinc-500">
            <span className="text-orange-400">Note:</span> Actual coverage depends on consistent trading volume. 
            Higher tiers earn better multipliers for the same fee contribution.
          </div>
        </div>
      </div>
    </section>
  )
}
