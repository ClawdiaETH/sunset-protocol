import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') || '0x...'
  const coverage = searchParams.get('coverage') || '0'
  const tier = searchParams.get('tier') || 'Unknown'
  const status = searchParams.get('status') || 'Active'

  // Simple SVG-based OG image
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a2e"/>
      
      <!-- Gradient overlay -->
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      
      <!-- Title -->
      <text x="60" y="80" fill="#ff6b35" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
        🌅 Sunset Protocol
      </text>
      
      <!-- Token -->
      <text x="60" y="160" fill="#888" font-family="monospace" font-size="24">
        ${token.slice(0, 20)}...${token.slice(-8)}
      </text>
      
      <!-- Coverage Amount -->
      <text x="60" y="320" fill="#fff" font-family="Arial, sans-serif" font-size="96" font-weight="bold">
        ${coverage} ETH
      </text>
      <text x="60" y="380" fill="#888" font-family="Arial, sans-serif" font-size="32">
        Effective Coverage
      </text>
      
      <!-- Tier & Status -->
      <text x="60" y="500" fill="#ff6b35" font-family="Arial, sans-serif" font-size="36">
        ${tier} Tier
      </text>
      <text x="60" y="560" fill="${status === 'Sunset' ? '#ef4444' : '#22c55e'}" font-family="Arial, sans-serif" font-size="32">
        ${status === 'Sunset' ? '🌅 ' : '✓ '}${status}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
