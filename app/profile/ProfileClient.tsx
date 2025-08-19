"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppleMusicConnect from "@/components/music-services/AppleMusicConnect";

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<Record<string, any> | null>(null);
  const [lastfmUser, setLastfmUser] = useState<string | null>(null);
  const [appleMusicConnected, setAppleMusicConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [musicProfile, setMusicProfile] = useState<Record<string, any> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [lastfmData, setLastfmData] = useState<Record<string, any> | null>(null);
  const [connectingServices, setConnectingServices] = useState({
    spotify: false,
    lastfm: false,
    appleMusic: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem("user_data");
      
      if (!stored) {
        router.push("/");
        return;
      }

      const data = JSON.parse(stored);
      console.log("User data loaded:", data);
      setUserData(data);

      const spotifyStored = localStorage.getItem("spotify_user");
      if (spotifyStored) {
        try {
          const spotifyData = JSON.parse(spotifyStored);
          setSpotifyUser(spotifyData);
        } catch (e) {
          console.error("Error parsing Spotify data:", e);
        }
      }

      const lastfmStored = localStorage.getItem("lastfm_user");
      if (lastfmStored) {
        setLastfmUser(lastfmStored);
      }

      const appleToken = localStorage.getItem("apple_music_token");
      if (appleToken) {
        setAppleMusicConnected(true);
      }

      if (searchParams?.get("spotify") === "connected") {
        handleSpotifyCallback();
      }
      
      if (searchParams?.get("lastfm") === "connected") {
        handleLastfmCallback();
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
      }
    } catch (error) {
      console.error("Error handling Spotify callback:", error);
      setConnectingServices(prev => ({ ...prev, spotify: false }));
    }
  };

  const handleLastfmCallback = () => {
    try {
      const username = searchParams?.get("username");
      
      if (username) {
        console.log("Last.fm username from URL:", username);
        setLastfmUser(username);
        localStorage.setItem("lastfm_user", username);
        localStorage.setItem("lastfm_connected", "true");
        setConnectingServices(prev => ({ ...prev, lastfm: false }));
        return;
      }
      
      const cookies = document.cookie.split(';');
      const lastfmUserCookie = cookies.find(c => c.trim().startsWith('lastfm_user='));
      
      if (lastfmUserCookie) {
        try {
          const cookieValue = decodeURIComponent(lastfmUserCookie.split('=')[1]);
          const cookieData = JSON.parse(cookieValue);
          
          if (cookieData.username) {
            setLastfmUser(cookieData.username);
            localStorage.setItem("lastfm_user", cookieData.username);
            localStorage.setItem("lastfm_connected", "true");
            setConnectingServices(prev => ({ ...prev, lastfm: false }));
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

      // IMPORTANT: Include Apple Music data
      const requestBody: any = { userId };

      const appleLibrary = localStorage.getItem('apple_music_library');
      if (appleLibrary) {
        try {
          requestBody.appleLibrary = JSON.parse(appleLibrary);
          console.log("Including Apple Music data in analysis");
        } catch (e) {
          console.error("Error parsing Apple Music library:", e);
        }
      }

      const response = await fetch('/api/music/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Music profile received:", result);
        
        const normalizedProfile = {
          musicPersonality: result.profile?.musicPersonality || "Music Explorer",
          energyLevel: result.profile?.energyLevel || 70,
          diversityScore: result.profile?.diversityScore || 80,
          topGenres: normalizeGenres(result.profile?.topGenres || []),
          topTracks: result.profile?.topTracks || [],
          topArtists: result.profile?.topArtists || [],
          totalTracks: result.profile?.totalTracks || 0,
          totalArtists: result.profile?.totalArtists || 0,
          totalGenres: result.profile?.totalGenres || 0,
          sources: result.profile?.sources || []
        };
        
        setMusicProfile(normalizedProfile);
        
        localStorage.setItem('musicProfile', JSON.stringify(normalizedProfile));
        localStorage.setItem('musicProfileTimestamp', Date.now().toString());
      } else {
        setMusicProfile({
          topGenres: ["Pop", "Rock", "Electronic", "Hip-Hop", "Jazz"],
          musicPersonality: "Eclectic Explorer",
          energyLevel: 75,
          diversityScore: 85,
          topTracks: [],
          topArtists: [],
          totalTracks: 0,
          totalArtists: 0,
          totalGenres: 0,
          sources: []
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
        totalTracks: 0,
        totalArtists: 0,
        totalGenres: 0,
        sources: []
      });
    } finally {
      setProfileLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black">
      <div className="max-w-4xl mx-auto p-6">
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
              if (!musicProfile && (spotifyUser || lastfmUser || appleMusicConnected) && !profileLoading) {
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

        <div className="bg-white/10 backdrop-blur rounded-3xl p-6">
          {activeTab === 'services' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">Music Services</h2>
              
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

              <AppleMusicConnect 
                onConnectionChange={(connected) => {
                  setAppleMusicConnected(connected);
                  setConnectingServices(prev => ({ ...prev, appleMusic: false }));
                  if (connected) {
                    localStorage.removeItem('musicProfile');
                    localStorage.removeItem('musicProfileTimestamp');
                  }
                }}
              />

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

          {activeTab === 'portrait' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Music Portrait</h2>
              
              {!spotifyUser && !lastfmUser && !appleMusicConnected ? (
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
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-gray-400 text-sm mb-1">Your Music Personality</p>
                    <p className="text-2xl font-bold text-white">
                      {musicProfile.musicPersonality || "Music Explorer"}
                    </p>
                    {musicProfile.sources && musicProfile.sources.length > 0 && (
                      <p className="text-gray-500 text-xs mt-2">
                        Data from: {musicProfile.sources.join(', ')}
                      </p>
                    )}
                  </div>

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

                  {musicProfile.topTracks && musicProfile.topTracks.length > 0 && (
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-3">Recent Favorites</p>
                      <div className="space-y-2">
                        {musicProfile.topTracks.slice(0, 5).map((track: any, i: number) => (
                          <div key={`track-${i}`} className="flex items-center gap-3">
                            <span className="text-purple-400 text-sm w-4">{i+1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{track.name}</p>
                              <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                            </div>
                            {track.source && (
                              <span className="text-gray-600 text-xs">{track.source}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/30 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-purple-400">
                        {musicProfile.totalTracks || 0}
                      </p>
                      <p className="text-gray-400 text-xs">Tracks</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-pink-400">
                        {musicProfile.totalArtists || 0}
                      </p>
                      <p className="text-gray-400 text-xs">Artists</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-blue-400">
                        {musicProfile.totalGenres || 0}
                      </p>
                      <p className="text-gray-400 text-xs">Genres</p>
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

          {activeTab === 'stats' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Statistics</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-2">Connected Services</p>
                  <p className="text-3xl font-bold text-white">
                    {(spotifyUser ? 1 : 0) + (lastfmUser ? 1 : 0) + (appleMusicConnected ? 1 : 0)}
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
                    {appleMusicConnected && (
                      <span className="bg-gray-600/20 text-gray-300 px-2 py-1 rounded text-xs">Apple Music</span>
                    )}
                    {!spotifyUser && !lastfmUser && !appleMusicConnected && (
                      <span className="text-gray-500 text-xs">None connected</span>
                    )}
                  </div>
                </div>
              </div>

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