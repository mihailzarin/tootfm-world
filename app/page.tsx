'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Users, Zap, ArrowRight, Globe, Sparkles, Shield } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for Google/main auth
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsLoggedIn(true);
          // Try to get user name from localStorage or cookies
          const savedName = localStorage.getItem('user_display_name');
          if (savedName) setUserName(savedName);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Clear all local data
      localStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      setIsLoggedIn(false);
      setUserName(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/login')}
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
          {/* Logo/Title */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-6">
              <Music className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-6xl font-bold text-white mb-6">
            Music Democracy
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Starts Here
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            One account, all your music services. Create parties where everyone's vote counts.
            Powered by Google, enhanced with World ID.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => router.push('/party/create')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center gap-2 text-lg shadow-xl"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Party
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/my-parties')}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-all text-lg backdrop-blur border border-white/20"
                >
                  My Parties
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="bg-white hover:bg-gray-100 text-purple-900 font-bold py-4 px-8 rounded-xl transition-all flex items-center gap-2 text-lg shadow-xl transform hover:scale-105"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Get Started with Google
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push('/login#worldid')}
                  className="bg-green-600/20 hover:bg-green-600/30 text-green-400 font-semibold py-4 px-8 rounded-xl transition-all text-lg backdrop-blur border border-green-500/30"
                >
                  <Globe className="w-5 h-5 inline mr-2" />
                  Premium with World ID
                </button>
              </>
            )}
          </div>

          {/* Trust badges */}
          {!isLoggedIn && (
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Secure Google OAuth
              </span>
              <span className="flex items-center gap-1">
                <Music className="w-4 h-4" />
                YouTube Music Included
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                World ID Optional
              </span>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full mb-4">
              <Music className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">All Music Services</h3>
            <p className="text-gray-400">
              Connect Spotify, Apple Music, YouTube Music, and Last.fm. One account for everything.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full mb-4">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Democratic Voting</h3>
            <p className="text-gray-400">
              Every guest gets one vote per track. Upgrade with World ID for sybil-resistant voting.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 text-center hover:bg-white/10 transition-all">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full mb-4">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Playlists</h3>
            <p className="text-gray-400">
              AI analyzes everyone's taste to generate the perfect party playlist automatically.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">1️⃣</div>
              <h3 className="text-white font-semibold mb-2">Sign In</h3>
              <p className="text-gray-400 text-sm">Use your Google account</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">2️⃣</div>
              <h3 className="text-white font-semibold mb-2">Connect Music</h3>
              <p className="text-gray-400 text-sm">Link your music services</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">3️⃣</div>
              <h3 className="text-white font-semibold mb-2">Create Party</h3>
              <p className="text-gray-400 text-sm">Get a unique party code</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">4️⃣</div>
              <h3 className="text-white font-semibold mb-2">Vote & Enjoy</h3>
              <p className="text-gray-400 text-sm">Democratic music selection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Music className="w-5 h-5 text-purple-400" />
              <span>© 2025 tootFM. Music democracy for everyone.</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">About</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}