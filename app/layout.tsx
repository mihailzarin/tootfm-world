import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'tootFM - Revolutionary Party Playlists',
  description: 'Create perfect party playlists by analyzing everyone\'s music taste with AI-powered recommendations',
  keywords: 'music, playlist, party, spotify, lastfm, apple music, ai, recommendations',
  authors: [{ name: 'tootFM Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
