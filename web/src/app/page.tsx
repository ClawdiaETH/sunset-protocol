import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl animate-float delay-200" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl animate-float delay-400" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-zinc-300">Live on Base</span>
            <span className="text-orange-400 ml-2">🔥 Burns $CLAWDIA</span>
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
            <span className="text-zinc-300">Powered by $CLAWDIA utility burns.</span>
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
            <Link href="/register" className="btn-primary text-lg">
              Register your token
            </Link>
            <Link href="/dashboard" className="btn-secondary text-lg">
              Check coverage
            </Link>
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
              <span className="text-orange-400">🔥</span>
              Deflationary burns
            </span>
          </div>
        </div>
      </section>

      {/* Burn Stats Section */}
      <section className="py-16 px-4 border-t border-white/5 bg-gradient-to-r from-orange-500/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">🔥 $CLAWDIA Utility Burns</h2>
            <p className="text-zinc-400">Every registration creates demand • 100B total supply</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <BurnStatCard value="25M" label="Per registration (0.025%)" icon="🎫" />
            <BurnStatCard value="—" label="Total burned" icon="🔥" />
            <BurnStatCard value="100B" label="Total supply" icon="📊" />
            <BurnStatCard value="~0.1" label="ETH cost" icon="⛽" />
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
              description="Pay ~0.1 ETH to register. Contract auto-buys 25M $CLAWDIA and burns it. Your token gets coverage."
              icon="🔥"
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

      {/* Integration Flow */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Seamless integration</h2>
            <p className="text-zinc-400 text-lg">Just a checkbox for token launchers</p>
          </div>
          
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="space-y-4">
                <div className="text-zinc-400 text-sm">🚀 Launch Your Token</div>
                <div className="h-10 bg-zinc-800/50 rounded-lg w-full" />
                <div className="h-10 bg-zinc-800/50 rounded-lg w-3/4" />
                <div className="mt-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked readOnly className="mt-1 accent-orange-500" />
                    <div>
                      <div className="font-medium text-white">Enable Sunset Protection (+0.1 ETH)</div>
                      <div className="text-sm text-zinc-400 mt-1">
                        🔥 Includes 25M $CLAWDIA auto-burn
                      </div>
                      <div className="text-sm text-zinc-500">
                        🛡️ Holders protected if token sunsets
                      </div>
                    </div>
                  </label>
                </div>
                <div className="h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-medium">
                  Launch Token - 0.15 ETH
                </div>
              </div>
            </div>
            <p className="text-center text-zinc-500 mt-6 text-sm">
              Users see a simple checkbox. DEX swap and burn happens automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Fee Flow Diagram */}
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
              <FlowNode icon="✂️" label="Splitter" sublabel="10%" highlight />
              <FlowArrow />
              <FlowNode icon="🏦" label="Vault" sublabel="Coverage" />
              <FlowArrow />
              <FlowNode icon="👥" label="Holders" sublabel="Claims" />
            </div>
            
            {/* Buyback Flow */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="text-center text-sm text-zinc-500 mb-4">Admin fees → Buyback & Burn</div>
              <div className="flex items-center justify-center gap-4">
                <FlowNode icon="💰" label="Admin Fees" sublabel="ETH" small />
                <FlowArrow />
                <FlowNode icon="🔄" label="Uniswap" sublabel="Swap" small />
                <FlowArrow />
                <FlowNode icon="🔥" label="Burn" sublabel="$CLAWDIA" small highlight />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Coverage tiers</h2>
            <p className="text-zinc-400 text-lg">All tiers burn 25M $CLAWDIA on registration</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <TierCard
              name="Standard"
              feeShare="10%"
              multiplier="1.2x"
              description="Recommended for most agent tokens"
              features={['25M CLAWDIA burn', '1.2x coverage multiplier', 'Pro-rata claims', 'Dashboard access']}
              featured
            />
            <TierCard
              name="Premium"
              feeShare="15%"
              multiplier="1.5x"
              description="Maximum protection for high-value tokens"
              features={['25M CLAWDIA burn', '1.5x coverage multiplier', 'Priority claims', 'Premium support']}
            />
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Coverage calculator</h2>
            <p className="text-zinc-400 text-lg">See how much protection your token could build</p>
          </div>

          <div className="glass rounded-2xl p-8 md:p-10">
            <div className="text-center p-8 text-zinc-400">
              <p>Interactive calculator coming soon!</p>
              <p className="text-sm mt-2">
                For now: $100K monthly volume × 1% fee × 10% Sunset share = $100/month coverage
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 gradient-sunset opacity-50" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-6xl mb-6">🌅🔥</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Utility-driven protection for the <span className="gradient-text">agent economy</span>
          </h2>
          <p className="text-xl text-zinc-400 mb-10 max-w-xl mx-auto">
            Every registration burns 25M $CLAWDIA. 1,000 projects = 25% of supply.
          </p>
          <Link href="/register" className="btn-primary text-lg inline-flex items-center gap-2 animate-pulse-glow">
            Protect your token
            <span>→</span>
          </Link>
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
              <a href="https://twitter.com/ClawdiaBotAI" className="hover:text-white transition">
                Twitter
              </a>
              <span>
                Built by <a href="https://twitter.com/ClawdiaBotAI" className="text-orange-400 hover:underline">Clawdia</a> 🐚
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function BurnStatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="text-center p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-orange-400">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
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

function FlowNode({ icon, label, sublabel, highlight = false, small = false }: { 
  icon: string; 
  label: string; 
  sublabel: string; 
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`text-center ${highlight ? 'scale-110' : ''}`}>
      <div className={`${small ? 'w-12 h-12 text-xl' : 'w-16 h-16 text-2xl'} rounded-2xl flex items-center justify-center mb-2 mx-auto ${
        highlight ? 'bg-orange-500/20 border-2 border-orange-500/50 glow-orange' : 'bg-white/5 border border-white/10'
      }`}>
        {icon}
      </div>
      <div className={`font-semibold ${small ? 'text-sm' : ''}`}>{label}</div>
      <div className={`text-zinc-500 ${small ? 'text-xs' : 'text-sm'}`}>{sublabel}</div>
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
        ? 'bg-gradient-to-b from-orange-500/10 to-transparent border-2 border-orange-500/30 scale-105 glow-subtle' 
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
          <span className="text-zinc-500">Coverage</span>
          <span className="font-semibold text-lg gradient-text">{multiplier}</span>
        </div>
      </div>
      
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
            <span className={feature.includes('CLAWDIA') ? 'text-orange-400' : 'text-green-400'}>
              {feature.includes('CLAWDIA') ? '🔥' : '✓'}
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
