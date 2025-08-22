'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music, User, LogOut, Loader2 } from 'lucide-react';
import SpotifyConnect from '@/components/SpotifyConnect';
import LastFmConnect from '@/components/music-services/LastFmConnect';
import CreatePartyButton from '@/components/CreatePartyButton';
import AppleMusicConnect from '@/src/components/music-services/AppleMusicConnect';
import MusicPortrait from '@/components/profile/MusicPortrait';
import { checkAuthStatus, clearAuth, getSpotifyUser, getLastFmUsername, AuthUser } from '@/lib/auth/client-auth';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<AuthUser | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<any>(null);
  const [lastfmUser, setLastfmUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check authentication status
        const authUser = await checkAuthStatus();
        if (!authUser) {
          router.push('/login');
          return;
        }
        
        setUserData(authUser);

        // Get Spotify user data
        const spotifyData = getSpotifyUser();
        if (spotifyData) {
          setSpotifyUser(spotifyData);
        }

        // Get Last.fm username
        const lastfmData = getLastFmUsername();
        if (lastfmData) {
          setLastfmUser(lastfmData);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleSignOut = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Clear all local data
      clearAuth();
      
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check for connected services
  const hasAnyService = !!spotifyUser || !!lastfmUser || (typeof window !== 'undefined' && !!localStorage.getItem('apple_music_token'));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Not authenticated</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => router.push('/')} 
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <Music className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-xl text-white">tootFM</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/my-parties')}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              My Parties
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/5 backdrop-blur rounded-3xl p-8">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-purple-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">Your Profile</h1>
              <p className="text-gray-400">
                {userData.displayName} • Level: {userData.level}
              </p>
              {/* Create Party Button */}
              {hasAnyService && (
                <div className="mt-4">
                  <CreatePartyButton hasServices={true} />
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-white/10">
            <button
              onClick={() => setActiveTab('services')}
              className={`pb-3 px-1 transition ${
                activeTab === 'services' 
                  ? 'text-white border-b-2 border-purple-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Music Services
            </button>
            <button
              onClick={() => setActiveTab('portrait')}
              className={`pb-3 px-1 transition ${
                activeTab === 'portrait' 
                  ? 'text-white border-b-2 border-purple-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Music Portrait
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-3 px-1 transition ${
                activeTab === 'stats' 
                  ? 'text-white border-b-2 border-purple-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Statistics
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Spotify */}
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Spotify</h3>
                  {spotifyUser && (
                    <span className="text-green-400 text-sm">Connected</span>
                  )}
                </div>
                {spotifyUser ? (
                  <div className="text-gray-400">
                    <p>Logged in as: {spotifyUser.name || spotifyUser.id}</p>
                    <p className="text-sm mt-1">Email: {spotifyUser.email}</p>
                  </div>
                ) : (
                  <SpotifyConnect />
                )}
              </div>

              {/* Last.fm */}
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Last.fm</h3>
                  {lastfmUser && (
                    <span className="text-green-400 text-sm">Connected</span>
                  )}
                </div>
                {lastfmUser ? (
                  <div className="text-gray-400">
                    <p>Username: {lastfmUser}</p>
                  </div>
                ) : (
                  <LastFmConnect />
                )}
              </div>

              {/* Apple Music */}
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Apple Music</h3>
                </div>
                <AppleMusicConnect />
              </div>
            </div>
          )}

          {activeTab === 'portrait' && (
            <MusicPortrait userId={userData.id} />
          )}

          {activeTab === 'stats' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600/20 rounded-full mb-4">
                <Music className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
              <p className="text-gray-400">
                Your music statistics and party history will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}