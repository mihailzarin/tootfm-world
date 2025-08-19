// app/party/[code]/page.tsx
// Party страница с интегрированным Spotify плеером

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Music, 
  Users, 
  Share2, 
  ArrowLeft, 
  Plus,
  Search,
  Loader2,
  Sparkles,
  RefreshCw,
  Heart,
  TrendingUp
} from 'lucide-react';
import PartyPlayer from '@/components/party/PartyPlayer';

interface Track {
  id: string;
  spotifyId: string;
  name: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration: number;
  voteCount: number;
  addedBy?: {
    displayName?: string;
    worldId: string;
  };
}

interface Party {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  creator: {
    id: string;
    worldId: string;
    displayName?: string;
  };
  members: Array<{
    user: {
      id: string;
      worldId: string;
      displayName?: string;
    };
    role: string;
  }>;
  tracks: Track[];
  memberCount: number;
  trackCount: number;
  createdAt: string;
}

export default function PartyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // Load party data
  useEffect(() => {
    if (!code) return;
    loadParty();
  }, [code]);

  // Check if current user is host
  useEffect(() => {
    if (party) {
      // Get current user ID from cookies or localStorage
      const worldId = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('world_id='))
        ?.split('=')[1];
      
      setIsHost(party.creator.worldId === worldId);
    }
  }, [party]);

  const loadParty = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/party/${code.toUpperCase()}`);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        setError(data.error || 'Party not found');
        return;
      }
      
      setParty(data.party);
    } catch (err) {
      setError('Failed to load party');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSmartPlaylist = async () => {
    if (!party) return;
    
    setGenerating(true);
    try {
      const response = await fetch(`/api/party/${code}/generate-playlist`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reload party to show new tracks
        await loadParty();
      }
    } catch (err) {
      console.error('Failed to generate playlist:', err);
    } finally {
      setGenerating(false);
    }
  };

  const searchTracks = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch('/api/spotify/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      const data = await response.json();
      
      if (data.tracks) {
        setSearchResults(data.tracks);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const addTrack = async (track: any) => {
    if (!party) return;
    
    try {
      const response = await fetch(`/api/party/${code}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotifyId: track.id,
          name: track.name,
          artist: track.artists[0]?.name,
          album: track.album?.name,
          albumArt: track.album?.images[0]?.url,
          duration: track.duration_ms
        })
      });
      
      if (response.ok) {
        await loadParty();
        setSearchResults([]);
        setSearchQuery('');
      }
    } catch (err) {
      console.error('Failed to add track:', err);
    }
  };

  const shareParty = () => {
    const url = `${window.location.origin}/join/${code}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Join ${party?.name} on tootFM`,
        text: `Join my music party! Code: ${code}`,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Party link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <Music className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Party Not Found</h2>
          <p className="text-gray-300 mb-6">{error || 'This party does not exist'}</p>
          <button
            onClick={() => router.push('/party/create')}
            className="px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition"
          >
            Create New Party
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-white/60 hover:text-white flex items-center gap-2 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{party.name}</h1>
                {party.description && (
                  <p className="text-gray-300">{party.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Party Code</div>
                <div className="text-2xl font-bold text-white">{party.code}</div>
              </div>
            </div>
            
            <div className="flex gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {party.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <Music className="w-4 h-4" />
                {party.trackCount} tracks
              </span>
            </div>
            
            <button
              onClick={shareParty}
              className="mt-4 px-4 py-2 bg-purple-600/50 text-white rounded-full text-sm font-semibold hover:bg-purple-600 transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Party
            </button>
          </div>
        </div>

        {/* Smart Playlist Generator */}
        {party.trackCount === 0 && (
          <div className="mb-6">
            <button
              onClick={generateSmartPlaylist}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-4 font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Smart Playlist
                </>
              )}
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                placeholder="Search for tracks to add..."
                className="flex-1 bg-white/10 text-white rounded-full px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={searchTracks}
                disabled={searching || !searchQuery.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-3">
                      {track.album?.images?.[0]?.url ? (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="w-10 h-10 rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-purple-600/50 rounded flex items-center justify-center">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <div className="text-white font-medium">{track.name}</div>
                        <div className="text-gray-400 text-sm">
                          {track.artists[0]?.name}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => addTrack(track)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SPOTIFY PLAYER - НОВЫЙ КОМПОНЕНТ */}
        {party.tracks.length > 0 && (
          <div className="mb-6">
            <PartyPlayer 
              tracks={party.tracks}
              partyCode={party.code}
              isHost={isHost}
            />
          </div>
        )}

        {/* Track List */}
        {party.tracks.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Playlist Queue
            </h2>
            
            <div className="space-y-2">
              {party.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-gray-400 w-6 text-center">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{track.name}</div>
                      <div className="text-gray-400 text-sm">{track.artist}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-white font-bold">{track.voteCount}</div>
                      <div className="text-gray-400 text-xs">votes</div>
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-full transition">
                      <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}