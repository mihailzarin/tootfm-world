"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Music, Spotify, Radio, Apple, User, Settings, Plus } from "lucide-react";
import Link from "next/link";

interface MusicProfile {
  musicPersonality: string;
  dominantGenres: string[];
  energyLevel: number;
  diversityScore: number;
  mainstreamScore: number;
  unifiedTopTracks: any[];
  unifiedTopArtists: any[];
}

interface MusicService {
  service: 'SPOTIFY' | 'LASTFM' | 'APPLE';
  isActive: boolean;
  lastSynced?: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, requireAuth } = useAuth();
  const [musicProfile, setMusicProfile] = useState<MusicProfile | null>(null);
  const [services, setServices] = useState<MusicService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (requireAuth()) {
      loadProfileData();
    }
  }, [isAuthenticated]);

  const loadProfileData = async () => {
    try {
      const [profileRes, servicesRes] = await Promise.all([
        fetch('/api/profile/music'),
        fetch('/api/profile/services')
      ]);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setMusicProfile(profile);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectService = async (service: string) => {
    try {
      const response = await fetch(`/api/auth/${service.toLowerCase()}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error(`Failed to connect ${service}:`, error);
    }
  };

  const generateMusicProfile = async () => {
    try {
      const response = await fetch('/api/profile/generate', {
        method: 'POST'
      });
      
      if (response.ok) {
        const profile = await response.json();
        setMusicProfile(profile);
      }
    } catch (error) {
      console.error('Failed to generate music profile:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-8 mb-8 border border-purple-500/20">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
              {user?.image ? (
                <img src={user.image} alt={user.name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{user?.name}</h1>
              <p className="text-gray-300">{user?.email}</p>
              <div className="flex gap-2 mt-3">
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                  Google OAuth
                </span>
                {musicProfile && (
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                    Music Profile Ready
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Music Services */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Spotify */}
          <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-2xl p-6 border border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Spotify className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold text-white">Spotify</h3>
            </div>
            {services.find(s => s.service === 'SPOTIFY')?.isActive ? (
              <div className="space-y-2">
                <p className="text-green-400 text-sm">✓ Connected</p>
                <p className="text-gray-300 text-sm">
                  Last synced: {services.find(s => s.service === 'SPOTIFY')?.lastSynced || 'Never'}
                </p>
              </div>
            ) : (
              <button
                onClick={() => connectService('spotify')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
              >
                Connect Spotify
              </button>
            )}
          </div>

          {/* Last.fm */}
          <div className="bg-gradient-to-br from-red-900/50 to-pink-900/50 rounded-2xl p-6 border border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Radio className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-white">Last.fm</h3>
            </div>
            {services.find(s => s.service === 'LASTFM')?.isActive ? (
              <div className="space-y-2">
                <p className="text-red-400 text-sm">✓ Connected</p>
                <p className="text-gray-300 text-sm">
                  Last synced: {services.find(s => s.service === 'LASTFM')?.lastSynced || 'Never'}
                </p>
              </div>
            ) : (
              <button
                onClick={() => connectService('lastfm')}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition"
              >
                Connect Last.fm
              </button>
            )}
          </div>

          {/* Apple Music */}
          <div className="bg-gradient-to-br from-pink-900/50 to-rose-900/50 rounded-2xl p-6 border border-pink-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Apple className="w-6 h-6 text-pink-400" />
              <h3 className="text-xl font-bold text-white">Apple Music</h3>
            </div>
            {services.find(s => s.service === 'APPLE')?.isActive ? (
              <div className="space-y-2">
                <p className="text-pink-400 text-sm">✓ Connected</p>
                <p className="text-gray-300 text-sm">
                  Last synced: {services.find(s => s.service === 'APPLE')?.lastSynced || 'Never'}
                </p>
              </div>
            ) : (
              <button
                onClick={() => connectService('apple')}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition"
              >
                Connect Apple Music
              </button>
            )}
          </div>
        </div>

        {/* Music Profile */}
        {musicProfile ? (
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <Music className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Your Music DNA 🧬</h2>
            </div>

            {/* Personality Card */}
            <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 rounded-xl p-6 mb-6 border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-4">{musicProfile.musicPersonality}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">{musicProfile.energyLevel}%</div>
                  <div className="text-gray-300 text-sm">Energy Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{musicProfile.diversityScore}%</div>
                  <div className="text-gray-300 text-sm">Diversity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">{musicProfile.mainstreamScore}%</div>
                  <div className="text-gray-300 text-sm">Mainstream</div>
                </div>
              </div>
            </div>

            {/* Top Genres */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Top Genres</h3>
              <div className="flex flex-wrap gap-2">
                {musicProfile.dominantGenres.map((genre, index) => (
                  <span
                    key={genre}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Top Tracks */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">United Top Tracks</h3>
              <div className="space-y-2">
                {musicProfile.unifiedTopTracks.slice(0, 10).map((track, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400 text-sm w-8">{index + 1}</span>
                    <div className="flex-1">
                      <div className="text-white font-medium">{track.name}</div>
                      <div className="text-gray-300 text-sm">{track.artist}</div>
                    </div>
                    <div className="flex gap-1">
                      {track.sources?.map((source: string) => (
                        <span key={source} className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/20 text-center">
            <Music className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Create Your Music Profile</h2>
            <p className="text-gray-300 mb-6">
              Connect your music services to generate a unified profile that represents your unique taste.
            </p>
            <button
              onClick={generateMusicProfile}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Generate Music Profile
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/party/create"
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-6 rounded-lg font-semibold text-center transition"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Create Party
          </Link>
          <Link
            href="/my-parties"
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-lg font-semibold text-center transition"
          >
            My Parties
          </Link>
        </div>
      </div>
    </div>
  );
}