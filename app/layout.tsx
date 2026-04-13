import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Screenshot API - Capture any webpage',
  description: 'Fast, reliable screenshot API with device emulation, dark mode, and multiple formats. Capture any webpage as PNG, JPEG, WebP or PDF.',
  keywords: ['screenshot', 'api', 'webpage', 'capture', 'automation', 'browser'],
  authors: [{ name: 'endpnt.dev' }],
  openGraph: {
    title: 'Screenshot API - Capture any webpage',
    description: 'Fast, reliable screenshot API with device emulation, dark mode, and multiple formats.',
    url: 'https://screenshot.endpnt.dev',
    siteName: 'Screenshot API',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Screenshot API - Capture any webpage',
    description: 'Fast, reliable screenshot API with device emulation, dark mode, and multiple formats.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}