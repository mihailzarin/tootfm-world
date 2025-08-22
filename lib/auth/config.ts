// lib/auth/config.ts
// Centralized authentication configuration

export const AUTH_CONFIG = {
  // Cookie names - centralized to prevent inconsistencies
  COOKIES: {
    USER_ID: 'tootfm_user_id',
    GOOGLE_USER: 'google_user',
    SPOTIFY_TOKEN: 'spotify_token',
    SPOTIFY_REFRESH: 'spotify_refresh',
    SPOTIFY_USER: 'spotify_user',
    SPOTIFY_EXPIRES: 'spotify_expires',
    LASTFM_USERNAME: 'lastfm_username',
    LASTFM_SESSION: 'lastfm_session',
    APPLE_MUSIC_TOKEN: 'apple_music_token'
  },

  // Cookie settings
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.tootfm.world' : undefined
  },

  // Public cookie options (for client-side access)
  PUBLIC_COOKIE_OPTIONS: {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.tootfm.world' : undefined
  },

  // Token expiration times (in seconds)
  EXPIRATION: {
    ACCESS_TOKEN: 3600, // 1 hour
    REFRESH_TOKEN: 60 * 60 * 24 * 365, // 1 year
    SESSION: 60 * 60 * 24 * 30 // 30 days
  },

  // OAuth redirect URLs
  REDIRECT_URLS: {
    GOOGLE: {
      PRODUCTION: 'https://tootfm.world/api/auth/google/callback',
      DEVELOPMENT: 'http://localhost:3001/api/auth/google/callback'
    },
    SPOTIFY: {
      PRODUCTION: 'https://tootfm.world/api/spotify/callback',
      DEVELOPMENT: 'http://localhost:3001/api/spotify/callback'
    }
  },

  // User levels
  USER_LEVELS: {
    GUEST: 'guest',
    MUSIC: 'music',
    VERIFIED: 'verified'
  } as const
};

export type UserLevel = typeof AUTH_CONFIG.USER_LEVELS[keyof typeof AUTH_CONFIG.USER_LEVELS];

// Helper functions
export function getRedirectUrl(service: 'google' | 'spotify'): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? AUTH_CONFIG.REDIRECT_URLS[service.toUpperCase() as keyof typeof AUTH_CONFIG.REDIRECT_URLS].PRODUCTION
    : AUTH_CONFIG.REDIRECT_URLS[service.toUpperCase() as keyof typeof AUTH_CONFIG.REDIRECT_URLS].DEVELOPMENT;
}

export function getCookieOptions(httpOnly: boolean = true) {
  return httpOnly ? AUTH_CONFIG.COOKIE_OPTIONS : AUTH_CONFIG.PUBLIC_COOKIE_OPTIONS;
}