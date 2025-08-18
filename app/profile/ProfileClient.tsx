"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<Record<string, any> | null>(null);
  const [lastfmUser, setLastfmUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [musicProfile, setMusicProfile] = useState<Record<string, any> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [lastfmData, setLastfmData] = useState<Record<string, any> | null>(null);
  const [connectingServices, setConnectingServices] = useState({
    spotify: false,
    lastfm: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Загружаем данные пользователя из localStorage
      const stored = localStorage.getItem("user_data");
      
      if (!stored) {
        router.push("/");
        return;
      }

      const data = JSON.parse(stored);
      console.log("User data loaded:", data);
      setUserData(data);

      // Проверяем Spotify
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

      // Проверяем Last.fm из localStorage
      const lastfmStored = localStorage.getItem("lastfm_user");
      if (lastfmStored) {
        setLastfmUser(lastfmStored);
        loadLastfmData();
      }

      // Обработка Spotify callback
      if (searchParams?.get("spotify") === "connected") {
        handleSpotifyCallback();
      }

      // Обработка Last.fm callback
      const lastfmStatus = searchParams?.get("lastfm");
      const lastfmUsername = searchParams?.get("username");
      
      if (lastfmStatus === "connected") {
        handleLastfmCallback();
      } else if (searchParams?.get("error") === "lastfm_failed") {
        alert("Failed to connect Last.fm. Please try again.");
        setConnectingServices(prev => ({ ...prev, lastfm: false }));
      }

    } catch (error) {
      console.error("Error loading data:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [searchParams, router]);

  const handleSpotifyCallback = () => {
    try {
      const cookies = document.cookie.split(';');
      const spotifyCookie = cookies.find(c => c.trim().startsWith('spotify_user='));
      
      if (spotifyCookie) {
        const userData = decodeURIComponent(spotifyCookie.split('=')[1]);
        const user = JSON.parse(userData);
        setSpotifyUser(user);
        localStorage.setItem("spotify_user", JSON.stringify(user));
        localStorage.setItem("spotify_connected", "true");
        setConnectingServices(prev => ({ ...prev, spotify: false }));
        
        // Загружаем профиль после подключения Spotify
        if (userData) {
          loadMusicProfile(userData);
        }
      }
    } catch (error) {
      console.error("Error handling Spotify callback:", error);
      setConnectingServices(prev => ({ ...prev, spotify: false }));
    }
  };

  const handleLastfmCallback = () => {
    try {
      console.log("Handling Last.fm callback...");
      
      // Сначала проверяем URL параметры
      const username = searchParams?.get("username");
      
      if (username) {
        console.log("Last.fm username from URL:", username);
        setLastfmUser(username);
        localStorage.setItem("lastfm_user", username);
        localStorage.setItem("lastfm_connected", "true");
        setConnectingServices(prev => ({ ...prev, lastfm: false }));
        
        // Загружаем данные Last.fm
        loadLastfmData();
        
        // Показываем уведомление об успехе
        console.log("Last.fm connected successfully:", username);
        return;
      }
      
      // Если нет username в URL, проверяем куки
      const cookies = document.cookie.split(';');
      const lastfmUserCookie = cookies.find(c => c.trim().startsWith('lastfm_user='));
      
      if (lastfmUserCookie) {
        try {
          const cookieValue = decodeURIComponent(lastfmUserCookie.split('=')[1]);
          const cookieData = JSON.parse(cookieValue);
          
          if (cookieData.username) {
            console.log("Last.fm username from cookie:", cookieData.username);
            setLastfmUser(cookieData.username);
            localStorage.setItem("lastfm_user", cookieData.username);
            localStorage.setItem("lastfm_connected", "true");
            
            // Сохраняем дополнительные данные если есть
            if (cookieData.profile) {
              localStorage.setItem("lastfm_profile", JSON.stringify(cookieData.profile));
            }
            
            setConnectingServices(prev => ({ ...prev, lastfm: false }));
            loadLastfmData();
          }
        } catch (e) {
          console.error("Error parsing Last.fm cookie:", e);
        }
      }
    } catch (error) {
      console.error("Error handling Last.fm callback:", error);
      setConnectingServices(prev => ({ ...prev, lastfm: false }));
    }
  };

  const connectSpotify = () => {
    setConnectingServices(prev => ({ ...prev, spotify: true }));
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

  const connectLastfm = () => {
    setConnectingServices(prev => ({ ...prev, lastfm: true }));
    // Используем существующий роут connect вместо auth
    window.location.href = '/api/music/lastfm/connect';
  };

  const disconnectLastfm = () => {
    setLastfmUser(null);
    setLastfmData(null);
    localStorage.removeItem("lastfm_user");
    localStorage.removeItem("lastfm_connected");
    localStorage.removeItem("lastfm_profile");
    document.cookie = "lastfm_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "lastfm_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setConnectingServices(prev => ({ ...prev, lastfm: false }));
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
          topGenres: normalizeGenres(result.profile?.topGenres || []),
          topTracks: result.profile?.topTracks || [],
          topArtists: result.profile?.topArtists || [],
          stats: result.profile?.stats || {}
        };
        
        setMusicProfile(normalizedProfile);
      } else {
        // Fallback данные
        setMusicProfile({
          topGenres: ["Pop", "Rock", "Electronic", "Hip-Hop", "Jazz"],
          musicPersonality: "Eclectic Explorer",
          energyLevel: 75,
          diversityScore: 85,
          topTracks: [],
          topArtists: [],
          stats: {}
        });
      }
    } catch (error) {
      console.error("Error loading music profile:", error);
      setMusicProfile({
        topGenres: ["Pop", "Rock", "Electronic"],
        musicPersonality: "Music Lover",
        energyLevel: 70,
        diversityScore: 80,
        topTracks: [],
        topArtists: [],
        stats: {}
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const loadLastfmData = async () => {
    try {
      console.log("Loading Last.fm data...");
      
      // Сначала пробуем получить топ треки
      const response = await fetch('/api/music/lastfm/top-tracks');
      
      if (response.ok) {
        const data = await response.json();
        console.log("Last.fm tracks received:", data);
        setLastfmData(data);
        
        // Если есть треки, обновляем музыкальный профиль
        if (data.tracks && data.tracks.length > 0) {
          // Можно объединить с существующим профилем
          updateProfileWithLastfmData(data);
        }
      } else {
        console.error("Failed to load Last.fm data:", response.status);
      }
    } catch (error) {
      console.error("Error loading Last.fm data:", error);
    }
  };

  const updateProfileWithLastfmData = (lastfmData: any) => {
    if (!musicProfile) return;
    
    // Объединяем данные из Last.fm с существующим профилем
    setMusicProfile(prev => ({
      ...prev,
      lastfmTracks: lastfmData.tracks,
      // Можно добавить больше данных по мере необходимости
    }));
  };

  // Функция для нормализации жанров
  const normalizeGenres = (genres: any[]): string[] => {
    if (!Array.isArray(genres)) return [];
    
    return genres.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item.genre || item.name || String(item);
      }
      if (typeof item === 'string') {
        return item;
      }
      return String(item);
    }).filter(Boolean).slice(0, 10);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
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
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-full transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-2 rounded-full transition-all ${
              activeTab === 'services' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => {
              setActiveTab('portrait');
              if (!musicProfile && (spotifyUser || lastfmUser) && !profileLoading) {
                loadMusicProfile();
              }
            }}
            className={`px-6 py-2 rounded-full transition-all ${
              activeTab === 'portrait' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Music Portrait
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2 rounded-full transition-all ${
              activeTab === 'stats' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
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
              <div className="bg-gradient-to-r from-green-900/30 to-green-700/30 rounded-xl p-4 border border-green-500/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">
                      🎵
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Spotify</h3>
                      <p className="text-gray-400 text-sm">
                        {spotifyUser ? 
                          `Connected: ${spotifyUser.email || spotifyUser.id || 'Active'}` : 
                          'Stream and analyze your music'
                        }
                      </p>
                    </div>
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
                      disabled={connectingServices.spotify}
                      className={`${
                        connectingServices.spotify 
                          ? 'bg-gray-600 text-gray-300 cursor-wait' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      } px-4 py-2 rounded-full transition-all font-medium`}
                    >
                      {connectingServices.spotify ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>

              {/* Last.fm */}
              <div className="bg-gradient-to-r from-red-900/30 to-red-700/30 rounded-xl p-4 border border-red-500/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-2xl">
                      📊
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Last.fm</h3>
                      <p className="text-gray-400 text-sm">
                        {lastfmUser ? 
                          `Connected: ${lastfmUser}` : 
                          'Track your complete listening history'
                        }
                      </p>
                    </div>
                  </div>
                  {lastfmUser ? (
                    <button
                      onClick={disconnectLastfm}
                      className="bg-red-500/30 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-full transition-all"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={connectLastfm}
                      disabled={connectingServices.lastfm}
                      className={`${
                        connectingServices.lastfm 
                          ? 'bg-gray-600 text-gray-300 cursor-wait' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      } px-4 py-2 rounded-full transition-all font-medium`}
                    >
                      {connectingServices.lastfm ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>

              {/* Apple Music */}
              <div className="bg-gradient-to-r from-pink-900/30 to-pink-700/30 rounded-xl p-4 border border-pink-500/20 opacity-60">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-2xl">
                      🎵
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Apple Music</h3>
                      <p className="text-gray-400 text-sm">Coming soon</p>
                    </div>
                  </div>
                  <button 
                    disabled 
                    className="bg-gray-600 text-gray-400 px-4 py-2 rounded-full cursor-not-allowed"
                  >
                    Connect
                  </button>
                </div>
              </div>

              {/* YouTube Music */}
              <div className="bg-gradient-to-r from-orange-900/30 to-orange-700/30 rounded-xl p-4 border border-orange-500/20 opacity-60">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-2xl">
                      📺
                    </div>
                    <div>
                      <h3 className="text-white font-bold">YouTube Music</h3>
                      <p className="text-gray-400 text-sm">Coming soon</p>
                    </div>
                  </div>
                  <button 
                    disabled 
                    className="bg-gray-600 text-gray-400 px-4 py-2 rounded-full cursor-not-allowed"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MUSIC PORTRAIT TAB */}
          {activeTab === 'portrait' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Music Portrait</h2>
              
              {!spotifyUser && !lastfmUser ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🎵</div>
                  <p className="text-gray-400 mb-4">Connect a music service to see your portrait</p>
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
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-gray-400 text-sm mb-1">Your Music Personality</p>
                    <p className="text-2xl font-bold text-white">
                      {musicProfile.musicPersonality || "Music Explorer"}
                    </p>
                  </div>

                  {/* Top Genres */}
                  <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-3">Top Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(musicProfile.topGenres) && musicProfile.topGenres.length > 0 ? (
                        musicProfile.topGenres.map((genre: string, i: number) => (
                          <span 
                            key={`genre-${i}`} 
                            className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30"
                          >
                            {String(genre)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">No genre data available</span>
                      )}
                    </div>
                  </div>

                  {/* Spotify Top Tracks */}
                  {musicProfile.topTracks && musicProfile.topTracks.length > 0 && (
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-3">Recent Favorites (Spotify)</p>
                      <div className="space-y-2">
                        {musicProfile.topTracks.slice(0, 3).map((track: any, i: number) => (
                          <div key={`track-${i}`} className="flex items-center gap-3">
                            {track.image && (
                              <img src={track.image} alt={track.name} className="w-10 h-10 rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{track.name}</p>
                              <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last.fm Recent Tracks */}
                  {lastfmData?.tracks && lastfmData.tracks.length > 0 && (
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-3">Recent Plays (Last.fm)</p>
                      <div className="space-y-2">
                        {lastfmData.tracks.slice(0, 3).map((track: any, i: number) => (
                          <div key={`lastfm-track-${i}`} className="flex items-center gap-3">
                            {track.imageUrl && (
                              <img src={track.imageUrl} alt={track.title} className="w-10 h-10 rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{track.title}</p>
                              <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                              {track.playCount > 1 && (
                                <p className="text-gray-500 text-xs">{track.playCount} plays</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Artists */}
                  {musicProfile.topArtists && musicProfile.topArtists.length > 0 && (
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-3">Top Artists</p>
                      <div className="flex flex-wrap gap-2">
                        {musicProfile.topArtists.slice(0, 5).map((artist: any, i: number) => (
                          <span 
                            key={`artist-${i}`}
                            className="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30"
                          >
                            {artist.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-2">Energy Level</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 transition-all duration-500"
                            style={{ width: `${musicProfile.energyLevel || 0}%` }}
                          />
                        </div>
                        <span className="text-white font-bold text-sm">
                          {musicProfile.energyLevel || 0}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-2">Diversity Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 transition-all duration-500"
                            style={{ width: `${musicProfile.diversityScore || 0}%` }}
                          />
                        </div>
                        <span className="text-white font-bold text-sm">
                          {musicProfile.diversityScore || 0}%
                        </span>
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
              
              {/* Connected Services Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-2">Connected Services</p>
                  <p className="text-3xl font-bold text-white">
                    {(spotifyUser ? 1 : 0) + (lastfmUser ? 1 : 0)}
                  </p>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-2">Active Sources</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {spotifyUser && (
                      <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-xs">Spotify</span>
                    )}
                    {lastfmUser && (
                      <span className="bg-red-600/20 text-red-300 px-2 py-1 rounded text-xs">Last.fm</span>
                    )}
                    {!spotifyUser && !lastfmUser && (
                      <span className="text-gray-500 text-xs">None connected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Last.fm specific stats */}
              {lastfmData && (
                <div className="bg-black/30 rounded-xl p-4 mb-6">
                  <p className="text-gray-400 text-sm mb-2">Last.fm Activity</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xl font-bold text-white">
                        {lastfmData.tracks?.length || 0}
                      </p>
                      <p className="text-gray-500 text-xs">Recent tracks</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">
                        {lastfmUser || 'N/A'}
                      </p>
                      <p className="text-gray-500 text-xs">Username</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Party Stats */}
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
                <p className="text-gray-500 text-sm">Join parties to see your voting statistics!</p>
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