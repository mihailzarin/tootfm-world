'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, ArrowLeft } from 'lucide-react';
import SpotifyConnect from '@/components/SpotifyConnect';
import LastFmConnect from '@/components/music-services/LastFmConnect';
import WorldIDButton from '@/components/WorldIDButton';

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    const hasAuth = localStorage.getItem('world_id') || 
                   document.cookie.includes('spotify_user') ||
                   document.cookie.includes('lastfm_username');
    
    if (hasAuth) {
      router.push('/profile');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <Music className="w-6 h-6 text-purple-400" />
            <span className="font-bold text-xl text-white">tootFM</span>
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Sign In</h1>
          <p className="text-gray-400">Choose your preferred method</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
            <h3 className="text-white font-medium mb-4">World ID (Recommended)</h3>
            <WorldIDButton />
          </div>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
            <h3 className="text-white font-medium mb-4">Music Services</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-white text-sm mb-2">Spotify</h4>
                <SpotifyConnect />
              </div>
              <div>
                <h4 className="text-white text-sm mb-2">Last.fm</h4>
                <LastFmConnect />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
