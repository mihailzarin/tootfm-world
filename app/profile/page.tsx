"use client";

import dynamic from 'next/dynamic';

// Загружаем компонент ТОЛЬКО на клиенте, отключаем SSR
const ProfileClient = dynamic(
  () => import('./ProfileClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }
);

export default function ProfilePage() {
  return <ProfileClient />;
}