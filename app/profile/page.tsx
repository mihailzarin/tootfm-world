"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UserData {
  nullifier_hash: string;
  verified: boolean;
  credentialType?: string;
}

interface SpotifyUser {
  id: string;
  display_name?: string;
  email: string;
  images?: { url: string }[];
}

interface MusicProfile {
  topGenres: string[];
  musicPersonality: string;
  favoriteArtists: string[];
  recentTracks: string[];
  energyLevel: number;
  diversityScore: number;
}

function MusicPortraitSection({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<MusicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Используем useCallback чтобы функция не пересоздавалась
  const fetchMusicProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/music/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) throw new Error('Failed to analyze');
      
      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      console.error('Music analysis error:', err);
      // Fallback to demo data
      setProfile({
        topGenres: ["Electronic", "Pop", "Hip-Hop", "Rock", "Indie"],
        musicPersonality: "Eclectic Explorer",
        favoriteArtists: ["Artist 1", "Artist 2", "Artist 3"],
        recentTracks: ["Track 1", "Track 2", "Track 3"],
        energyLevel: 75,
        diversityScore: 85
      });
    } finally {
      setLoading(false);
    }
  }, [userId]); // Добавляем userId в зависимости

  useEffect(() => {
    fetchMusicProfile();
  }, [fetchMusicProfile]); // Теперь используем fetchMusicProfile в зависимостях

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Unable to load music profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-2">Your Music Personality</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {profile.musicPersonality}
        </p>
      </div>

      <div className="bg-black/30 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Genres</h3>
        <div className="flex flex-wrap gap-2">
          {profile.topGenres.map((genre, index) => (
            <span
              key={index}
              className="px-4 py-2 rounded-full text-sm font-medium text-white"
              style={{
                background: `hsl(${index * 60}, 70%, 50%)`
              }}
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/30 rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-2">Energy Level</p>
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚡</div>
            <div className="flex-1">
              <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full transition-all"
                  style={{ width: `${profile.energyLevel}%` }}
                />
              </div>
            </div>
            <span className="text-white font-bold">{profile.energyLevel}%</span>
          </div>
        </div>

        <div className="bg-black/30 rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-2">Diversity Score</p>
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎨</div>
            <div className="flex-1">
              <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-full transition-all"
                  style={{ width: `${profile.diversityScore}%` }}
                />
              </div>
            </div>
            <span className="text-white font-bold">{profile.diversityScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'portrait' | 'stats'>('services');
  const [connecting, setConnecting] = useState({
    spotify: false,
    apple: false,
    lastfm: false
  });

  useEffect(() => {
    const loadUserData = () => {
      const stored = localStorage.getItem("user_data");
      if (!stored) {
        console.log("No user data found, redirecting...");
        router.push("/");
        return null;
      }

      try {
        const data = JSON.parse(stored);
        console.log("User data loaded:", data);
        return data;
      } catch (e) {
        console.error("Failed to parse user data:", e);
        router.push("/");
        return null;
      }
    };

    const user = loadUserData();
    if (user) {
      setUserData(user);
    }

    if (searchParams.get("spotify") === "connected") {
      handleSpotifyCallback();
    }

    const savedSpotify = localStorage.getItem("spotify_user");
    if (savedSpotify) {
      try {
        setSpotifyUser(JSON.parse(savedSpotify));
      } catch (e) {
        console.error("Failed to load Spotify user:", e);
      }
    }
  }, [router, searchParams]);

  const handleSpotifyCallback = () => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookie = parts.pop()?.split(';').shift();
        return cookie ? decodeURIComponent(cookie) : null;
      }
      return null;
    };

    const spotifyData = getCookie("spotify_user");
    if (spotifyData) {
      try {
        const user = JSON.parse(spotifyData);
        setSpotifyUser(user);
        localStorage.setItem("spotify_user", JSON.stringify(user));
        localStorage.setItem("spotify_connected", "true");
      } catch (e) {
        console.error("Failed to parse Spotify data:", e);
      }
    }
    setConnecting(prev => ({ ...prev, spotify: false }));
  };

  const connectSpotify = () => {
    setConnecting(prev => ({ ...prev, spotify: true }));
    window.location.href = '/api/spotify/auth';
  };

  const disconnectSpotify = () => {
    setSpotifyUser(null);
    localStorage.removeItem("spotify_user");
    localStorage.removeItem("spotify_connected");
    document.cookie = "spotify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "spotify_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const connectService = (service: 'apple' | 'lastfm') => {
    alert(`${service === 'apple' ? 'Apple Music' : 'Last.fm'} integration coming soon! 🎵`);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    router.push("/");
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  const userId = userData.nullifier_hash || "anonymous";
  const displayId = userId.length > 16 ? `${userId.slice(0, 8)}...${userId.slice(-8)}` : userId;

  // Типизируем activeTab более явно для TypeScript
  type TabType = 'services' | 'portrait' | 'stats';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black">
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                {spotifyUser?.display_name || "Music Profile"}
              </h1>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">World ID:</span>
                  <code className="text-purple-300 bg-black/30 px-2 py-1 rounded">
                    {displayId}
                  </code>
                </div>
                {spotifyUser && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Spotify:</span>
                    <span className="text-green-400">{spotifyUser.email}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-6 py-2 rounded-full transition-all hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {([
            { id: 'services' as TabType, label: '🎵 Services', color: 'from-blue-500 to-purple-500' },
            { id: 'portrait' as TabType, label: '🎨 Music Portrait', color: 'from-purple-500 to-pink-500' },
            { id: 'stats' as TabType, label: '📊 Statistics', color: 'from-pink-500 to-red-500' }
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-2xl font-medium transition-all transform hover:scale-105 ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 min-h-[400px]">
          {activeTab === 'services' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-6">Connected Services</h2>
              
              <div className="bg-gradient-to-r from-green-900/30 to-green-700/30 rounded-2xl p-6 border border-green-500/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-2xl">
                      🎵
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Spotify</h3>
                      <p className="text-green-300 text-sm">
                        {spotifyUser ? `Connected as ${spotifyUser.display_name || spotifyUser.email}` : 'Stream & control music'}
                      </p>
                    </div>
                  </div>
                  {spotifyUser ? (
                    <button
                      onClick={disconnectSpotify}
                      className="bg-red-500/30 hover:bg-red-500/40 text-red-300 px-5 py-2 rounded-full transition-all"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={connectSpotify}
                      disabled={connecting.spotify}
                      className={`${
                        connecting.spotify 
                          ? 'bg-gray-600 cursor-wait' 
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white px-6 py-2 rounded-full transition-all font-medium`}
                    >
                      {connecting.spotify ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-900/30 to-pink-700/30 rounded-2xl p-6 border border-pink-500/20 opacity-75">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center text-2xl">
                      🎵
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Apple Music</h3>
                      <p className="text-pink-300 text-sm">Coming soon</p>
                    </div>
                  </div>
                  <button
                    onClick={() => connectService('apple')}
                    className="bg-gray-600 text-gray-300 px-6 py-2 rounded-full cursor-not-allowed"
                    disabled
                  >
                    Connect
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-900/30 to-red-700/30 rounded-2xl p-6 border border-red-500/20 opacity-75">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-2xl">
                      📊
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Last.fm</h3>
                      <p className="text-red-300 text-sm">Track listening history</p>
                    </div>
                  </div>
                  <button
                    onClick={() => connectService('lastfm')}
                    className="bg-gray-600 text-gray-300 px-6 py-2 rounded-full cursor-not-allowed"
                    disabled
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portrait' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Your Music Portrait</h2>
              {spotifyUser ? (
                <MusicPortraitSection userId={userId} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎵</div>
                  <p className="text-gray-400 text-lg mb-4">
                    Connect Spotify to see your music portrait
                  </p>
                  <button
                    onClick={() => setActiveTab('services')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium hover:scale-105 transition-all"
                  >
                    Connect Services
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Party Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <div className="text-3xl font-bold text-white">0</div>
                  <div className="text-gray-400">Parties Joined</div>
                </div>
                <div className="bg-black/30 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-2">🎵</div>
                  <div className="text-3xl font-bold text-white">0</div>
                  <div className="text-gray-400">Songs Voted</div>
                </div>
                <div className="bg-black/30 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="text-3xl font-bold text-white">0</div>
                  <div className="text-gray-400">Top Picks</div>
                </div>
              </div>
              <div className="mt-8 text-center">
                <p className="text-gray-400">Start joining parties to see your statistics!</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/")}
            className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full transition-all"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}