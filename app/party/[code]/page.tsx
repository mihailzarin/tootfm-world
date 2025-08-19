'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Music, Users, Plus, Share2, Copy, Check, ArrowLeft } from 'lucide-react';

export default function PartyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [copied, setCopied] = useState(false);
  const [party, setParty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем данные party
    fetchPartyData();
  }, [code]);

  const fetchPartyData = async () => {
    try {
      // Пока просто создаём заглушку
      // TODO: Реальный API запрос
      setParty({
        code: code.toUpperCase(),
        name: 'Loading Party...',
        description: 'Getting party details...',
        memberCount: 0,
        trackCount: 0
      });
    } catch (error) {
      console.error('Error loading party:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        {/* Party Header */}
        <div className="bg-white/5 backdrop-blur rounded-3xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {party?.name || `Party ${code.toUpperCase()}`}
              </h1>
              <p className="text-gray-400">
                {party?.description || 'Democratic music session'}
              </p>
            </div>
            
            {/* Share Code */}
            <div className="bg-purple-600/20 rounded-xl p-4 border border-purple-500/30">
              <p className="text-gray-400 text-sm mb-2">Party Code</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-bold text-white">
                  {code.toUpperCase()}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-5 h-5" />
              <span>{party?.memberCount || 0} members</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Music className="w-5 h-5" />
              <span>{party?.trackCount || 0} tracks</span>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white/5 backdrop-blur rounded-3xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600/20 rounded-full mb-4">
            <Music className="w-10 h-10 text-purple-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Party Created Successfully! 🎉</h2>
          <p className="text-gray-400 mb-6">
            Your party is ready. Share the code <span className="font-mono font-bold text-purple-400">{code.toUpperCase()}</span> with your friends!
          </p>
          <p className="text-gray-500 text-sm">
            Track voting and music playback features coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
