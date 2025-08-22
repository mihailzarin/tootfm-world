import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "tootFM - One Account, All Your Music",
  description: "Create perfect playlists for parties by analyzing everyone's music taste. Connect Spotify, Apple Music, and Last.fm to generate AI-powered collaborative playlists.",
  keywords: "music, playlist, party, spotify, apple music, lastfm, collaborative playlist, AI playlist",
  authors: [{ name: "tootFM" }],
  openGraph: {
    title: "tootFM - One Account, All Your Music",
    description: "Create perfect playlists for parties by analyzing everyone's music taste",
    url: "https://tootfm.world",
    siteName: "tootFM",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "tootFM - Collaborative Music Democracy",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tootFM - One Account, All Your Music",
    description: "Create perfect playlists for parties by analyzing everyone's music taste",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900`}>
        <Providers>
          <div className="relative min-h-screen">
            {/* Background effects */}
            <div className="fixed inset-0 bg-black/20 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            
            {/* Main content */}
            <main className="relative z-10">
              {children}
            </main>
            
            {/* Optional: Global footer or navigation could go here */}
          </div>
        </Providers>
      </body>
    </html>
  );
}