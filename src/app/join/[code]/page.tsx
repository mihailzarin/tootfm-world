'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function JoinPartyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  useEffect(() => {
    if (code) {
      // Сохраняем код party
      localStorage.setItem('joining_party_code', code.toUpperCase());
      localStorage.setItem('is_host', 'false');
      
      // Перенаправляем в плеер
      router.push(`/player?code=${code.toUpperCase()}`);
    }
  }, [code, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-2xl mb-4">Joining party...</h1>
        <p className="text-gray-400">Code: {code?.toUpperCase()}</p>
      </div>
    </div>
  );
}
