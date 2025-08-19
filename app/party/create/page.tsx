'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Users, Settings, ArrowRight, Loader2 } from 'lucide-react';

export default function CreatePartyPage() {
  const router = useRouter();
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const createParty = async () => {
    if (!partyName.trim()) {
      setError('Please enter a party name');
      return;
    }

    setCreating(true);
    setError('');

    try {
      // Get user data from localStorage
      const userData = localStorage.getItem('user_data');
      if (!userData) {
        router.push('/');
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.worldId || user.nullifier_hash || user.id;

      const response = await fetch('/api/party/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: partyName.trim(),
          description: description.trim(),
          userId: userId
        })
      });

      const data = await response.json();

      if (data.success && data.party) {
        // Redirect to party page
        router.push(`/party/${data.party.code}`);
      } else {
        setError(data.error || 'Failed to create party');
      }
    } catch (error) {
      console.error('Error creating party:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white">
      <div className="max-w-2xl mx-auto p-6 pt-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
            <Music className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Create a Party</h1>
          <p className="text-gray-400">Start a democratic music session with World ID verification</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-8">
          {/* Party Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Party Name *</label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Friday Night Vibes"
              className="w-full px-4 py-3 bg-black/30 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Let's create the perfect playlist together!"
              className="w-full px-4 py-3 bg-black/30 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500 min-h-[100px]"
              maxLength={200}
            />
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-300">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Sybil-resistant voting with World ID</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Music className="w-5 h-5 text-purple-400" />
              <span>Multi-service support (Spotify, Apple Music, etc.)</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Settings className="w-5 h-5 text-purple-400" />
              <span>Real-time democratic playlist</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={createParty}
            disabled={creating || !partyName.trim()}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              creating || !partyName.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white'
            }`}
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Party
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/profile')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
}