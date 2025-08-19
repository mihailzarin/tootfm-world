'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSpotifyLogin = () => {
    setIsLoading('spotify');
    window.location.href = '/api/spotify/auth';
  };

  const handleLastFmLogin = () => {
    setIsLoading('lastfm');
    window.location.href = '/api/music/lastfm/connect';
  };

  const handleWorldIdLogin = () => {
    router.push('/?worldid=true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to tootFM</h1>
          <p className="text-gray-400">Sign in with your music service</p>
        </div>

        {/* Sign in options */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 space-y-4">
          {/* Spotify */}
          <button
            onClick={handleSpotifyLogin}
            disabled={isLoading !== null}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            {isLoading === 'spotify' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <span className="text-2xl">🎵</span>
                Continue with Spotify
              </>
            )}
          </button>

          {/* Last.fm */}
          <button
            onClick={handleLastFmLogin}
            disabled={isLoading !== null}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            {isLoading === 'lastfm' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <span className="text-2xl">📻</span>
                Continue with Last.fm
              </>
            )}
          </button>

          {/* Apple Music (Coming Soon) */}
          <button
            disabled
            className="w-full bg-gray-800 opacity-50 cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🍎</span>
            Apple Music (Coming Soon)
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-gray-400">or</span>
            </div>
          </div>

          {/* World ID */}
          <button
            onClick={handleWorldIdLogin}
            disabled={isLoading !== null}
            className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 border border-white/20"
          >
            <span className="text-2xl">🌍</span>
            Sign in with World ID
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>One person, one vote, perfect playlist</p>
        </div>
      </div>
    </div>
  );
}
