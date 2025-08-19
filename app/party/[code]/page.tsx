'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Music, Users, Share2, Plus, ArrowLeft } from 'lucide-react';

interface Party {
  id: string;
  code: string;
  name: string;
  description?: string;
  memberCount: number;
  trackCount: number;
}

export default function PartyPage() {
  const router = useRouter();
  const params = useParams();
  const code = params?.code as string;
  
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (code) {
      loadParty();
    }
  }, [code]);

  const loadParty = async () => {
    try {
      const response = await fetch(`/api/party/${code}`);
      const data = await response.json();

      if (data.success && data.party) {
        setParty(data.party);
      } else {
        setError(data.error || 'Party not found');
      }
    } catch (error) {
      console.error('Error loading party:', error);
      setError('Failed to load party');
    } finally {
      setLoading(false);
    }
  };

  const shareParty = () => {
    const url = `${window.location.origin}/party/join?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading party...</p>
        </div>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Party not found'}</p>
          <button
            onClick={() => router.push('/profile')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{party.name}</h1>
              {party.description && (
                <p className="text-gray-400 mb-4">{party.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {party.memberCount} members
                </span>
                <span className="flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  {party.trackCount} tracks
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Party Code */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-6 text-center">
          <p className="text-gray-400 mb-2">Party Code</p>
          <p className="text-4xl font-bold font-mono mb-4">{party.code}</p>
          <button
            onClick={shareParty}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-full inline-flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share Party'}
          </button>
        </div>

        {/* Add Track Button */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-6">
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Add Track
          </button>
        </div>

        {/* Tracks List */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">Playlist</h2>
          {party.trackCount === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tracks yet. Add the first one!</p>
            </div>
          ) : (
            <p className="text-gray-400">Track list coming soon...</p>
          )}
        </div>
      </div>
    </div>
  );
}