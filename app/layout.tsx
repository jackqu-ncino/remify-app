import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Remify',
  description: 'Never miss a birthday, anniversary, or special occasion again.',
  manifest: '/manifest.json',
  themeColor: '#a82dd6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Remify',
  },
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
