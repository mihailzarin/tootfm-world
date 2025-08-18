"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [musicProfile, setMusicProfile] = useState<Record<string, any> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem("user_data");
      
      if (!stored) {
        router.push("/");
        return;
      }

      const data = JSON.parse(stored);
      setUserData(data);

      const spotifyStored = localStorage.getItem("spotify_user");
      if (spotifyStored) {
        try {
          const spotifyData = JSON.parse(spotifyStored);
          setSpotifyUser(spotifyData);
          // Автоматически загружаем музыкальный профиль если Spotify подключен
          loadMusicProfile(data);
        } catch (e) {
          console.error("Error parsing Spotify data:", e);
        }
      }

      if (searchParams?.get("spotify") === "connected") {
        handleSpotifyCallback();
      }
    } catch (error) {
      console.error("Error loading data:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSpotifyCallback = () => {
    try {
      const cookies = document.cookie.split(';');
      const spotifyCookie = cookies.find(c => c.trim().startsWith('spotify_user='));
      
      if (spotifyCookie) {
        const userData = decodeURIComponent(spotifyCookie.split('=')[1]);
        const user = JSON.parse(userData);
        setSpotifyUser(user);
        localStorage.setItem("spotify_user", JSON.stringify(user));
        // Загружаем профиль после подключения Spotify
        if (userData) {
          loadMusicProfile(userData);
        }
      }
    } catch (error) {
      console.error("Error handling Spotify callback:", error);
    }
  };

  const connectSpotify = () => {
    window.location.href = '/api/spotify/auth';
  };

  const disconnectSpotify = () => {
    setSpotifyUser(null);
    setMusicProfile(null);
    localStorage.removeItem("spotify_user");
    localStorage.removeItem("spotify_connected");
    document.cookie = "spotify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "spotify_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const loadMusicProfile = async (userDataParam?: any) => {
    const data = userDataParam || userData;
    if (!data) return;
    
    setProfileLoading(true);
    
    try {
      const userId = data.nullifier_hash || 
                     data.worldId || 
                     data.id || 
                     data.user_id ||
                     "demo_user";

      console.log("Loading music profile for:", userId);

      const response = await fetch('/api/music/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Music profile received:", result);
        
        // Нормализуем данные профиля
        const normalizedProfile = {
          musicPersonality: result.profile?.musicPersonality || "Music Explorer",
          energyLevel: result.profile?.energyLevel || 70,
          diversityScore: result.profile?.diversityScore || 80,
          // ВАЖНО: Обрабатываем topGenres правильно
          topGenres: normalizeGenres(result.profile?.topGenres || [])
        };
        
        setMusicProfile(normalizedProfile);
      } else {
        // Fallback данные
        setMusicProfile({
          topGenres: ["Pop", "Rock", "Electronic", "Hip-Hop", "Jazz"],
          musicPersonality: "Eclectic Explorer",
          energyLevel: 75,
          diversityScore: 85
        });
      }
    } catch (error) {
      console.error("Error loading music profile:", error);
      // Демо данные при ошибке
      setMusicProfile({
        topGenres: ["Pop", "Rock", "Electronic"],
        musicPersonality: "Music Lover",
        energyLevel: 70,
        diversityScore: 80
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Функция для нормализации жанров - обрабатывает и объекты и строки
  const normalizeGenres = (genres: any[]): string[] => {
    if (!Array.isArray(genres)) return [];
    
    return genres.map(item => {
      // Если это объект с полем genre
      if (typeof item === 'object' && item !== null) {
        return item.genre || item.name || String(item);
      }
      // Если это строка
      if (typeof item === 'string') {
        return item;
      }
      // Fallback
      return String(item);
    }).filter(Boolean).slice(0, 10); // Максимум 10 жанров
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">No user data. Redirecting...</div>
      </div>
    );
  }

  const getUserId = () => {
    const id = userData?.nullifier_hash || 
               userData?.worldId || 
               userData?.id || 
               userData?.user_id ||
               "User";
    
    if (typeof id === 'string' && id.length > 20) {
      return id.substring(0, 10) + "..." + id.substring(id.length - 10);
    }
    return String(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black">
      <div className="max-w-4xl mx-auto p-6">
        {/* HEADER */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
              <p className="text-gray-300">
                World ID: <span className="font-mono text-sm">{getUserId()}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-full"
            >
              Logout
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-2 rounded-full transition-all ${
              activeTab === 'services' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-300'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => {
              setActiveTab('portrait');
              if (!musicProfile && spotifyUser && !profileLoading) {
                loadMusicProfile();
              }
            }}
            className={`px-6 py-2 rounded-full transition-all ${
              activeTab === 'portrait' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-300'
            }`}
          >
            Music Portrait
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2 rounded-full transition-all ${
              activeTab === 'stats' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-300'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* CONTENT */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6">
          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Music Services</h2>
              
              {/* Spotify */}
              <div className="bg-black/30 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold">Spotify</h3>
                  <p className="text-gray-400 text-sm">
                    {spotifyUser ? `Connected: ${spotifyUser.email || spotifyUser.id || 'Active'}` : 'Not connected'}
                  </p>
                </div>
                {spotifyUser ? (
                  <button
                    onClick={disconnectSpotify}
                    className="bg-red-500/30 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-full transition-all"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={connectSpotify}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-all"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Apple Music */}
              <div className="bg-black/30 rounded-xl p-4 flex justify-between items-center opacity-50">
                <div>
                  <h3 className="text-white font-bold">Apple Music</h3>
                  <p className="text-gray-400 text-sm">Coming soon</p>
                </div>
                <button disabled className="bg-gray-600 text-gray-400 px-4 py-2 rounded-full cursor-not-allowed">
                  Connect
                </button>
              </div>

              {/* Last.fm */}
              <div className="bg-black/30 rounded-xl p-4 flex justify-between items-center opacity-50">
                <div>
                  <h3 className="text-white font-bold">Last.fm</h3>
                  <p className="text-gray-400 text-sm">Coming soon</p>
                </div>
                <button disabled className="bg-gray-600 text-gray-400 px-4 py-2 rounded-full cursor-not-allowed">
                  Connect
                </button>
              </div>
            </div>
          )}

          {/* MUSIC PORTRAIT TAB */}
          {activeTab === 'portrait' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Music Portrait</h2>
              
              {!spotifyUser ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Connect Spotify to see your music portrait</p>
                  <button
                    onClick={() => setActiveTab('services')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition-all"
                  >
                    Go to Services
                  </button>
                </div>
              ) : profileLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-gray-400">Analyzing your music taste...</p>
                </div>
              ) : musicProfile ? (
                <div className="space-y-4">
                  {/* Personality */}
                  <div className="bg-purple-600/20 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Your Music Personality</p>
                    <p className="text-2xl font-bold text-white">
                      {musicProfile.musicPersonality || "Music Explorer"}
                    </p>
                  </div>

                  {/* Genres - БЕЗОПАСНОЕ ОТОБРАЖЕНИЕ */}
                  <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-2">Top Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(musicProfile.topGenres) && musicProfile.topGenres.map((genre: string, i: number) => (
                        <span 
                          key={`genre-${i}`} 
                          className="bg-purple-600/30 text-white px-3 py-1 rounded-full text-sm"
                        >
                          {String(genre)}
                        </span>
                      ))}
                      {(!musicProfile.topGenres || musicProfile.topGenres.length === 0) && (
                        <span className="text-gray-500">No genres data available</span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm">Energy Level</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all"
                            style={{ width: `${musicProfile.energyLevel || 0}%` }}
                          />
                        </div>
                        <p className="text-xl font-bold text-white">
                          {musicProfile.energyLevel || 0}%
                        </p>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm">Diversity Score</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all"
                            style={{ width: `${musicProfile.diversityScore || 0}%` }}
                          />
                        </div>
                        <p className="text-xl font-bold text-white">
                          {musicProfile.diversityScore || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Unable to load music profile</p>
                  <button
                    onClick={() => loadMusicProfile()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STATISTICS TAB */}
          {activeTab === 'stats' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Statistics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-gray-400 text-sm">Parties</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-gray-400 text-sm">Songs Voted</p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-gray-400 text-sm">Top Picks</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">Join parties to see your statistics!</p>
              </div>
            </div>
          )}
        </div>

        {/* BACK BUTTON */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}