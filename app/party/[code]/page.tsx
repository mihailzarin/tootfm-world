"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function PartyPage() {
  const params = useParams();
  const code = params.code as string;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-white mb-8 hover:text-purple-300">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Leave Party
        </Link>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Party Created! 🎉</h1>
            <p className="text-gray-300">Share this code with friends</p>
            
            <div className="mt-6 p-6 bg-white/20 rounded-2xl">
              <p className="text-sm text-gray-400 mb-2">Party Code</p>
              <p className="text-4xl font-mono font-bold text-white">{code.toUpperCase()}</p>
            </div>

            <button 
              onClick={() => navigator.clipboard.writeText(code)}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
            >
              Copy Code
            </button>
          </div>

          <div className="text-center text-gray-400">
            <p>Music queue coming soon...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
