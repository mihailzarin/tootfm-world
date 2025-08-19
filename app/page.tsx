'use client';

import dynamic from 'next/dynamic';

const WorldIDButton = dynamic(() => import('../components/WorldIDButton'), {
  ssr: false,
  loading: () => (
    <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full opacity-50 cursor-not-allowed">
      Loading...
    </button>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="mb-8">
          <h1 className="text-7xl font-bold text-white mb-4">
            toot<span className="text-purple-400">FM</span>
          </h1>
          <p className="text-2xl text-gray-300">
            Collaborative music for your parties
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <WorldIDButton />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <a 
              href="/profile" 
              className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-purple-500/30 text-white rounded-2xl hover:border-purple-400/50 transition-all transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <span className="relative z-10 font-semibold text-lg">🎵 My Profile</span>
            </a>
            
            <a 
              href="/party/create" 
              className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10 font-semibold text-lg">🎉 Create Party</span>
            </a>
            
            <a 
              href="/join" 
              className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-lg border border-green-500/30 text-white rounded-2xl hover:border-green-400/50 transition-all transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <span className="relative z-10 font-semibold text-lg">🚀 Join Party</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
