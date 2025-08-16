'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartySocket } from '@/hooks/usePartySocket';
import YouTubePlayer from '@/components/YouTubePlayer';

export default function PlayerPage() {
  const searchParams = useSearchParams();
  const partyCode = searchParams.get('code') || '';
  
  // Получаем данные пользователя
  const userId = localStorage.getItem('world_id') || `user_${Date.now()}`;
  const userName = localStorage.getItem('user_name') || 'Guest';
  const isHost = localStorage.getItem('is_host') === 'true';
  
  // Подключаемся к WebSocket
  const {
    connected,
    partyState,
    addTrack,
    voteTrack,
    controlPlayback
  } = usePartySocket(partyCode, userId, userName, isHost);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Поиск треков
  const searchTracks = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.tracks);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Добавить трек через WebSocket
  const handleAddTrack = (track: any) => {
    addTrack({
      id: `track_${Date.now()}`,
      title: track.title,
      artist: track.artist,
      youtubeId: track.id,
      thumbnail: track.thumbnail
    });
    
    setSearchResults([]);
    setSearchQuery('');
  };

  // Голосовать за трек
  const handleVote = (trackId: string) => {
    const track = partyState.queue.find(t => t.id === trackId);
    if (track) {
      const hasVoted = track.votedBy.includes(userId);
      voteTrack(trackId, hasVoted ? -1 : 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Party: {partyCode}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-300">
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-300">
              👥 {partyState.participants.length} people vibing
            </div>
            {isHost && (
              <div className="text-xs text-purple-400 mt-1">
                You're the host 👑
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Currently Playing */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Now Playing</h2>
              
              {partyState.currentTrack ? (
                <div>
                  <div className="bg-black/30 rounded-lg p-4 mb-4">
                    <h3 className="font-bold text-lg">{partyState.currentTrack.title}</h3>
                    <p className="text-gray-300">{partyState.currentTrack.artist}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Added by {partyState.currentTrack.addedBy}
                    </p>
                  </div>
                  
                  {partyState.currentTrack.youtubeId && (
                    <YouTubePlayer
                      videoId={partyState.currentTrack.youtubeId}
                      onEnd={() => controlPlayback('skip')}
                      autoplay={partyState.isPlaying}
                    />
                  )}
                  
                  {isHost && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => controlPlayback(partyState.isPlaying ? 'pause' : 'play')}
                        className="px-4 py-2 bg-purple-500 rounded"
                      >
                        {partyState.isPlaying ? 'Pause' : 'Play'}
                      </button>
                      <button
                        onClick={() => controlPlayback('skip')}
                        className="px-4 py-2 bg-purple-500 rounded"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">No track playing. Add some music!</p>
              )}
            </div>

            {/* Search */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Add Music</h2>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                  placeholder="Search for songs..."
                  className="flex-1 px-4 py-2 bg-black/30 rounded-lg"
                />
                <button
                  onClick={searchTracks}
                  disabled={isSearching}
                  className="px-6 py-2 bg-purple-500 rounded-lg"
                >
                  Search
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handleAddTrack(track)}
                      className="p-3 bg-black/30 rounded-lg hover:bg-black/40 cursor-pointer"
                    >
                      <p className="font-semibold">{track.title}</p>
                      <p className="text-sm text-gray-400">{track.artist}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Queue & Participants */}
          <div className="space-y-6">
            {/* Queue */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Up Next</h2>
              
              {partyState.queue.length > 0 ? (
                <div className="space-y-2">
                  {partyState.queue.map((track) => (
                    <div key={track.id} className="p-3 bg-black/30 rounded-lg">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold">{track.title}</p>
                          <p className="text-sm text-gray-400">{track.artist}</p>
                        </div>
                        <button
                          onClick={() => handleVote(track.id)}
                          className={`px-2 py-1 rounded text-sm ${
                            track.votedBy.includes(userId)
                              ? 'bg-purple-500'
                              : 'bg-purple-500/50'
                          }`}
                        >
                          ↑ {track.votes}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Queue is empty</p>
              )}
            </div>

            {/* Participants */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Party People</h2>
              
              <div className="space-y-2">
                {partyState.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>{participant.name}</span>
                    {participant.isHost && (
                      <span className="text-xs text-purple-400">👑</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
