import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sunset Protocol | Graceful exits for agent tokens',
  description: 'When tokens die, holders get value back. Fee stream coverage for Clanker, Bankr, and Clawnch tokens on Base.',
  openGraph: {
    title: 'Sunset Protocol',
    description: 'Graceful exits for agent tokens',
    images: ['/og.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-white min-h-screen`}>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
