'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Users, Zap, ArrowRight } from 'lucide-react';
import WorldIDButton from '@/components/WorldIDButton';
import { ClientAuth } from '@/lib/auth/client-auth';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWorldId, setShowWorldId] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    setIsLoggedIn(ClientAuth.isLoggedIn());
    
    // Check if World ID login was requested
    const params = new URLSearchParams(window.location.search);
    if (params.get('worldid') === 'true') {
      setShowWorldId(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-6 h-6 text-purple-400" />
            <span className="font-bold text-xl text-white">tootFM</span>
          </div>
          <nav className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => router.push('/my-parties')}
                  className="text-gray-300 hover:text-white transition"
                >
                  My Parties
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="text-gray-300 hover:text-white transition"
                >
                  Profile
                </button>
                <button
                  onClick={() => ClientAuth.logout()}
                  className="text-gray-400 hover:text-white transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/signin')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Music Democracy
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Starts Here
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Create parties where everyone gets one vote per track. 
            No bots, no manipulation - just pure democratic playlists powered by World ID.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => router.push('/party/create')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center gap-2 text-lg"
                >
                  Create Party
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/my-parties')}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-all text-lg backdrop-blur"
                >
                  My Parties
                </button>
              </>
            ) : showWorldId ? (
              <WorldIDButton />
            ) : (
              <>
                <button
                  onClick={() => router.push('/signin')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center gap-2 text-lg"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowWorldId(true)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-all text-lg backdrop-blur"
                >
                  Use World ID
                </button>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-full mb-4">
              <Music className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Multi-Service Support</h3>
            <p className="text-gray-400">
              Connect Spotify, Apple Music, or Last.fm. Your music, your choice.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-full mb-4">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Democratic Voting</h3>
            <p className="text-gray-400">
              One person, one vote per track. Fair music selection guaranteed.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-full mb-4">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Real-time Sync</h3>
            <p className="text-gray-400">
              Instant updates across all devices. Watch the playlist evolve live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
