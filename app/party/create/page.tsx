"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Music, Users, Shield, Radio, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreatePartyPage() {
  const { user, isAuthenticated, requireAuth } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxMembers: 50,
    votingEnabled: false,
    partyRadio: false
  });

  if (!requireAuth()) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/party/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const { party } = await response.json();
        router.push(`/party/${party.code}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create party');
      }
    } catch (error) {
      console.error('Error creating party:', error);
      alert('Failed to create party');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create a Party</h1>
          <p className="text-gray-300">
            Set up your party and start creating the perfect playlist together
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Music className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Party Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-white font-medium mb-2">
                  Party Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Enter party name..."
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-white font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Describe your party..."
                />
              </div>

              <div>
                <label htmlFor="maxMembers" className="block text-white font-medium mb-2">
                  Max Members
                </label>
                <select
                  id="maxMembers"
                  name="maxMembers"
                  value={formData.maxMembers}
                  onChange={handleInputChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={10}>10 members</option>
                  <option value={20}>20 members</option>
                  <option value={50}>50 members</option>
                  <option value={100}>100 members</option>
                </select>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Party Features</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <div>
                    <h3 className="text-white font-medium">Democratic Voting</h3>
                    <p className="text-gray-300 text-sm">Enable World ID voting for fair track selection</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="votingEnabled"
                    checked={formData.votingEnabled}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Radio className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-white font-medium">Party Radio Mode</h3>
                    <p className="text-gray-300 text-sm">AI-powered dynamic playlist that adapts to the party mood</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="partyRadio"
                    checked={formData.partyRadio}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-400" />
                <h3 className="text-white font-medium">How it works</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Share the party code with friends. Everyone connects their music profiles and AI generates the perfect playlist.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-xl p-4 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Music className="w-4 h-4 text-orange-400" />
                <h3 className="text-white font-medium">Music Analysis</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Our AI analyzes everyone's music taste from Spotify, Last.fm, and Apple Music to create the ultimate playlist.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300"
          >
            {isCreating ? 'Creating Party...' : 'Create Party'}
          </button>
        </form>
      </div>
    </div>
  );
}
