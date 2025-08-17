"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateSession() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxParticipants: "10"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Генерируем код локально пока нет API
      const partyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Сохраняем в localStorage временно
      const party = {
        code: partyCode,
        name: formData.name,
        description: formData.description,
        maxParticipants: formData.maxParticipants,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('currentParty', JSON.stringify(party));
      
      // Переходим на страницу party
      setTimeout(() => {
        router.push(`/party/${partyCode}`);
      }, 1000);
      
    } catch (error) {
      console.error("Error creating party:", error);
      alert("Error creating party. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center text-white mb-8 hover:text-purple-300">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            Host Your Music Party 🎵
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Party Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-4 rounded-xl bg-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Friday Night Vibes"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-4 rounded-xl bg-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
                placeholder="Let's vibe together..."
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Maximum participants</label>
              <select
                value={formData.maxParticipants}
                onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                className="w-full p-4 rounded-xl bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="10">10 people</option>
                <option value="25">25 people</option>
                <option value="50">50 people</option>
                <option value="100">100 people</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCreating || !formData.name}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Party"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
