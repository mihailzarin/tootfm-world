// app/api/spotify/auth/route.ts
// Безопасная авторизация Spotify с scope для воспроизведения

import { NextResponse } from 'next/server';

export async function GET() {
  // ВАЖНО: Используем переменные окружения для безопасности!
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world';
  
  // Проверяем наличие CLIENT_ID
  if (!CLIENT_ID) {
    console.error('❌ SPOTIFY_CLIENT_ID not configured in environment variables!');
    return NextResponse.json(
      { error: 'Spotify is not configured. Please contact support.' },
      { status: 500 }
    );
  }
  
  // Формируем redirect URI на основе текущего окружения
  const REDIRECT_URI = `${baseUrl}/api/spotify/callback`;
  
  // ВСЕ необходимые scope для полной функциональности
  const scopes = [
    // === Базовые scope (были раньше) ===
    'user-read-private',           // Читать профиль пользователя
    'user-read-email',              // Читать email
    'user-top-read',                // Читать топ треки и артистов
    'user-library-read',            // Читать библиотеку
    
    // === НОВЫЕ scope для воспроизведения ===
    'streaming',                    // ⭐ КРИТИЧЕСКИ ВАЖНО для Web Playback SDK
    'user-read-playback-state',     // Читать состояние плеера
    'user-modify-playback-state',   // Управлять воспроизведением
    'user-read-currently-playing',  // Текущий трек
    
    // === Scope для работы с плейлистами (для экспорта) ===
    'playlist-read-private',        // Читать приватные плейлисты
    'playlist-read-collaborative',  // Читать совместные плейлисты
    'playlist-modify-public',       // Создавать публичные плейлисты
    'playlist-modify-private',      // Создавать приватные плейлисты
    
    // === Дополнительные полезные scope ===
    'user-read-recently-played',    // История прослушиваний
    'user-follow-read',             // Подписки на артистов
    'user-follow-modify'            // Управление подписками
  ];
  
  // Формируем параметры для OAuth
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scopes.join(' '),
    redirect_uri: REDIRECT_URI,
    show_dialog: 'false',          // Не показывать диалог повторно
    // Можно добавить state для безопасности
    state: generateRandomString(16)
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params}`;
  
  // Логируем для отладки (без sensitive данных)
  console.log('🎵 Spotify Auth initiated');
  console.log('📝 Requested scopes:', scopes.length, 'permissions');
  console.log('🔗 Redirect URI:', REDIRECT_URI);
  console.log('✅ Environment:', process.env.NODE_ENV);
  
  // НЕ логируем CLIENT_ID в продакшене!
  if (process.env.NODE_ENV === 'development') {
    console.log('🔑 CLIENT_ID (first 10 chars):', CLIENT_ID.substring(0, 10) + '...');
  }
  
  return NextResponse.redirect(authUrl);
}

// Генератор случайной строки для state параметра (защита от CSRF)
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return text;
}