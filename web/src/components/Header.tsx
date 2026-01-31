'use client'

import Link from 'next/link'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌅</span>
          <span className="font-semibold text-lg">Sunset Protocol</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/register" className="text-zinc-400 hover:text-white transition">
            Register
          </Link>
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition">
            Dashboard
          </Link>
          <Link href="/tokens" className="text-zinc-400 hover:text-white transition">
            Tokens
          </Link>
          <a 
            href="https://github.com/ClawdiaETH/sunset-protocol" 
            target="_blank"
            className="text-zinc-400 hover:text-white transition"
          >
            Docs
          </a>
        </nav>

        <div>
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition"
            >
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
