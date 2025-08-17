'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { usePartySocket } from '@/hooks/usePartySocket';
import YouTubePlayer from '@/components/YouTubePlayer';

function PlayerContent() {
  const searchParams = useSearchParams();
  const partyCode = searchParams.get('code') || '';
  
  const userId = typeof window !== 'undefined' ? 
    localStorage.getItem('world_id') || `user_${Date.now()}` : '';
  const userName = typeof window !== 'undefined' ? 
    localStorage.getItem('user_name') || 'Guest' : '';
  const isHost = typeof window !== 'undefined' ? 
    localStorage.getItem('is_host') === 'true' : false;
  
  const {
    connected,
    partyState,
    addTrack,
    voteTrack,
    controlPlayback
  } = usePartySocket(partyCode, userId, userName, isHost);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Party: {partyCode || 'Loading...'}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-300">
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Now Playing</h2>
              {partyState.currentTrack ? (
                <div>
                  <YouTubePlayer
                    videoId={partyState.currentTrack.youtubeId || ''}
                    onEnd={() => controlPlayback('skip')}
                    autoplay={partyState.isPlaying}
                  />
                </div>
              ) : (
                <p className="text-gray-400">No track playing. Add some music!</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Queue</h2>
              {partyState.queue.length > 0 ? (
                <div className="space-y-2">
                  {partyState.queue.map((track: any, index: number) => (
                    <div key={index} className="p-2 bg-black/30 rounded">
                      <p className="font-semibold">{track.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Queue is empty</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading player...</div>
      </div>
    }>
      <PlayerContent />
    </Suspense>
  );
}
