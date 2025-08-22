"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Music, Users, Play, Vote, Radio, Share2, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

interface Party {
  id: string;
  code: string;
  name: string;
  description?: string;
  creatorId: string;
  isActive: boolean;
  maxMembers: number;
  votingEnabled: boolean;
  partyRadio: boolean;
  playlistGenerated: boolean;
  totalMembers: number;
  totalTracks: number;
  totalVotes: number;
  members: PartyMember[];
  tracks: Track[];
}

interface PartyMember {
  id: string;
  userId: string;
  role: 'HOST' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Track {
  id: string;
  name: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration: number;
  matchScore: number;
  voteCount: number;
  position: number;
  sources: string[];
}

export default function PartyPage() {
  const { user, isAuthenticated, requireAuth } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [party, setParty] = useState<Party | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const partyCode = params.code as string;

  useEffect(() => {
    if (requireAuth()) {
      loadPartyData();
    }
  }, [isAuthenticated, partyCode]);

  const loadPartyData = async () => {
    try {
      const response = await fetch(`/api/party/${partyCode}`);
      
      if (response.ok) {
        const data = await response.json();
        setParty(data);
      } else if (response.status === 404) {
        // Партия не найдена, пробуем присоединиться
        await joinParty();
      }
    } catch (error) {
      console.error('Failed to load party data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinParty = async () => {
    setIsJoining(true);
    try {
      const response = await fetch(`/api/party/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: partyCode })
      });

      if (response.ok) {
        const data = await response.json();
        setParty(data.party);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join party');
        router.push('/profile');
      }
    } catch (error) {
      console.error('Failed to join party:', error);
      alert('Failed to join party');
      router.push('/profile');
    } finally {
      setIsJoining(false);
    }
  };

  const generatePlaylist = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/party/${partyCode}/generate-playlist`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setParty(prev => prev ? { ...prev, ...data.party } : null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate playlist');
      }
    } catch (error) {
      console.error('Failed to generate playlist:', error);
      alert('Failed to generate playlist');
    } finally {
      setIsGenerating(false);
    }
  };

  const voteForTrack = async (trackId: string, value: 1 | -1) => {
    try {
      const response = await fetch(`/api/party/${partyCode}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackId, value })
      });

      if (response.ok) {
        // Обновляем данные партии
        loadPartyData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to vote');
    }
  };

  const enablePartyRadio = async () => {
    try {
      const response = await fetch(`/api/party/${partyCode}/radio`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setParty(prev => prev ? { ...prev, partyRadio: true } : null);
        alert(data.message || 'Party Radio enabled!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to enable Party Radio');
      }
    } catch (error) {
      console.error('Failed to enable Party Radio:', error);
      alert('Failed to enable Party Radio');
    }
  };

  const shareParty = () => {
    const shareUrl = `${window.location.origin}/join/${partyCode}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Party link copied to clipboard!');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading || isJoining) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">
          {isJoining ? 'Joining party...' : 'Loading party...'}
        </div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Party not found</div>
      </div>
    );
  }

  const isHost = party.creatorId === user?.id;
  const currentMember = party.members.find(m => m.userId === user?.id);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{party.name}</h1>
                {party.description && (
                  <p className="text-gray-300">{party.description}</p>
                )}
              </div>
              <button
                onClick={shareParty}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{party.totalMembers}</div>
                <div className="text-gray-300 text-sm">Members</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{party.totalTracks}</div>
                <div className="text-gray-300 text-sm">Tracks</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{party.totalVotes}</div>
                <div className="text-gray-300 text-sm">Votes</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{party.code}</div>
                <div className="text-gray-300 text-sm">Party Code</div>
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl p-6 border border-blue-500/20 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Party Members ({party.members.length})</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {party.members.map(member => (
              <div key={member.id} className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                  {member.user.image ? (
                    <img src={member.user.image} alt={member.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                      {member.user.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">{member.user.name}</div>
                  <div className="text-gray-300 text-sm">
                    {member.role === 'HOST' ? 'Host' : 'Member'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Playlist Section */}
        <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold text-white">Party Playlist</h2>
            </div>
            
            <div className="flex gap-2">
              {!party.playlistGenerated ? (
                <button
                  onClick={generatePlaylist}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Generate Playlist'}
                </button>
              ) : (
                <>
                  <button
                    onClick={enablePartyRadio}
                    disabled={party.partyRadio}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    <Radio className="w-4 h-4" />
                    {party.partyRadio ? 'Radio Active' : 'Enable Radio'}
                  </button>
                  <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Play
                  </button>
                </>
              )}
            </div>
          </div>

          {!party.playlistGenerated ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Ready to create the perfect playlist?</h3>
              <p className="text-gray-300 mb-6">
                We'll analyze everyone's music taste and generate a playlist everyone will love!
              </p>
              <button
                onClick={generatePlaylist}
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {isGenerating ? 'Analyzing tastes...' : 'Generate Playlist 🎵'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {party.tracks.map((track, index) => (
                <div key={track.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <span className="text-gray-400 text-sm w-8">{track.position}</span>
                  
                  {track.albumArt && (
                    <img src={track.albumArt} alt={track.album} className="w-12 h-12 rounded" />
                  )}
                  
                  <div className="flex-1">
                    <div className="text-white font-medium">{track.name}</div>
                    <div className="text-gray-300 text-sm">{track.artist}</div>
                    {track.album && (
                      <div className="text-gray-400 text-xs">{track.album}</div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-green-400 text-sm font-medium">{track.matchScore}%</div>
                    <div className="text-gray-400 text-xs">Match</div>
                  </div>
                  
                  {party.votingEnabled && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => voteForTrack(track.id, -1)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        👎
                      </button>
                      <span className="text-white font-medium">{track.voteCount}</span>
                      <button
                        onClick={() => voteForTrack(track.id, 1)}
                        className="text-green-400 hover:text-green-300 transition"
                      >
                        👍
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}