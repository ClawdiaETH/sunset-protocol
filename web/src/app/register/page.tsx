'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'

export default function RegisterPage() {
  const { isConnected } = useAccount()
  const [tokenAddress, setTokenAddress] = useState('')
  const [tier, setTier] = useState<1 | 2 | 3>(2)
  const [step, setStep] = useState(1)

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-float">🔌</div>
          <h1 className="text-3xl font-bold mb-3">Connect your wallet</h1>
          <p className="text-zinc-400 text-lg mb-8">Connect to register your token for coverage</p>
          <div className="text-sm text-zinc-500">
            Use the connect button in the header ↗
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition mb-4 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Register for coverage</h1>
          <p className="text-zinc-400">Protect your token holders in 3 simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-12">
          <ProgressStep number={1} label="Token" active={step >= 1} completed={step > 1} />
          <ProgressLine active={step > 1} />
          <ProgressStep number={2} label="Tier" active={step >= 2} completed={step > 2} />
          <ProgressLine active={step > 2} />
          <ProgressStep number={3} label="Deploy" active={step >= 3} completed={false} />
        </div>

        {/* Step 1: Token Address */}
        {step === 1 && (
          <div className="card animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">
                📝
              </div>
              <div>
                <h2 className="text-xl font-semibold">Enter your token address</h2>
                <p className="text-sm text-zinc-500">Your Clanker/Bankr/Clawnch token on Base</p>
              </div>
            </div>
            
            <input
              type="text"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-all font-mono text-lg mb-6"
            />
            
            <button
              onClick={() => setStep(2)}
              disabled={!tokenAddress.startsWith('0x') || tokenAddress.length !== 42}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Select Tier */}
        {step === 2 && (
          <div className="card animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">
                🎚️
              </div>
              <div>
                <h2 className="text-xl font-semibold">Select coverage tier</h2>
                <p className="text-sm text-zinc-500">Higher tiers = more protection</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-8">
              <TierOption
                name="Basic"
                feeShare="5%"
                multiplier="1x"
                description="Entry-level protection"
                selected={tier === 1}
                onClick={() => setTier(1)}
              />
              <TierOption
                name="Standard"
                feeShare="10%"
                multiplier="1.5x"
                description="Recommended for most tokens"
                selected={tier === 2}
                onClick={() => setTier(2)}
                recommended
              />
              <TierOption
                name="Premium"
                feeShare="15%"
                multiplier="2x"
                description="Maximum protection"
                selected={tier === 3}
                onClick={() => setTier(3)}
              />
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 btn-secondary">
                Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 btn-primary">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Deploy */}
        {step === 3 && (
          <div className="card animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">
                🚀
              </div>
              <div>
                <h2 className="text-xl font-semibold">Deploy FeeSplitter</h2>
                <p className="text-sm text-zinc-500">Review and confirm deployment</p>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-5 mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Token</span>
                <span className="font-mono text-sm bg-white/10 px-3 py-1 rounded-lg">
                  {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Tier</span>
                <span className="font-semibold">{tier === 1 ? 'Basic' : tier === 2 ? 'Standard' : 'Premium'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Fee share</span>
                <span className="font-semibold">{tier === 1 ? '5%' : tier === 2 ? '10%' : '15%'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Coverage multiplier</span>
                <span className="font-semibold gradient-text">{tier === 1 ? '1x' : tier === 2 ? '1.5x' : '2x'}</span>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button onClick={() => setStep(2)} className="flex-1 btn-secondary">
                Back
              </button>
              <button
                onClick={() => alert('Contracts not deployed yet — coming soon!')}
                className="flex-1 btn-primary"
              >
                Deploy splitter
              </button>
            </div>

            <p className="text-xs text-zinc-500 text-center">
              After deploying, update your Clanker reward recipient to the splitter address.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressStep({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
        completed 
          ? 'bg-green-500 text-white' 
          : active 
            ? 'bg-orange-500 text-white glow-orange' 
            : 'bg-white/5 text-zinc-500 border border-white/10'
      }`}>
        {completed ? '✓' : number}
      </div>
      <span className={`text-sm hidden sm:block ${active ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
    </div>
  )
}

function ProgressLine({ active }: { active: boolean }) {
  return (
    <div className={`flex-1 h-0.5 rounded transition-colors ${active ? 'bg-orange-500' : 'bg-white/10'}`} />
  )
}

function TierOption({ 
  name, 
  feeShare, 
  multiplier, 
  description,
  selected, 
  onClick,
  recommended = false
}: { 
  name: string
  feeShare: string
  multiplier: string
  description: string
  selected: boolean
  onClick: () => void
  recommended?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-5 rounded-xl text-left transition-all ${
        selected 
          ? 'bg-orange-500/10 border-2 border-orange-500/50 shadow-lg shadow-orange-500/10' 
          : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg">{name}</span>
          {recommended && (
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </div>
        <div className={`w-5 h-5 rounded-full border-2 transition-all ${
          selected ? 'border-orange-500 bg-orange-500' : 'border-white/20'
        }`}>
          {selected && (
            <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      <p className="text-sm text-zinc-400 mb-3">{description}</p>
      <div className="flex gap-4 text-sm">
        <span className="text-zinc-500">{feeShare} fee</span>
        <span className="text-zinc-500">→</span>
        <span className={selected ? 'gradient-text font-semibold' : 'text-zinc-300'}>{multiplier} coverage</span>
      </div>
    </button>
  )
}
