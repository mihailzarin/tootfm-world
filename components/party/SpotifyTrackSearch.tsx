// components/party/SpotifyTrackSearch.tsx
// Component for searching tracks via Spotify API

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, Play, Pause, Loader2, Music, Clock, Check } from 'lucide-react';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url: string | null;
  uri: string;
  popularity: number;
  explicit: boolean;
}

interface SpotifyTrackSearchProps {
  partyCode: string;
  onTrackAdded?: (track: SpotifyTrack) => void;
}

export default function SpotifyTrackSearch({ partyCode, onTrackAdded }: SpotifyTrackSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedTracks, setAddedTracks] = useState<Set<string>>(new Set());
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search tracks via Spotify API
  const searchTracks = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/spotify/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please connect Spotify in your profile');
        } else {
          throw new Error('Search failed');
        }
        return;
      }

      const data = await response.json();
      setResults(data.tracks || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again later.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Cancel previous timer
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timer
    searchTimeoutRef.current = setTimeout(() => {
      searchTracks(newQuery);
    }, 500);
  };

  // Add track to party
  const addTrackToParty = async (track: SpotifyTrack) => {
    try {
      const response = await fetch(`/api/party/${partyCode}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotifyId: track.id,
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          album: track.album.name,
          albumArt: track.album.images[0]?.url,
          duration: track.duration_ms,
          uri: track.uri,
        }),
      });

      if (response.ok) {
        setAddedTracks(prev => new Set(prev).add(track.id));
        if (onTrackAdded) {
          onTrackAdded(track);
        }
        
        // Remove checkmark after 2 seconds
        setTimeout(() => {
          setAddedTracks(prev => {
            const newSet = new Set(prev);
            newSet.delete(track.id);
            return newSet;
          });
        }, 2000);
      } else {
        throw new Error('Failed to add track');
      }
    } catch (err) {
      console.error('Error adding track:', err);
      setError('Failed to add track');
    }
  };

  // Toggle preview playback
  const togglePreview = (previewUrl: string | null, trackId: string) => {
    if (!previewUrl) return;

    if (playingPreview === trackId) {
      // Stop current preview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingPreview(null);
    } else {
      // Stop previous preview if playing
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Play new preview
      audioRef.current = new Audio(previewUrl);
      audioRef.current.volume = 0.3;
      audioRef.current.play();
      setPlayingPreview(trackId);

      // Auto-stop when ended
      audioRef.current.onended = () => {
        setPlayingPreview(null);
        audioRef.current = null;
      };
    }
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder="Search tracks, artists, albums..."
            className="w-full bg-black/40 text-white placeholder-gray-400 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 animate-spin" />
          )}
        </div>
        
        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Found {results.length} tracks
          </h3>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {results.map((track) => (
              <div
                key={track.id}
                className="group bg-black/20 hover:bg-black/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Album cover */}
                  <div className="relative">
                    {track.album.images[0] ? (
                      <img
                        src={track.album.images[0].url}
                        alt={track.album.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                        <Music className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Preview button */}
                    {track.preview_url && (
                      <button
                        onClick={() => togglePreview(track.preview_url, track.id)}
                        className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {playingPreview === track.id ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex-1">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      {track.name}
                      {track.explicit && (
                        <span className="text-xs bg-gray-600 px-1.5 py-0.5 rounded">E</span>
                      )}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {track.artists.map(a => a.name).join(', ')}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {track.album.name} • {formatDuration(track.duration_ms)}
                    </p>
                  </div>

                  {/* Popularity */}
                  <div className="text-center">
                    <div className="text-purple-400 font-semibold">
                      {track.popularity}%
                    </div>
                    <div className="text-gray-500 text-xs">popularity</div>
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => addTrackToParty(track)}
                    disabled={addedTracks.has(track.id)}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-all
                      ${addedTracks.has(track.id)
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }
                    `}
                  >
                    {addedTracks.has(track.id) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {query && !isSearching && results.length === 0 && !error && (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-12 text-center">
          <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No results found for "{query}"</p>
          <p className="text-gray-500 text-sm mt-2">Try a different search</p>
        </div>
      )}

      {/* Initial state */}
      {!query && (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-12 text-center">
          <Search className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Search for Music</h3>
          <p className="text-gray-400">Start typing to search for tracks, artists, or albums</p>
          
          {/* Popular searches */}
          <div className="mt-8">
            <p className="text-gray-500 text-sm mb-3">Try searching for:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['The Weeknd', 'Dua Lipa', 'Drake', 'Taylor Swift', 'BTS'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    searchTracks(suggestion);
                  }}
                  className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-full text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
