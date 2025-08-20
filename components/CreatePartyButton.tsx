'use client';

import { useRouter } from 'next/navigation';
import { Plus, Music } from 'lucide-react';

interface CreatePartyButtonProps {
  hasServices: boolean;
  className?: string;
}

export default function CreatePartyButton({ hasServices, className = '' }: CreatePartyButtonProps) {
  const router = useRouter();

  if (!hasServices) {
    return (
      <div className={`${className}`}>
        <button
          disabled
          className="w-full bg-gray-600 text-gray-400 font-bold py-3 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Party
        </button>
        <p className="text-gray-500 text-xs mt-2 text-center">
          Connect a music service first
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push('/party/create')}
      className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 ${className}`}
    >
      <Plus className="w-5 h-5" />
      Create Party
    </button>
  );
}
