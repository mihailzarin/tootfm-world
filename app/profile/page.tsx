"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [spotifyUser, setSpotifyUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [musicProfile, setMusicProfile] = useState<any>(null);

  useEffect(() => {
    // Загружаем данные пользователя
    try {
      const stored = localStorage.getItem("user_data");
      console.log("Raw stored data:", stored);
      
      if (!stored) {
        router.push("/");
        return;
      }

      const data = JSON.parse(stored);
      console.log("Parsed user data:", data);
      setUserData(data);

      // Проверяем Spotify
      const spotifyStored = localStorage.getItem("spotify_user");
      if (spotifyStored) {
        setSpotifyUser(JSON.parse(spotifyStored));
      }

      // Проверяем callback от Spotify
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
      // Получаем куки
      const cookies = document.cookie.split(';');
      const spotifyCookie = cookies.find(c => c.trim().startsWith('spotify_user='));
      
      if (spotifyCookie) {
        const userData = decodeURIComponent(spotifyCookie.split('=')[1]);
        const user = JSON.parse(userData);
        setSpotifyUser(user);
        localStorage.setItem("spotify_user", JSON.stringify(user));
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
    localStorage.removeItem("spotify_user");
    localStorage.removeItem("spotify_connected");
    // Очищаем куки
    document.cookie = "spotify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "spotify_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const loadMusicProfile = async () => {
    if (!userData) return;
    
    try {
      // Получаем ID пользователя - пробуем все возможные варианты
      const userId = userData.nullifier_hash || 
                     userData.worldId || 
                     userData.id || 
                     userData.user_id ||
                     "demo_user";

      const response = await fetch('/api/music/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        setMusicProfile(data.profile);
      } else {
        // Используем демо данные
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
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push("/");
  };

  // Показываем загрузку
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Если нет данных пользователя
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">No user data. Redirecting...</div>
      </div>
    );
  }

  // Безопасно получаем ID для отображения
  const getUserId = () => {
    const id = userData?.nullifier_hash || 
               userData?.worldId || 
               userData?.id || 
               userData?.user_id ||
               "User";
    
    // Безопасное обрезание
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
            className={`px-6 py-2 rounded-full ${
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
              if (!musicProfile && spotifyUser) loadMusicProfile();
            }}
            className={`px-6 py-2 rounded-full ${
              activeTab === 'portrait' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-300'
            }`}
          >
            Music Portrait
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2 rounded-full ${
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
                    {spotifyUser ? `Connected: ${spotifyUser.email || spotifyUser.id}` : 'Not connected'}
                  </p>
                </div>
                {spotifyUser ? (
                  <button
                    onClick={disconnectSpotify}
                    className="bg-red-500/30 text-red-300 px-4 py-2 rounded-full"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={connectSpotify}
                    className="bg-green-500 text-white px-4 py-2 rounded-full"
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
                    className="bg-purple-600 text-white px-6 py-2 rounded-full"
                  >
                    Go to Services
                  </button>
                </div>
              ) : musicProfile ? (
                <div className="space-y-4">
                  {/* Personality */}
                  <div className="bg-purple-600/20 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Your Music Personality</p>
                    <p className="text-2xl font-bold text-white">{musicProfile.musicPersonality}</p>
                  </div>

                  {/* Genres */}
                  <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-2">Top Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {musicProfile.topGenres?.map((genre: string, i: number) => (
                        <span key={i} className="bg-purple-600/30 text-white px-3 py-1 rounded-full text-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm">Energy Level</p>
                      <p className="text-xl font-bold text-white">{musicProfile.energyLevel}%</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm">Diversity Score</p>
                      <p className="text-xl font-bold text-white">{musicProfile.diversityScore}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading music profile...</p>
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
            </div>
          )}
        </div>

        {/* BACK BUTTON */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="bg-white/20 text-white px-6 py-2 rounded-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}