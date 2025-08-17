'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SpotifyConnect from '@/components/SpotifyConnect';

export default function PlayerPage() {
  const searchParams = useSearchParams();
  const [partyCode, setPartyCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  useEffect(() => {
    const storedCode = localStorage.getItem('session_id');
    setPartyCode(storedCode?.toUpperCase().slice(0, 6) || 'DEMO123');
    checkSpotifyConnection();
  }, []);

  useEffect(() => {
    // Проверяем параметры URL при загрузке
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify') === 'connected') {
      setSpotifyConnected(true);
      // Убираем параметр из URL
      window.history.replaceState({}, '', '/player');
    }
  }, []);

  const checkSpotifyConnection = () => {
    const token = document.cookie.includes('spotify_access_token');
    setSpotifyConnected(token);
  };

  const searchTracks = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (response.status === 401) {
        setSpotifyConnected(false);
        alert('Spotify session expired. Please reconnect.');
        return;
      }
      
      const data = await response.json();
      if (data.tracks) {
        setSearchResults(data.tracks);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addToQueue = (track: any) => {
    setQueue([...queue, { ...track, votes: 1 }]);
    setSearchResults([]);
    setSearchQuery('');
    
    if (!currentTrack) {
      setCurrentTrack(track);
    }
  };

  const voteTrack = (index: number) => {
    const newQueue = [...queue];
    newQueue[index].votes += 1;
    newQueue.sort((a, b) => b.votes - a.votes);
    setQueue(newQueue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Party: {partyCode}</h1>
          <SpotifyConnect />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Now Playing */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Now Playing</h2>
              
              {currentTrack ? (
                <div className="bg-black/30 rounded-lg p-4">
                  {currentTrack.image && (
                    <img 
                      src={currentTrack.image} 
                      alt={currentTrack.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="font-bold text-lg">{currentTrack.title}</h3>
                  <p className="text-gray-300">{currentTrack.artist}</p>
                  <p className="text-sm text-gray-400">Album: {currentTrack.album}</p>
                </div>
              ) : (
                <p className="text-gray-400">No track playing. Add some music!</p>
              )}
            </div>

            {/* Add Music */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Add Music</h2>
              
              {spotifyConnected ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                      placeholder="Search for songs..."
                      className="flex-1 px-4 py-2 bg-black/30 rounded-lg text-white placeholder-gray-400"
                    />
                    <button
                      onClick={searchTracks}
                      disabled={isSearching}
                      className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSearching ? '...' : 'Search'}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((track, index) => (
                        <div
                          key={index}
                          onClick={() => addToQueue(track)}
                          className="p-3 bg-black/30 rounded-lg hover:bg-black/40 cursor-pointer flex items-center gap-3"
                        >
                          {track.image && (
                            <img src={track.image} alt="" className="w-12 h-12 rounded" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">{track.title}</p>
                            <p className="text-sm text-gray-400">{track.artist}</p>
                          </div>
                          <span className="text-xs bg-purple-500 px-2 py-1 rounded">Add</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Connect Spotify to search and add tracks</p>
                  <button
                    onClick={() => window.location.href = '/api/spotify/auth'}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full"
                  >
                    Connect Spotify
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Queue */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Queue</h2>
            
            {queue.length > 0 ? (
              <div className="space-y-2">
                {queue.map((track, index) => (
                  <div key={index} className="p-3 bg-black/30 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{track.title}</p>
                        <p className="text-xs text-gray-400">{track.artist}</p>
                      </div>
                      <button
                        onClick={() => voteTrack(index)}
                        className="px-2 py-1 bg-purple-500 hover:bg-purple-600 rounded text-xs"
                      >
                        ↑ {track.votes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Empty</p>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Share party code: <span className="font-mono text-white">{partyCode}</span></p>
          {spotifyConnected && (
            <p className="mt-2 text-green-400">✓ Spotify Connected</p>
          )}
        </div>
      </div>
    </div>
  );
}
