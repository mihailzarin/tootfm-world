"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Music, Users, Sparkles, Play, Shield } from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated, login } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black/50 to-blue-900/50"></div>
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                <Music className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              tootFM
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionary web app for creating perfect party playlists by analyzing everyone's music taste
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/profile"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                  >
                    My Profile
                  </Link>
                  <Link 
                    href="/party/create"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Create Party
                  </Link>
                </>
              ) : (
                <button
                  onClick={login}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                >
                  Get Started with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Why tootFM?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-8 rounded-2xl border border-purple-500/20">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full w-fit mb-6">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Analysis</h3>
              <p className="text-gray-300">
                Our AI analyzes music profiles from Spotify, Last.fm, and Apple Music to create the perfect playlist for everyone.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 p-8 rounded-2xl border border-blue-500/20">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-full w-fit mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Democratic Voting</h3>
              <p className="text-gray-300">
                World ID ensures fair voting - one person, one vote. Everyone gets a say in the playlist.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 p-8 rounded-2xl border border-green-500/20">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full w-fit mb-6">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Party Radio Mode</h3>
              <p className="text-gray-300">
                Dynamic playlists that adapt to the party mood with AI-generated recommendations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 p-8 rounded-2xl border border-orange-500/20">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full w-fit mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure & Private</h3>
              <p className="text-gray-300">
                Google OAuth for secure login, World ID for fair voting. Your data stays private.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 rounded-2xl border border-indigo-500/20">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-full w-fit mb-6">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Multi-Platform</h3>
              <p className="text-gray-300">
                Connect Spotify, Last.fm, and Apple Music for a complete picture of your music taste.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-pink-900/50 to-rose-900/50 p-8 rounded-2xl border border-pink-500/20">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-full w-fit mb-6">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Smart Deduplication</h3>
              <p className="text-gray-300">
                Intelligent merging of tracks from different services to create unified music profiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Connect Your Music</h3>
              <p className="text-gray-300">
                Link your Spotify, Last.fm, and Apple Music accounts to create your unified music profile.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Create a Party</h3>
              <p className="text-gray-300">
                Start a party and invite friends. Everyone connects their music profiles.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Get Perfect Playlist</h3>
              <p className="text-gray-300">
                AI generates the perfect playlist that everyone will love. Vote on tracks with World ID.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Create the Perfect Party Playlist?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already creating amazing party experiences with tootFM.
          </p>
          {!isAuthenticated && (
            <button
              onClick={login}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Start Your Music Journey
            </button>
          )}
        </div>
      </section>
    </div>
  );
}