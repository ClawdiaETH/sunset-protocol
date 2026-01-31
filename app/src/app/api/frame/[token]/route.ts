import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { publicClient, addresses, vaultAbi, registryAbi, getTierInfo, formatWei, isTokenRegistered } from '@/lib/contracts'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sunset.example.com'

// Generate frame HTML
function createFrame({
  title,
  image,
  buttons,
  postUrl,
}: {
  title: string
  image: string
  buttons: { label: string; action?: string; target?: string }[]
  postUrl: string
}) {
  const buttonTags = buttons
    .map((btn, i) => {
      let tags = `<meta property="fc:frame:button:${i + 1}" content="${btn.label}" />`
      if (btn.action) {
        tags += `<meta property="fc:frame:button:${i + 1}:action" content="${btn.action}" />`
      }
      if (btn.target) {
        tags += `<meta property="fc:frame:button:${i + 1}:target" content="${btn.target}" />`
      }
      return tags
    })
    .join('\n')

  return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${image}" />
  <meta property="fc:frame:post_url" content="${postUrl}" />
  ${buttonTags}
  <meta property="og:title" content="${title}" />
  <meta property="og:image" content="${image}" />
</head>
<body></body>
</html>`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!isAddress(token)) {
      return new NextResponse(
        createFrame({
          title: 'Invalid Token',
          image: `${APP_URL}/api/og/error?msg=Invalid%20token%20address`,
          buttons: [{ label: 'Try Again' }],
          postUrl: `${APP_URL}/api/frame/${token}`,
        }),
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Get coverage info
    const isRegistered = await isTokenRegistered(token as `0x${string}`)

    if (!isRegistered) {
      return new NextResponse(
        createFrame({
          title: 'Not Covered',
          image: `${APP_URL}/api/og/not-covered?token=${token}`,
          buttons: [
            { label: 'Register Token', action: 'link', target: `${APP_URL}/register` },
          ],
          postUrl: `${APP_URL}/api/frame/${token}`,
        }),
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Get coverage details
    const [, , , tier] = await publicClient.readContract({
      address: addresses.registry,
      abi: registryAbi,
      functionName: 'projects',
      args: [token as `0x${string}`],
    })

    const [deposited, effective, isSunset] = await publicClient.readContract({
      address: addresses.vault,
      abi: vaultAbi,
      functionName: 'getTotalCoverage',
      args: [token as `0x${string}`],
    })

    const tierInfo = getTierInfo(Number(tier))
    const coverageStr = formatWei(effective)
    const status = isSunset ? 'Sunset' : 'Active'

    // Generate OG image URL with params
    const imageUrl = `${APP_URL}/api/og/coverage?token=${token}&coverage=${coverageStr}&tier=${tierInfo.name}&status=${status}`

    return new NextResponse(
      createFrame({
        title: `Sunset Protocol - ${token.slice(0, 8)}...`,
        image: imageUrl,
        buttons: [
          { label: 'Check My Claim', action: 'post' },
          { label: 'View Details', action: 'link', target: `${APP_URL}/token/${token}` },
        ],
        postUrl: `${APP_URL}/api/frame/${token}`,
      }),
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('Frame error:', error)
    const { token: tokenAddr } = await params
    return new NextResponse(
      createFrame({
        title: 'Error',
        image: `${APP_URL}/api/og/error?msg=Failed%20to%20load`,
        buttons: [{ label: 'Try Again' }],
        postUrl: `${APP_URL}/api/frame/${tokenAddr}`,
      }),
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// Handle frame interactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    
    // Get the user's address from the frame message
    const fid = body?.untrustedData?.fid
    const buttonIndex = body?.untrustedData?.buttonIndex

    // For "Check My Claim" button
    if (buttonIndex === 1) {
      // In a real implementation, you'd verify the frame signature
      // and look up the user's connected wallet
      return new NextResponse(
        createFrame({
          title: 'Connect Wallet',
          image: `${APP_URL}/api/og/connect?msg=Connect%20wallet%20to%20check%20claim`,
          buttons: [
            { label: 'Connect & Claim', action: 'tx', target: `${APP_URL}/api/frame/${token}/tx` },
            { label: 'Back', action: 'post' },
          ],
          postUrl: `${APP_URL}/api/frame/${token}`,
        }),
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Default: show initial frame
    return GET(request, { params })
  } catch (error) {
    console.error('Frame POST error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}
