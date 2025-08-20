'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Проверяем если уже залогинен
  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          router.push('/profile');
        }
      }
    };
    checkAuth();

    // Проверяем параметры ошибки
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError('Failed to sign in. Please try again.');
    }
  }, [router]);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/google';
  };

  const handleWorldIDUpgrade = () => {
    // Переход на страницу апгрейда World ID
    router.push('/world-id-upgrade');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Back button */}
        <Link href="/" className="absolute top-8 left-8 text-white hover:text-purple-400 transition-colors">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🎵 tootFM
            </h1>
            <p className="text-gray-300">
              One Account, All Your Music
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* PRIMARY: Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  {/* Google Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* What you get */}
            <div className="bg-black/20 rounded-xl p-4 space-y-2">
              <p className="text-white font-semibold mb-2">What you get:</p>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-green-400">✓</span>
                <span>YouTube Music included automatically</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-green-400">✓</span>
                <span>Connect Spotify, Apple Music & more</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-green-400">✓</span>
                <span>Create & join music parties</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <span className="text-green-400">✓</span>
                <span>AI-powered playlists</span>
              </div>
            </div>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-transparent text-gray-400">premium features</span>
              </div>
            </div>
            
            {/* OPTIONAL: World ID for premium */}
            <button
              onClick={handleWorldIDUpgrade}
              className="w-full py-3 bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-400 font-semibold rounded-xl border border-green-500/30 hover:bg-green-600/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Add World ID for Sybil-Resistant Voting
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}