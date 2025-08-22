// lib/auth/client-auth.ts
// Client-side authentication utilities

import { AUTH_CONFIG } from './config';

export interface AuthUser {
  id: string;
  displayName: string;
  email?: string;
  avatar?: string;
  level: 'guest' | 'music' | 'verified';
  hasGoogle: boolean;
  hasSpotify: boolean;
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try to get from localStorage first
  const storedId = localStorage.getItem(AUTH_CONFIG.COOKIES.USER_ID);
  if (storedId) return storedId;
  
  // Fallback to cookie
  const cookies = document.cookie.split(';');
  const userCookie = cookies.find(c => c.trim().startsWith(`${AUTH_CONFIG.COOKIES.USER_ID}=`));
  return userCookie ? userCookie.split('=')[1] : null;
}

export function setUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_CONFIG.COOKIES.USER_ID, userId);
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage
  localStorage.removeItem(AUTH_CONFIG.COOKIES.USER_ID);
  localStorage.removeItem('spotify_user');
  localStorage.removeItem('lastfm_username');
  localStorage.removeItem('apple_music_token');
  
  // Clear cookies
  const cookiesToDelete = [
    AUTH_CONFIG.COOKIES.USER_ID,
    AUTH_CONFIG.COOKIES.GOOGLE_USER,
    AUTH_CONFIG.COOKIES.SPOTIFY_TOKEN,
    AUTH_CONFIG.COOKIES.SPOTIFY_REFRESH,
    AUTH_CONFIG.COOKIES.SPOTIFY_USER,
    AUTH_CONFIG.COOKIES.SPOTIFY_EXPIRES,
    AUTH_CONFIG.COOKIES.LASTFM_SESSION,
    AUTH_CONFIG.COOKIES.LASTFM_USERNAME,
    AUTH_CONFIG.COOKIES.APPLE_MUSIC_TOKEN
  ];
  
  cookiesToDelete.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

export async function checkAuthStatus(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/auth/check');
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.authenticated) return null;
    
    return {
      id: data.userId || 'guest',
      displayName: 'User',
      level: data.userLevel || 'guest',
      hasGoogle: data.hasGoogle || false,
      hasSpotify: data.hasSpotify || false
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

export function getSpotifyUser(): any {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try localStorage first
    const stored = localStorage.getItem('spotify_user');
    if (stored) return JSON.parse(stored);
    
    // Fallback to cookie
    const cookies = document.cookie.split(';');
    const spotifyCookie = cookies.find(c => c.trim().startsWith(`${AUTH_CONFIG.COOKIES.SPOTIFY_USER}=`));
    if (spotifyCookie) {
      const value = decodeURIComponent(spotifyCookie.split('=')[1]);
      return JSON.parse(value);
    }
  } catch (error) {
    console.error('Error parsing Spotify user data:', error);
  }
  
  return null;
}

export function getLastFmUsername(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try localStorage first
  const stored = localStorage.getItem('lastfm_username');
  if (stored) return stored;
  
  // Fallback to cookie
  const cookies = document.cookie.split(';');
  const lastfmCookie = cookies.find(c => c.trim().startsWith(`${AUTH_CONFIG.COOKIES.LASTFM_USERNAME}=`));
  return lastfmCookie ? lastfmCookie.split('=')[1] : null;
}
