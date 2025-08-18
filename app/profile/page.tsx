"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MusicPortrait from "../../components/profile/MusicPortrait";

interface UserData {
  id?: string;
  worldId?: string;
  credentialType?: string;
  verified?: boolean;
  createdAt?: string;
}

interface SpotifyUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'portrait' | 'stats'>('services');
  const [loadingStates, setLoadingStates] = useState({
    spotify: false,
    apple: false,
    lastfm: false
  });

  useEffect(() => {
    // Проверяем localStorage
    const storedUserData = localStorage.getItem("user_data");
    console.log("Stored user data:", storedUserData); // Для отладки
    
    if (!storedUserData) {
      console.log("No user data found, redirecting to home");
      router.push("/");
      return;
    }
    
    try {
      const parsed = JSON.parse(storedUserData);
      console.log("Parsed user data:", parsed); // Для отладки
      
      // ВАЖНО: Убедимся что есть хоть какой-то ID
      if (!parsed.worldId && !parsed.id && !parsed.nullifier_hash) {
        // Если нет никакого ID, создаем временный
        parsed.worldId = "temp_user_" + Date.now();
      } else if (!parsed.worldId) {
        // Используем что есть
        parsed.worldId = parsed.id || parsed.nullifier_hash || "unknown_user";
      }
      
      setUserData(parsed);
    } catch (e) {
      console.error("Error parsing user data:", e);
      router.push("/");
      return;
    }

    // Обработка Spotify callback
    const spotifyStatus = searchParams.get("spotify");
    if (spotifyStatus === "connected") {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };

      const spotifyUserCookie = getCookie("spotify_user");
      if (spotifyUserCookie) {
        try {
          const user = JSON.parse(decodeURIComponent(spotifyUserCookie));
          setSpotifyUser(user);
          localStorage.setItem("spotify_connected", "true");
          localStorage.setItem("spotify_user", JSON.stringify(user));
          setLoadingStates(prev => ({ ...prev, spotify: false }));
        } catch (e) {
          console.error("Error parsing Spotify user:", e);
        }
      }
    }

    // Загружаем сохраненного Spotify пользователя
    const savedSpotifyUser = localStorage.getItem("spotify_user");
    if (savedSpotifyUser && !spotifyUser) {
      try {
        setSpotifyUser(JSON.parse(savedSpotifyUser));
      } catch (e) {
        console.error("Error loading Spotify user:", e);
      }
    }
  }, [router, searchParams]);

  const connectSpotify = () => {
    setLoadingStates(prev => ({ ...prev, spotify: true }));
    window.location.href = '/api/spotify/auth';
  };

  const disconnectSpotify = () => {
    setSpotifyUser(null);
    localStorage.removeItem("spotify_connected");
    localStorage.removeItem("spotify_user");
    document.cookie = "spotify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "spotify_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const connectLastfm = () => {
    setLoadingStates(prev => ({ ...prev, lastfm: true }));
    // Временно показываем сообщение
    setTimeout(() => {
      alert("Last.fm integration coming soon!");
      setLoadingStates(prev => ({ ...prev, lastfm: false }));
    }, 500);
  };

  const connectApple = () => {
    alert("Apple Music integration coming soon!");
  };

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "spotify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "spotify_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  // Показываем загрузку пока нет userData
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Безопасное получение и обрезание worldId
  const getDisplayWorldId = () => {
    const id = userData.worldId || userData.id || "Unknown User";
    // Проверяем что id это строка и имеет метод slice
    if (typeof id === 'string' && id.length > 20) {
      return `${id.slice(0, 20)}...`;
    }
    return id;
  };

  const displayWorldId = userData.worldId || userData.id || "Unknown";
  const shortWorldId = getDisplayWorldId();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-white">My Profile</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-full transition-all"
            >
              Logout
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
            <div>
              <p className="text-gray-400">World ID</p>
              <p className="font-mono text-sm break-all">{shortWorldId}</p>
            </div>
            <div>
              <p className="text-gray-400">Verification Type</p>
              <p className="capitalize">{userData.credentialType || "Orb"}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-3 rounded-full transition-all ${
              activeTab === 'services' 
                ? 'bg-white/20 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/15'
            }`}
          >
            🎵 Services
          </button>
          <button
            onClick={() => setActiveTab('portrait')}
            className={`px-6 py-3 rounded-full transition-all ${
              activeTab === 'portrait' 
                ? 'bg-white/20 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/15'
            }`}
          >
            🎨 Music Portrait
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-full transition-all ${
              activeTab === 'stats' 
                ? 'bg-white/20 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/15'
            }`}
          >
            📊 Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
          {activeTab === 'services' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-6">🎵 Music Services</h2>
              
              {/* Spotify */}
              <div className="bg-black/30 rounded-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Spotify</h3>
                    <p className="text-gray-400 text-sm">
                      {spotifyUser ? `Connected: ${spotifyUser.name || spotifyUser.email}` : "Stream and control music"}
                    </p>
                  </div>
                </div>
                {spotifyUser ? (
                  <button
                    onClick={disconnectSpotify}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-full"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={connectSpotify}
                    disabled={loadingStates.spotify}
                    className={`px-6 py-2 rounded-full transition-all ${
                      loadingStates.spotify 
                        ? "bg-gray-600 text-gray-300 cursor-wait" 
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {loadingStates.spotify ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>

              {/* Apple Music */}
              <div className="bg-black/30 rounded-xl p-6 flex items-center justify-between opacity-75">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Apple Music</h3>
                    <p className="text-gray-400 text-sm">Coming soon</p>
                  </div>
                </div>
                <button
                  onClick={connectApple}
                  className="bg-gray-500 text-white px-6 py-2 rounded-full cursor-not-allowed"
                  disabled
                >
                  Connect
                </button>
              </div>

              {/* Last.fm */}
              <div className="bg-black/30 rounded-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Last.fm</h3>
                    <p className="text-gray-400 text-sm">Track your listening history</p>
                  </div>
                </div>
                <button
                  onClick={connectLastfm}
                  disabled={loadingStates.lastfm}
                  className={`px-6 py-2 rounded-full transition-all ${
                    loadingStates.lastfm 
                      ? "bg-gray-600 text-gray-300 cursor-wait" 
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {loadingStates.lastfm ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'portrait' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">🎨 Music Portrait</h2>
              {spotifyUser ? (
                <MusicPortrait userId={displayWorldId} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Connect Spotify to see your music portrait</p>
                  <button
                    onClick={() => setActiveTab('services')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full"
                  >
                    Go to Services
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">📊 Statistics</h2>
              <div className="text-center py-8">
                <p className="text-gray-400">Detailed statistics coming soon...</p>
                <p className="text-gray-500 text-sm mt-2">Track your party history, voting patterns, and more!</p>
              </div>
            </div>
          )}
        </div>

        {/* Back Button */}
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
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}