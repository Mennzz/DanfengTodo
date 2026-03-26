import './globals.css'
import type { Metadata, Viewport } from 'next'
import SessionProvider from '@/components/providers/SessionProvider'

export const metadata: Metadata = {
  title: 'DanfengTodo',
  description: 'A todo list application with analytics',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="overflow-hidden">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
