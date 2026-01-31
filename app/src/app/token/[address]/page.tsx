'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { isAddress } from 'viem'

interface CoverageData {
  token: string
  covered: boolean
  tier: number | null
  tierName: string | null
  multiplier?: number
  totalDeposited: string
  totalDepositedFormatted: string
  effectiveCoverage: string
  isSunset: boolean
  snapshotSupply?: string
  splitter?: string
  owner?: string
  registeredAt?: number
  active?: boolean
}

interface ClaimableData {
  claimable: string
  claimableFormatted: string
  hasClaimed: boolean
  canClaim: boolean
  isSunset: boolean
}

interface ScoreData {
  score: number
  status: string
  breakdown: {
    registered: number
    coverage: number
    tier: number
    activity: number
  }
}

export default function TokenPage() {
  const params = useParams()
  const address = params.address as string
  
  const [coverage, setCoverage] = useState<CoverageData | null>(null)
  const [claimable, setClaimable] = useState<ClaimableData | null>(null)
  const [score, setScore] = useState<ScoreData | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch coverage data
  useEffect(() => {
    if (!address || !isAddress(address)) {
      setError('Invalid token address')
      setLoading(false)
      return
    }

    Promise.all([
      fetch(`/api/coverage/${address}`).then(res => res.json()),
      fetch(`/api/score/${address}`).then(res => res.json()),
    ])
      .then(([coverageData, scoreData]) => {
        setCoverage(coverageData)
        setScore(scoreData)
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load coverage data')
        setLoading(false)
      })
  }, [address])

  // Fetch claimable when wallet connected
  useEffect(() => {
    if (!wallet || !address) return

    fetch(`/api/claimable/${address}/${wallet}`)
      .then(res => res.json())
      .then(data => setClaimable(data))
      .catch(console.error)
  }, [wallet, address])

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask')
      return
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[]
      setWallet(accounts[0])
    } catch (err) {
      console.error('Failed to connect wallet:', err)
    }
  }

  // Copy address
  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-orange-500 text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-t-xl p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold mb-2">
            {coverage?.covered ? '🌅 Token Coverage' : '❌ Not Covered'}
          </h1>
          <div className="flex items-center gap-2">
            <code className="text-gray-400 text-sm">
              {address.slice(0, 10)}...{address.slice(-8)}
            </code>
            <button
              onClick={copyAddress}
              className="text-orange-500 hover:text-orange-400 text-sm"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Coverage Info */}
        <div className="bg-gray-800 p-6 border-b border-gray-700">
          {coverage?.covered ? (
            <>
              {/* Score Badge */}
              {score && (
                <div className="flex justify-center mb-6">
                  <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${
                    score.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                    score.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    score.status === 'at-risk' ? 'bg-red-500/20 text-red-400' :
                    score.status === 'sunset' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    <span className="text-2xl font-bold">{score.score}</span>
                    <span className="text-sm uppercase">{score.status}</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-green-500 text-lg font-semibold mb-1">
                  ✅ COVERED
                </div>
                <div className="text-gray-400">
                  Tier: {coverage.tierName} ({coverage.multiplier}x multiplier)
                </div>
              </div>

              {/* Coverage Pool */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-1">Coverage Pool</div>
                  <div className="text-2xl font-bold text-white">
                    {coverage.totalDepositedFormatted}
                  </div>
                  <div className="text-orange-500">
                    {coverage.effectiveCoverage} effective coverage
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  coverage.isSunset 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {coverage.isSunset ? '🌅 Sunset Triggered' : '✓ Active'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg">
                This token is not registered with Sunset Protocol
              </div>
            </div>
          )}
        </div>

        {/* Claim Section */}
        <div className="bg-gray-800 rounded-b-xl p-6">
          {!wallet ? (
            <button
              onClick={connectWallet}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Connect Wallet to see your claim
            </button>
          ) : coverage?.isSunset ? (
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-1">Your Claimable Amount</div>
              <div className="text-3xl font-bold text-white mb-4">
                {claimable?.claimableFormatted || '0 ETH'}
              </div>
              {claimable?.canClaim ? (
                <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition">
                  CLAIM NOW
                </button>
              ) : claimable?.hasClaimed ? (
                <div className="text-green-500">✓ Already Claimed</div>
              ) : (
                <div className="text-gray-500">Nothing to claim</div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>Connected: {wallet.slice(0, 6)}...{wallet.slice(-4)}</p>
              <p className="mt-2">Claims available after sunset is triggered</p>
            </div>
          )}
        </div>

        {/* Project Details */}
        {coverage?.covered && (
          <div className="mt-6 bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Project Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Splitter:</span>
                <code className="text-gray-300">
                  {coverage.splitter?.slice(0, 10)}...{coverage.splitter?.slice(-8)}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Owner:</span>
                <code className="text-gray-300">
                  {coverage.owner?.slice(0, 10)}...{coverage.owner?.slice(-8)}
                </code>
              </div>
              {coverage.registeredAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Registered:</span>
                  <span className="text-gray-300">
                    {new Date(coverage.registeredAt * 1000).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
