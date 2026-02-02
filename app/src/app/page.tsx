import Link from 'next/link'
import CoverageCalculator from './components/CoverageCalculator'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0c0c14]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🌅</span>
            <span className="font-semibold text-lg hidden sm:block">Sunset Protocol</span>
          </Link>
          <nav className="flex items-center gap-4">
            <a 
              href="https://github.com/ClawdiaETH/sunset-protocol" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a 
              href="https://twitter.com/Clawdia_ETH" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-4 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl animate-float delay-200" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl animate-float delay-400" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-sm text-zinc-300">Testing on Base Sepolia</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up delay-100">
            <span className="gradient-text">Graceful exits</span>
            <br />
            <span className="text-white">for agent tokens</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200">
            When tokens die, holders get value back.
            <br className="hidden md:block" />
            <span className="text-zinc-300">Not zero. Something.</span>
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
            <a 
              href="https://github.com/ClawdiaETH/sunset-protocol/blob/main/docs/PROPOSAL.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-lg"
            >
              Register your token
            </a>
            <a 
              href="https://sepolia.basescan.org/address/0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9"
              target="_blank"
              rel="noopener noreferrer" 
              className="btn-secondary text-lg"
            >
              View contracts
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500 animate-fade-in-up delay-400">
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Clanker compatible
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Bankr ready
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Clawnch native
            </span>
          </div>
        </div>
      </section>

      {/* What is Sunset Protocol - NEW EXPLAINER SECTION */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">What is Sunset Protocol?</h2>
            <p className="text-zinc-400 text-lg">Insurance for the agent token economy</p>
          </div>
          
          <div className="glass rounded-2xl p-8 md:p-10 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-orange-400">The Problem</h3>
              <p className="text-zinc-300 leading-relaxed">
                Agent tokens launched via Clanker, Bankr, and Clawnch generate real trading fees. 
                But when activity dies, liquidity drains, holders can&apos;t exit, and value evaporates. 
                Most tokens eventually sunset — the question is whether holders get zero or something.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-orange-400">The Solution</h3>
              <p className="text-zinc-300 leading-relaxed">
                Sunset Protocol collects a small percentage (10-15%) of your token&apos;s trading fees into a coverage pool. 
                When sunset triggers, these accumulated fees are distributed <span className="text-white font-medium">pro-rata</span> to 
                all token holders based on their holdings at the time of sunset.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-orange-400">Two-Step Sunset (Anti-Manipulation)</h3>
              <p className="text-zinc-300 leading-relaxed">
                To prevent insider attacks, sunset uses a <span className="text-white font-medium">48-hour announcement period</span>:
              </p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-4 text-sm">
                <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-orange-400">1.</span> Announce
                </div>
                <span className="text-zinc-600">→</span>
                <div className="px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <span className="text-orange-400">48hr wait</span>
                </div>
                <span className="text-zinc-600">→</span>
                <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-orange-400">2.</span> Execute
                </div>
                <span className="text-zinc-600">→</span>
                <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span className="text-green-400">Claims open</span>
                </div>
              </div>
              <p className="text-zinc-400 text-sm">
                The snapshot happens at execution, not announcement — so there&apos;s no information advantage for insiders.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-orange-400">Trigger Conditions</h3>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span><span className="text-white">Owner voluntary:</span> After 30 days, project owner can announce sunset</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span><span className="text-white">Community inactivity:</span> Anyone can trigger after 120 days of no meaningful deposits</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span><span className="text-white">Admin emergency:</span> Protocol admin can trigger for critical issues</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard value="—" label="Tokens covered" icon="🛡️" />
            <StatCard value="—" label="Coverage pool" icon="💰" />
            <StatCard value="—" label="Claims paid" icon="✅" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 border-t border-white/5 gradient-sunset">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-zinc-400 text-lg">Three steps to protect your community</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Register"
              description="Deploy a FeeSplitter that routes a percentage of trading fees to your coverage pool"
              icon="📝"
            />
            <StepCard
              number={2}
              title="Accumulate"
              description="As your token trades, coverage grows. More activity means more protection for holders"
              icon="📈"
            />
            <StepCard
              number={3}
              title="Claim"
              description="If sunset triggers, holders claim their pro-rata share. Value preserved, trust maintained"
              icon="🎁"
            />
          </div>
        </div>
      </section>

      {/* Flow Diagram */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Fee flow</h2>
            <p className="text-zinc-400 text-lg">Your fees work double duty</p>
          </div>
          
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <FlowNode icon="💱" label="Trades" sublabel="Volume" />
              <FlowArrow />
              <FlowNode icon="✂️" label="Splitter" sublabel="10-15%" highlight />
              <FlowArrow />
              <FlowNode icon="🏦" label="Vault" sublabel="Coverage" />
              <FlowArrow />
              <FlowNode icon="👥" label="Holders" sublabel="Claims" />
            </div>
          </div>
        </div>
      </section>

      {/* Tiers - Updated to match actual contract */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Coverage tiers</h2>
            <p className="text-zinc-400 text-lg">One-time 25M $CLAWDIA charge for registration (~$0.10 ETH)</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <TierCard
              name="Standard"
              feeShare="10%"
              multiplier="1.2x"
              description="Recommended for most agent tokens"
              features={[
                'Fee stream coverage',
                'Pro-rata claims on sunset',
                '1.2x coverage multiplier',
                '30-day minimum coverage period',
                'Two-step sunset protection',
              ]}
              featured
            />
            <TierCard
              name="Premium"
              feeShare="15%"
              multiplier="1.5x"
              description="Maximum protection for high-value tokens"
              features={[
                'Everything in Standard',
                '1.5x coverage multiplier',
                'Higher effective coverage',
                'Priority for future features',
                'Cross-subsidy eligibility',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Coverage Calculator */}
      <CoverageCalculator />

      {/* API Section */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">REST API</h2>
            <p className="text-zinc-400 text-lg">Integrate coverage checks into your app</p>
          </div>
          
          <div className="glass rounded-2xl p-8 space-y-6 font-mono text-sm">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">GET</span>
                <code className="text-zinc-300">/api/coverage/[token]</code>
              </div>
              <p className="text-zinc-500 font-sans text-sm">Full coverage info, trigger status, sunset announcement state</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">GET</span>
                <code className="text-zinc-300">/api/claimable/[token]/[holder]</code>
              </div>
              <p className="text-zinc-500 font-sans text-sm">Check claimable amount for a specific holder</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">GET</span>
                <code className="text-zinc-300">/api/score/[token]</code>
              </div>
              <p className="text-zinc-500 font-sans text-sm">Health score (0-100) with breakdown</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">GET</span>
                <code className="text-zinc-300">/api/projects</code>
              </div>
              <p className="text-zinc-500 font-sans text-sm">List all registered projects with coverage amounts</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">FRAME</span>
                <code className="text-zinc-300">/api/frame/[token]</code>
              </div>
              <p className="text-zinc-500 font-sans text-sm">Farcaster Frame for social sharing</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 gradient-sunset opacity-50" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-6xl mb-6">🌅</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Built for the <span className="gradient-text">agent economy</span>
          </h2>
          <p className="text-xl text-zinc-400 mb-10 max-w-xl mx-auto">
            Most tokens will eventually sunset. The question is whether holders get zero or something.
          </p>
          <a 
            href="https://github.com/ClawdiaETH/sunset-protocol/blob/main/docs/PROPOSAL.md"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-lg inline-flex items-center gap-2 animate-pulse-glow"
          >
            Protect your token
            <span>→</span>
          </a>
        </div>
      </section>

      {/* Contracts Section */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Contracts (Base Sepolia)</h2>
            <p className="text-zinc-500 text-sm">v3 — Two-step sunset with 48hr announcement</p>
          </div>
          
          <div className="glass rounded-xl p-6 space-y-4 font-mono text-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <span className="text-zinc-500">SunsetVault:</span>
              <a 
                href="https://sepolia.basescan.org/address/0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline break-all"
              >
                0x8d0Dc9E8A42743a0256fd40B70f463e4e0c587d9
              </a>
            </div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <span className="text-zinc-500">SunsetRegistry:</span>
              <a 
                href="https://sepolia.basescan.org/address/0xb79f515b55D4ea0f70b24C67F1650513cE45CC54"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline break-all"
              >
                0xb79f515b55D4ea0f70b24C67F1650513cE45CC54
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌅</span>
              <span className="font-semibold">Sunset Protocol</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-zinc-500">
              <a href="https://github.com/ClawdiaETH/sunset-protocol" className="hover:text-white transition">
                GitHub
              </a>
              <a href="https://twitter.com/Clawdia_ETH" className="hover:text-white transition">
                Twitter
              </a>
              <span>
                Built by <a href="https://twitter.com/Clawdia_ETH" className="text-orange-400 hover:underline">Clawdia</a> 🐚
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="card text-center group cursor-default">
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-4xl font-bold gradient-text mb-2 stat-number">{value}</div>
      <div className="text-zinc-500">{label}</div>
    </div>
  )
}

function StepCard({ number, title, description, icon }: { number: number; title: string; description: string; icon: string }) {
  return (
    <div className="card group">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-sm font-mono text-zinc-500">0{number}</span>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </div>
  )
}

function FlowNode({ icon, label, sublabel, highlight = false }: { icon: string; label: string; sublabel: string; highlight?: boolean }) {
  return (
    <div className={`text-center ${highlight ? 'scale-110' : ''}`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-2 mx-auto ${
        highlight ? 'bg-orange-500/20 border-2 border-orange-500/50 glow-orange' : 'bg-white/5 border border-white/10'
      }`}>
        {icon}
      </div>
      <div className="font-semibold">{label}</div>
      <div className="text-sm text-zinc-500">{sublabel}</div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="hidden md:block text-zinc-600 text-2xl">
      →
    </div>
  )
}

function TierCard({ 
  name, 
  feeShare, 
  multiplier, 
  description,
  features,
  featured = false 
}: { 
  name: string
  feeShare: string
  multiplier: string
  description: string
  features: string[]
  featured?: boolean
}) {
  return (
    <div className={`rounded-2xl p-8 transition-all duration-300 ${
      featured 
        ? 'bg-gradient-to-b from-orange-500/10 to-transparent border-2 border-orange-500/30 glow-subtle' 
        : 'card'
    }`}>
      {featured && (
        <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-4">
          ✨ Recommended
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className="text-zinc-400 text-sm mb-6">{description}</p>
      
      <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-zinc-500">Fee share</span>
          <span className="font-semibold text-lg">{feeShare}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500">Coverage multiplier</span>
          <span className="font-semibold text-lg gradient-text">{multiplier}</span>
        </div>
      </div>
      
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="text-green-400 shrink-0">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
