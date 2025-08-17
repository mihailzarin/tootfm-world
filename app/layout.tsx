import './globals.css'

export const metadata = {
  title: 'tootFM - Music Profile',
  description: 'Your personal music profile',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
        {children}
      </body>
    </html>
  )
}
