"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface UserData {
  worldId: string;
  credentialType: string;
  verified: boolean;
  createdAt: string;
}

interface SpotifyUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface LastFmUser {
  username: string;
  profile?: {
    displayName?: string;
    country?: string;
    followers?: number;
  };
}

interface Track {
  title: string;
  artist: string;
  playCount?: number;
  imageUrl?: string;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [lastfmUser, setLastfmUser] = useState<LastFmUser | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem("user_data");
    if (!storedUserData) {
      router.push("/");
      return;
    }
    setUserData(JSON.parse(storedUserData));

    // Проверяем Spotify
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
        } catch (e) {
          console.error("Error parsing Spotify user:", e);
        }
      }
    }

    // Проверяем Last.fm из параметров URL
    const lastfmStatus = searchParams.get("lastfm");
    const lastfmUsername = searchParams.get("username");
    
    if (lastfmStatus === "connected" && lastfmUsername) {
      // Читаем cookie с данными Last.fm
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };

      const lastfmCookie = getCookie("lastfm_user");
      if (lastfmCookie) {
        try {
          const user = JSON.parse(decodeURIComponent(lastfmCookie));
          setLastfmUser(user);
          localStorage.setItem("lastfm_data", JSON.stringify(user));
          // Загружаем топ треки
          fetchTopTracks();
        } catch (e) {
          console.error("Error parsing Last.fm cookie:", e);
        }
      }
    }

    // Загружаем сохранённые данные
    if (localStorage.getItem("spotify_connected")) {
      const savedSpotifyUser = localStorage.getItem("spotify_user");
      if (savedSpotifyUser) {
        try {
          setSpotifyUser(JSON.parse(savedSpotifyUser));
        } catch (e) {
          console.error("Error loading Spotify user:", e);
        }
      }
    }

    // Загружаем Last.fm из localStorage
    const savedLastfm = localStorage.getItem("lastfm_data");
    if (savedLastfm && !lastfmUser) {
      try {
        const user = JSON.parse(savedLastfm);
        setLastfmUser(user);
        // Загружаем топ треки
        fetchTopTracks();
      } catch (e) {
        console.error("Error loading Last.fm data:", e);
      }
    }

    const error = searchParams.get("error");
    if (error) {
      alert(`Ошибка подключения: ${error}`);
    }
  }, [router, searchParams]);

  const fetchTopTracks = async () => {
    setIsLoadingTracks(true);
    try {
      const response = await fetch('/api/music/lastfm/top-tracks');
      if (response.ok) {
        const data = await response.json();
        setTopTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Error fetching top tracks:', error);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const connectSpotify = () => {
    setIsLoading(true);
    const redirectUri = encodeURIComponent("https://tootfm.world/api/spotify/callback");
    const clientId = "68a7ea6587af43cc893cc0994a584eff";
    const scopes = encodeURIComponent("user-read-private user-read-email user-modify-playback-state user-read-playback-state");
    
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;
  };

  const disconnectSpotify = () => {
    setSpotifyUser(null);
    localStorage.removeItem("spotify_connected");
    localStorage.removeItem("spotify_user");
    document.cookie = "spotify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "spotify_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const connectAppleMusic = () => {
    alert("Apple Music интеграция будет добавлена в следующей версии!");
  };

  const connectLastfm = () => {
    setIsLoading(true);
    // Используем настоящую OAuth авторизацию
    window.location.href = '/api/music/lastfm/connect';
  };

  const disconnectLastfm = () => {
    setLastfmUser(null);
    setTopTracks([]);
    localStorage.removeItem("lastfm_data");
    document.cookie = "lastfm_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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
              <p className="font-mono text-sm">{userData.worldId.slice(0, 20)}...</p>
            </div>
            <div>
              <p className="text-gray-400">Verification Type</p>
              <p className="capitalize">{userData.credentialType || "Orb"}</p>
            </div>
          </div>
        </div>

        {/* Music Services */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🎵 Music Services</h2>
          
          <div className="space-y-4">
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
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-full transition-all"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectSpotify}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full transition-all"
                >
                  {isLoading ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>

            {/* Apple Music */}
            <div className="bg-black/30 rounded-xl p-6 flex items-center justify-between">
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
                onClick={connectAppleMusic}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-full transition-all"
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
                  <p className="text-gray-400 text-sm">
                    {lastfmUser ? `Connected: ${lastfmUser.username}` : "Track your listening history"}
                  </p>
                  {lastfmUser?.profile && (
                    <p className="text-gray-500 text-xs">
                      {lastfmUser.profile.followers} scrobbles • {lastfmUser.profile.country}
                    </p>
                  )}
                </div>
              </div>
              {lastfmUser ? (
                <button
                  onClick={disconnectLastfm}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-full transition-all"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectLastfm}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-all"
                >
                  {isLoading ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top Tracks from Last.fm */}
        {lastfmUser && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🎧 Your Top Tracks (Last.fm)</h2>
            
            {isLoadingTracks ? (
              <div className="text-center py-8">
                <div className="text-white">Loading tracks...</div>
              </div>
            ) : topTracks.length > 0 ? (
              <div className="space-y-3">
                {topTracks.map((track, index) => (
                  <div key={index} className="bg-black/30 rounded-lg p-4 flex items-center gap-4">
                    <div className="text-2xl text-gray-400 w-8 text-center">
                      {index + 1}
                    </div>
                    {track.imageUrl && (
                      <img 
                        src={track.imageUrl} 
                        alt={track.title}
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-semibold">{track.title}</p>
                      <p className="text-gray-400 text-sm">{track.artist}</p>
                    </div>
                    {track.playCount && (
                      <div className="text-gray-500 text-sm">
                        {track.playCount} plays
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No tracks data available yet</p>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="text-center">
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
