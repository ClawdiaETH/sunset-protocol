import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 py-20">
        <h1 className="text-5xl font-bold mb-6">
          🌅 Sunset Protocol
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl">
          Graceful exits for agent tokens. When your token sunsets, 
          holders can claim their share of accumulated fees.
        </p>
        
        <div className="flex gap-4 mb-16">
          <Link
            href="/token/0xa3AdE7dd0A7fDDBdA820E65E4D2406a9EfaBad3e"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition"
          >
            View Demo Token
          </Link>
          <a
            href="https://github.com/ClawdiaETH/sunset-protocol"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
          >
            GitHub →
          </a>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">1. Register</h3>
            <p className="text-gray-400 text-sm">
              Token projects register with Sunset Protocol, choosing their tier 
              and fee percentage.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">2. Accumulate</h3>
            <p className="text-gray-400 text-sm">
              A portion of trading fees flow to the coverage pool, building 
              up the sunset fund.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-4">🌅</div>
            <h3 className="text-lg font-semibold mb-2">3. Claim</h3>
            <p className="text-gray-400 text-sm">
              When sunset is triggered, token holders can claim their 
              proportional share of the pool.
            </p>
          </div>
        </div>

        {/* API Section */}
        <div className="bg-gray-800 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6">API Endpoints</h2>
          <div className="space-y-4 font-mono text-sm">
            <div>
              <code className="text-orange-400">GET</code>
              <code className="text-gray-300 ml-2">/api/coverage/[token]</code>
              <p className="text-gray-500 mt-1 font-sans">Get coverage info for any token</p>
            </div>
            <div>
              <code className="text-orange-400">GET</code>
              <code className="text-gray-300 ml-2">/api/claimable/[token]/[holder]</code>
              <p className="text-gray-500 mt-1 font-sans">Check claimable amount for a holder</p>
            </div>
            <div>
              <code className="text-orange-400">GET</code>
              <code className="text-gray-300 ml-2">/api/projects</code>
              <p className="text-gray-500 mt-1 font-sans">List all registered projects</p>
            </div>
            <div>
              <code className="text-orange-400">GET</code>
              <code className="text-gray-300 ml-2">/api/frame/[token]</code>
              <p className="text-gray-500 mt-1 font-sans">Farcaster Frame for token coverage</p>
            </div>
          </div>
        </div>

        {/* Contracts */}
        <div className="bg-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Contracts (Base Sepolia)</h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Vault:</span>
              <a 
                href="https://sepolia.basescan.org/address/0xb1AB04E7ee37eE9e18D2ca9E43D5CE05a0C56A43"
                className="text-orange-400 hover:underline"
              >
                0xb1AB04E7ee37eE9e18D2ca9E43D5CE05a0C56A43
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Registry:</span>
              <a 
                href="https://sepolia.basescan.org/address/0x01367cDB35C996d4E30c9e17FAcdeB3624778a9a"
                className="text-orange-400 hover:underline"
              >
                0x01367cDB35C996d4E30c9e17FAcdeB3624778a9a
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500">
        <p>Built by <a href="https://x.com/Clawdia_ETH" className="text-orange-400 hover:underline">@Clawdia_ETH</a></p>
      </footer>
    </div>
  )
}
