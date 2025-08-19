'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Music, Users, Plus, Copy, Check, ArrowLeft, Loader2 } from 'lucide-react';
import PartyPlayer from '@/src/components/party/PartyPlayer';  // Правильный путь!

export default function PartyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [copied, setCopied] = useState(false);
  const [party, setParty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (code) {
      fetchPartyData();
    }
  }, [code]);

  const fetchPartyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/party/${code.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error('Party not found');
      }
      
      const data = await response.json();
      
      if (data.party) {
        setParty(data.party);
        
        // Проверяем, является ли текущий пользователь хостом
        const userId = document.cookie
          .split('; ')
          .find(row => row.startsWith('tootfm_uid='))
          ?.split('=')[1];
        
        setIsHost(data.party.creatorId === userId);
        setError(null);
      } else {
        setError('Party not found');
      }
    } catch (error) {
      console.error('Error loading party:', error);
      setError('Failed to load party');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading party data...</p>
        </div>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="bg-white/5 backdrop-blur rounded-3xl p-12">
            <p className="text-red-400 text-xl mb-4">{error || 'Party not found'}</p>
            <button
              onClick={() => router.push('/my-parties')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              Back to My Parties
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Добавляем демо-треки если party пустая
  const demoTracks = party.tracks && party.tracks.length > 0 ? party.tracks : [
    {
      id: '1',
      spotifyId: '3n3Ppam7vgaVa1iaRUc9Lp',
      name: 'Mr. Brightside',
      artist: 'The Killers',
      album: 'Hot Fuss',
      albumArt: 'https://i.scdn.co/image/ab67616d0000b27342189b673b2f3b6c1a3b5b5f',
      duration: 222000,
      voteCount: 5
    },
    {
      id: '2',
      spotifyId: '7qiZfU4dY1lWllzX7mPBI3',
      name: 'Shape of You',
      artist: 'Ed Sheeran',
      album: '÷ (Deluxe)',
      duration: 233000,
      voteCount: 3
    },
    {
      id: '3',
      spotifyId: '1zi7xx7UVEFkmKfv06H8x0',
      name: 'One More Time',
      artist: 'Daft Punk',
      album: 'Discovery',
      duration: 320000,
      voteCount: 7
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => router.push('/')} className="flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-xl text-white">tootFM</span>
            </button>
          </div>
          <button
            onClick={() => router.push('/my-parties')}
            className="text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            My Parties
          </button>
        </div>
      </div>

      {/* Party Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Party Info & Player */}
          <div className="lg:col-span-1 space-y-6">
            {/* Party Info */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                {party.name}
              </h1>
              {party.description && (
                <p className="text-gray-400 text-sm mb-4">{party.description}</p>
              )}
              
              {/* Party Code */}
              <div className="bg-purple-600/20 rounded-xl p-4 border border-purple-500/30">
                <p className="text-gray-400 text-sm mb-2">Share Code</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-bold text-white">
                    {party.code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Members</span>
                  <span className="text-white font-medium">{party._count?.members || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Tracks</span>
                  <span className="text-white font-medium">{demoTracks.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Host</span>
                  <span className="text-white font-medium">
                    {party.creator?.displayName || 'Party Host'}
                    {isHost && ' (You)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Spotify Player */}
            <PartyPlayer 
              tracks={demoTracks}
              partyCode={party.code}
              isHost={isHost}
            />
          </div>

          {/* Right Column - Tracks */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Playlist</h2>
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Track
                </button>
              </div>

              <div className="space-y-3">
                {demoTracks
                  .sort((a: any, b: any) => (b.voteCount || 0) - (a.voteCount || 0))
                  .map((track: any, index: number) => (
                    <div 
                      key={track.id} 
                      className="bg-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition"
                    >
                      <span className="text-2xl text-gray-500 font-bold w-12 text-center">
                        {index + 1}
                      </span>
                      {track.albumArt && (
                        <img 
                          src={track.albumArt} 
                          alt={track.album}
                          className="w-12 h-12 rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{track.name}</p>
                        <p className="text-gray-400 text-sm">{track.artist}</p>
                        {track.album && (
                          <p className="text-gray-500 text-xs">{track.album}</p>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-bold text-lg">
                          {track.voteCount || 0}
                        </div>
                        <div className="text-gray-500 text-xs">votes</div>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition">
                          👍
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition">
                          👎
                        </button>
                      </div>
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
