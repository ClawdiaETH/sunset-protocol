'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function Header() {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[oklch(0.13_0.01_285)]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">🌅</span>
          <span className="font-semibold text-lg hidden sm:block">Sunset Protocol</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/register" active={isActive('/register')}>Register</NavLink>
          <NavLink href="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
          <NavLink href="/tokens" active={isActive('/tokens')}>Tokens</NavLink>
          <a 
            href="https://github.com/ClawdiaETH/sunset-protocol" 
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Docs
          </a>
        </nav>

        <div>
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl glass glass-hover text-sm transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </button>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="btn-primary text-sm"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm transition-all ${
        active 
          ? 'bg-white/10 text-white' 
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
    </Link>
  )
}
