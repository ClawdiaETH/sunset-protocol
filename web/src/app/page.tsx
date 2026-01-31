import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🌅</div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            Graceful exits for agent tokens
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            When tokens die, holders get value back. Not zero. Something.
            <br />
            Fee stream coverage for Clanker, Bankr, and Clawnch tokens on Base.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition"
            >
              Register token
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition"
            >
              Check coverage
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8">
            <StatCard value="—" label="Covered tokens" />
            <StatCard value="—" label="Coverage pool" />
            <StatCard value="—" label="Sunsets claimed" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Register"
              description="Deploy a FeeSplitter that routes a % of your trading fees to Sunset Protocol"
            />
            <StepCard
              number={2}
              title="Accumulate"
              description="As your token trades, coverage pool grows. More activity = more protection."
            />
            <StepCard
              number={3}
              title="Claim"
              description="If sunset triggers, holders claim their pro-rata share of the coverage pool."
            />
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16 px-4 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Coverage tiers</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <TierCard
              name="Basic"
              feeShare="5%"
              multiplier="1x"
              description="Minimal coverage for small projects"
            />
            <TierCard
              name="Standard"
              feeShare="10%"
              multiplier="1.5x"
              description="Recommended for most tokens"
              featured
            />
            <TierCard
              name="Premium"
              feeShare="15%"
              multiplier="2x"
              description="Maximum protection + cross-subsidy"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Built for the agent economy</h2>
          <p className="text-zinc-400 mb-8">
            Most tokens will eventually sunset. The question is whether holders get zero or something.
            Sunset Protocol turns bad failures into good failures.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition"
          >
            Protect your token →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-sm text-zinc-500">
          <span>Built by <a href="https://twitter.com/Clawdia_ETH" className="text-orange-400 hover:underline">Clawdia</a> 🐚</span>
          <div className="flex gap-6">
            <a href="https://github.com/ClawdiaETH/sunset-protocol" className="hover:text-white transition">GitHub</a>
            <a href="https://twitter.com/Clawdia_ETH" className="hover:text-white transition">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-orange-400 mb-2">{value}</div>
      <div className="text-zinc-500">{label}</div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  )
}

function TierCard({ 
  name, 
  feeShare, 
  multiplier, 
  description,
  featured = false 
}: { 
  name: string
  feeShare: string
  multiplier: string
  description: string
  featured?: boolean
}) {
  return (
    <div className={`rounded-xl p-6 border ${featured ? 'bg-orange-500/10 border-orange-500/50' : 'bg-zinc-900 border-zinc-800'}`}>
      {featured && (
        <div className="text-xs font-medium text-orange-400 uppercase tracking-wide mb-2">Recommended</div>
      )}
      <h3 className="text-2xl font-bold mb-4">{name}</h3>
      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-zinc-500">Fee share</span>
          <span className="font-medium">{feeShare}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Coverage multiplier</span>
          <span className="font-medium">{multiplier}</span>
        </div>
      </div>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  )
}
