"use client";

import { useEffect, useState } from "react";
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

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [lastfmUsername, setLastfmUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem("user_data");
    if (!storedUserData) {
      router.push("/");
      return;
    }
    setUserData(JSON.parse(storedUserData));

    // Проверяем статус подключения Spotify из URL
    const spotifyStatus = searchParams.get("spotify");
    if (spotifyStatus === "connected") {
      // Получаем данные Spotify из cookies
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
        } catch (e) {
          console.error("Error parsing Spotify user:", e);
        }
      }
    }

    // Проверяем сохранённые данные
    if (localStorage.getItem("spotify_connected")) {
      const savedSpotifyUser = localStorage.getItem("spotify_user");
      if (savedSpotifyUser) {
        setSpotifyUser(JSON.parse(savedSpotifyUser));
      }
    }

    const savedLastfm = localStorage.getItem("lastfm_username");
    if (savedLastfm) setLastfmUsername(savedLastfm);

    // Проверяем ошибки
    const error = searchParams.get("error");
    if (error) {
      alert(`Ошибка подключения Spotify: ${error}`);
    }
  }, [router, searchParams]);

  const connectSpotify = () => {
    setIsLoading(true);
    const clientId = "d030154634934d92a7dc08ad9770f80f";
    const redirectUri = encodeURIComponent(`https://tootfm.world/api/spotify/callback`);
    const scopes = encodeURIComponent("user-read-private user-read-email user-modify-playback-state user-read-playback-state");
    
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;
  };

  const disconnectSpotify = () => {
    setSpotifyUser(null);
    localStorage.removeItem("spotify_connected");
    localStorage.removeItem("spotify_user");
    document.cookie = "spotify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "spotify_refresh=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "spotify_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const connectAppleMusic = () => {
    alert("Apple Music интеграция будет добавлена в следующей версии!");
  };

  const connectLastfm = () => {
    const username = prompt("Введите ваш Last.fm username:");
    if (username) {
      setLastfmUsername(username);
      localStorage.setItem("lastfm_username", username);
      alert(`Last.fm подключен: ${username}`);
    }
  };

  const disconnectLastfm = () => {
    setLastfmUsername("");
    localStorage.removeItem("lastfm_username");
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
              <p className="capitalize">{userData.credentialType || "Phone"}</p>
            </div>
          </div>
        </div>

        {/* Music Services */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
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
                    {lastfmUsername ? `Connected: ${lastfmUsername}` : "Track your listening history"}
                  </p>
                </div>
              </div>
              {lastfmUsername ? (
                <button
                  onClick={disconnectLastfm}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-full transition-all"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectLastfm}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-all"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
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
