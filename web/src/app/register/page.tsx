'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'

export default function RegisterPage() {
  const { isConnected } = useAccount()
  const [tokenAddress, setTokenAddress] = useState('')
  const [tier, setTier] = useState<1 | 2 | 3>(2)
  const [step, setStep] = useState(1)

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔌</div>
          <h1 className="text-2xl font-bold mb-2">Connect your wallet</h1>
          <p className="text-zinc-400">Connect to register your token for coverage</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Register for coverage</h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-12">
          <ProgressStep number={1} label="Token" active={step >= 1} />
          <div className="flex-1 h-px bg-zinc-800" />
          <ProgressStep number={2} label="Tier" active={step >= 2} />
          <div className="flex-1 h-px bg-zinc-800" />
          <ProgressStep number={3} label="Deploy" active={step >= 3} />
        </div>

        {step === 1 && (
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Enter your token address</h2>
            <p className="text-zinc-400 mb-6">
              Paste the contract address of your Clanker/Bankr/Clawnch token on Base.
            </p>
            <input
              type="text"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-orange-500 mb-4"
            />
            <button
              onClick={() => setStep(2)}
              disabled={!tokenAddress.startsWith('0x') || tokenAddress.length !== 42}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Select coverage tier</h2>
            <p className="text-zinc-400 mb-6">
              Higher tiers provide more coverage but require a larger fee share.
            </p>
            <div className="space-y-3 mb-6">
              <TierOption
                name="Basic"
                feeShare="5%"
                multiplier="1x"
                selected={tier === 1}
                onClick={() => setTier(1)}
              />
              <TierOption
                name="Standard"
                feeShare="10%"
                multiplier="1.5x"
                selected={tier === 2}
                onClick={() => setTier(2)}
                recommended
              />
              <TierOption
                name="Premium"
                feeShare="15%"
                multiplier="2x"
                selected={tier === 3}
                onClick={() => setTier(3)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">Deploy FeeSplitter</h2>
            <p className="text-zinc-400 mb-6">
              This will deploy a contract that splits your trading fees between you and Sunset Protocol.
            </p>
            
            <div className="bg-zinc-800 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Token</span>
                <span className="font-mono">{tokenAddress.slice(0, 10)}...{tokenAddress.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tier</span>
                <span>{tier === 1 ? 'Basic' : tier === 2 ? 'Standard' : 'Premium'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fee share</span>
                <span>{tier === 1 ? '5%' : tier === 2 ? '10%' : '15%'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Coverage multiplier</span>
                <span>{tier === 1 ? '1x' : tier === 2 ? '1.5x' : '2x'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
              >
                Back
              </button>
              <button
                onClick={() => alert('Contracts not deployed yet — coming soon!')}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition"
              >
                Deploy splitter
              </button>
            </div>

            <p className="text-xs text-zinc-500 mt-4 text-center">
              After deploying, you&apos;ll need to update your Clanker reward recipient to the splitter address.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressStep({ number, label, active }: { number: number; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
        active ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500'
      }`}>
        {number}
      </div>
      <span className={active ? 'text-white' : 'text-zinc-500'}>{label}</span>
    </div>
  )
}

function TierOption({ 
  name, 
  feeShare, 
  multiplier, 
  selected, 
  onClick,
  recommended = false
}: { 
  name: string
  feeShare: string
  multiplier: string
  selected: boolean
  onClick: () => void
  recommended?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border text-left transition ${
        selected 
          ? 'bg-orange-500/10 border-orange-500' 
          : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">{name}</span>
        {recommended && (
          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Recommended</span>
        )}
      </div>
      <div className="text-sm text-zinc-400">
        {feeShare} fee share → {multiplier} coverage
      </div>
    </button>
  )
}
