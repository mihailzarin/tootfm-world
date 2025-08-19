// components/party/SmartPlaylist.tsx
// Component for displaying generated playlist with explanations

'use client';

import { useState, useEffect } from 'react';
import { Music, Users, Sparkles, TrendingUp, Heart, Info, RefreshCw, Play, Loader2 } from 'lucide-react';

interface PlaylistTrack {
  id: string;
  spotifyId: string;
  name: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration: number;
  voteCount: number;
  matchScore?: number;
  reasons?: string[];
  matchedUsers?: string[];
}

interface PlaylistStats {
  totalTracks: number;
  commonArtists: number;
  commonGenres: number;
  averageMatchScore: number;
}

interface SmartPlaylistProps {
  partyCode: string;
  memberCount: number;
}

export default function SmartPlaylist({ partyCode, memberCount }: SmartPlaylistProps) {
  const [playlist, setPlaylist] = useState<PlaylistTrack[]>([]);
  const [stats, setStats] = useState<PlaylistStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<{ [key: string]: boolean }>({});

  // Load existing playlist on mount
  useEffect(() => {
    loadPlaylist();
  }, [partyCode]);

  const loadPlaylist = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to load existing tracks
      const response = await fetch(`/api/party/${partyCode}`);
      const data = await response.json();

      if (data.success && data.party?.tracks) {
        setPlaylist(data.party.tracks);
      }
    } catch (err) {
      console.error('Error loading playlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePlaylist = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🎵 Generating smart playlist...');
      
      const response = await fetch(`/api/party/${partyCode}/generate-playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setPlaylist(data.playlist || []);
        setStats(data.stats || null);
        
        if (data.playlist?.length > 0) {
          console.log(`✅ Generated ${data.playlist.length} tracks`);
        }
      } else {
        setError(data.error || 'Failed to generate playlist');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate playlist. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getMatchColor = (score?: number): string => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMatchEmoji = (score?: number): string => {
    if (!score) return '🎵';
    if (score >= 80) return '🔥';
    if (score >= 60) return '✨';
    if (score >= 40) return '🎯';
    return '🎲';
  };

  const toggleInfo = (trackId: string) => {
    setShowInfo(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  // If playlist is empty and not loading
  if (!isLoading && playlist.length === 0 && !isGenerating) {
    return (
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 text-center">
        <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          Smart Playlist Ready!
        </h3>
        <p className="text-gray-400 mb-6">
          Analyze music tastes of {memberCount} members to create the perfect playlist
        </p>
        <button
          onClick={generatePlaylist}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin" />
              Analyzing tastes...
            </>
          ) : (
            <>
              <Sparkles className="inline-block h-4 w-4 mr-2" />
              Generate Smart Playlist
            </>
          )}
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mr-3" />
          <span className="text-gray-400">Loading playlist...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and stats */}
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-400" />
              Smart Playlist
            </h3>
            <p className="text-gray-400 mt-1">
              Generated based on members' music tastes
            </p>
          </div>
          <button
            onClick={generatePlaylist}
            disabled={isGenerating}
            className="text-gray-400 hover:text-white transition-colors"
            title="Refresh playlist"
          >
            <RefreshCw className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.totalTracks}</div>
              <div className="text-xs text-gray-400">Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">{stats.commonArtists}</div>
              <div className="text-xs text-gray-400">Common Artists</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.commonGenres}</div>
              <div className="text-xs text-gray-400">Common Genres</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.averageMatchScore}%</div>
              <div className="text-xs text-gray-400">Match Score</div>
            </div>
          </div>
        )}
      </div>

      {/* Track list */}
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6">
        <div className="space-y-2">
          {playlist.map((track, index) => (
            <div
              key={track.id}
              className="group relative bg-black/20 hover:bg-black/40 rounded-xl p-4 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Number and emoji */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-mono text-sm w-6 text-right">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="text-2xl">
                    {getMatchEmoji(track.matchScore)}
                  </span>
                </div>

                {/* Album art */}
                {track.albumArt ? (
                  <img
                    src={track.albumArt}
                    alt={track.album}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                    <Music className="h-6 w-6 text-gray-400" />
                  </div>
                )}

                {/* Track info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium">{track.name}</h4>
                    {track.matchScore && (
                      <span className={`text-xs ${getMatchColor(track.matchScore)}`}>
                        {track.matchScore}% match
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {track.artist} {track.album && `• ${track.album}`}
                  </p>
                  
                  {/* Reasons button */}
                  {track.reasons && track.reasons.length > 0 && (
                    <button
                      onClick={() => toggleInfo(track.id)}
                      className="text-xs text-purple-400 hover:text-purple-300 mt-1 flex items-center gap-1"
                    >
                      <Info className="h-3 w-3" />
                      Why this track?
                    </button>
                  )}
                  
                  {/* Expanded info */}
                  {showInfo[track.id] && track.reasons && (
                    <div className="mt-2 p-2 bg-purple-600/10 rounded-lg text-xs">
                      <ul className="space-y-1">
                        {track.reasons.map((reason, idx) => (
                          <li key={idx} className="text-gray-300 flex items-start gap-1">
                            <span className="text-purple-400 mt-0.5">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                      {track.matchedUsers && track.matchedUsers.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-gray-400">
                          <Users className="h-3 w-3" />
                          Liked by {track.matchedUsers.length} members
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Duration */}
                  <span className="text-gray-500 text-sm">
                    {formatDuration(track.duration)}
                  </span>
                  
                  {/* Votes */}
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">{track.voteCount}</span>
                  </div>

                  {/* Play button (for future) */}
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-purple-400"
                    title="Play"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
