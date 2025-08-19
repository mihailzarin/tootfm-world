'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Sparkles, Users, Lock, Globe, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';

export default function CreatePartyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Получаем World ID из localStorage
      const userData = localStorage.getItem('user_data');
      let worldId = localStorage.getItem('world_id');
      
      if (userData && !worldId) {
        try {
          const parsed = JSON.parse(userData);
          worldId = parsed.worldId;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      // Подготавливаем данные
      const requestBody = {
        ...formData,
        worldId: worldId // Добавляем World ID в body
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Добавляем World ID в headers если есть
      if (worldId) {
        headers['x-world-id'] = worldId;
      }

      console.log('Creating party with:', { worldId, name: formData.name });

      const response = await fetch('/api/party/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        console.log('Party created successfully:', data.party.code);
        // Сохраняем код последней party
        localStorage.setItem('last_party_code', data.party.code);
        // Переходим на страницу party
        router.push(`/party/${data.party.code}`);
      } else {
        throw new Error(data.error || 'Failed to create party');
      }
    } catch (error) {
      console.error('Error creating party:', error);
      setError(error instanceof Error ? error.message : 'Failed to create party. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-purple-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80 transition">
              <Music className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-xl text-white">tootFM</span>
            </button>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header with animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-full mb-4 animate-pulse">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Create a Party</h1>
          <p className="text-gray-400">Start a democratic music session where everyone's vote counts</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Party Name */}
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition">
            <label className="block text-white font-medium mb-2">
              Party Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Saturday Night Vibes"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition"
              required
              maxLength={50}
              disabled={isLoading}
            />
            <p className="text-gray-400 text-sm mt-2">
              Give your party a memorable name (max 50 characters)
            </p>
          </div>

          {/* Description */}
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition">
            <label className="block text-white font-medium mb-2">
              Description <span className="text-gray-500 text-sm">(Optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Let's create the perfect playlist together! Everyone gets one vote per track."
              rows={3}
              maxLength={200}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition resize-none"
              disabled={isLoading}
            />
            <p className="text-gray-400 text-sm mt-2">
              Tell your guests what this party is about ({formData.description.length}/200)
            </p>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition">
            <label className="block text-white font-medium mb-4">
              Privacy Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="privacy"
                  checked={!formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: false })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-400"
                  disabled={isLoading}
                />
                <div className="flex items-center gap-2 flex-1">
                  <Lock className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition" />
                  <div className="flex-1">
                    <span className="text-white font-medium">Private Party</span>
                    <p className="text-gray-400 text-sm">Only people with the code can join</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="privacy"
                  checked={formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: true })}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-400"
                  disabled={isLoading}
                />
                <div className="flex items-center gap-2 flex-1">
                  <Globe className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition" />
                  <div className="flex-1">
                    <span className="text-white font-medium">Public Party</span>
                    <p className="text-gray-400 text-sm">Anyone can discover and join</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Features Info */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              What Your Party Includes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">One vote per person (World ID verified)</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">Real-time voting updates</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">Multi-service support</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">Democratic queue system</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !formData.name.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Your Party...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Party
              </>
            )}
          </button>
        </form>

        {/* Tips */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>💡 Tip: You'll get a unique 6-character code to share with your guests</p>
        </div>
      </div>
    </div>
  );
}
