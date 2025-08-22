'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Music, Users, Plus, Copy, Check, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import PartyPlayer from '@/src/components/party/PartyPlayer';
import { getUserId } from '@/lib/auth/client-auth';

export default function PartyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [copied, setCopied] = useState(false);
  const [party, setParty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  
  // States for playlist generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlistGenerated, setPlaylistGenerated] = useState(false);

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
        
        // Check if current user is the host
        const userId = getUserId();
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

  // Generate playlist from Music Portraits
  const generatePlaylist = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch(`/api/party/${code.toUpperCase()}/generate-playlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }
      
      const data = await response.json();
      console.log('Generated playlist:', data);
      
      // Reload party data to get new tracks
      await fetchPartyData();
      setPlaylistGenerated(true);
      
      // Show success for 3 seconds
      setTimeout(() => setPlaylistGenerated(false), 3000);
      
    } catch (error) {
      console.error('Error generating playlist:', error);
      alert('Failed to generate playlist. Make sure party members have connected their music services and generated Music Portraits.');
    } finally {
      setIsGenerating(false);
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

  // Use real tracks from DB or show placeholder
  const hasRealTracks = party.tracks && party.tracks.length > 0;
  const displayTracks = hasRealTracks ? party.tracks : [
    {
      id: 'placeholder-1',
      spotifyId: 'placeholder',
      name: 'No tracks yet',
      artist: 'Generate playlist to start',
      album: '',
      albumArt: null,
      duration: 0,
      voteCount: 0
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
                  <span className="text-white font-medium">
                    {hasRealTracks ? party.tracks.length : 0}
                  </span>
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

            {/* Spotify Player - only if there are real tracks */}
            {hasRealTracks && (
              <PartyPlayer 
                tracks={party.tracks}
                partyCode={party.code}
                isHost={isHost}
              />
            )}
          </div>

          {/* Right Column - Tracks */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Playlist</h2>
                <div className="flex gap-2">
                  {/* Generate Playlist Button */}
                  {(!hasRealTracks || isHost) && (
                    <button 
                      onClick={generatePlaylist}
                      disabled={isGenerating}
                      className={`${
                        playlistGenerated 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      } text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : playlistGenerated ? (
                        <>
                          <Check className="w-4 h-4" />
                          Generated!
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate from Music Portraits
                        </>
                      )}
                    </button>
                  )}
                  
                  <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Track
                  </button>
                </div>
              </div>

              {/* Tracks List */}
              <div className="space-y-3">
                {!hasRealTracks ? (
                  // Show message if no tracks
                  <div className="text-center py-12">
                    <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">No tracks in playlist yet</p>
                    <p className="text-gray-500 text-sm">
                      Click "Generate from Music Portraits" to create a personalized playlist
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      based on party members' music tastes
                    </p>
                  </div>
                ) : (
                  // Show real tracks
                  displayTracks
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
                    ))
                )}
              </div>

              {/* Regenerate playlist for host if tracks already exist */}
              {hasRealTracks && isHost && (
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <p className="text-gray-500 text-sm mb-2">
                    Want to refresh the playlist with updated Music Portraits?
                  </p>
                  <button 
                    onClick={generatePlaylist}
                    disabled={isGenerating}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium transition"
                  >
                    Regenerate Playlist
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}