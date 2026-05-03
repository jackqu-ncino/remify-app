import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Remify',
  description: 'Never miss a birthday, anniversary, or special occasion again.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Remify',
  },
}

export const viewport: Viewport = {
  themeColor: '#3B0764',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
        {children}
      </body>
    </html>
  )
}
