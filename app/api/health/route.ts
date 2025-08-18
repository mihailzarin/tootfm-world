import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    app: 'ok',
    database: 'checking',
    spotify: 'checking',
    worldId: 'checking',
    timestamp: new Date().toISOString()
  };

  // Проверка базы данных
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    console.error('Database check failed:', error);
  }

  // Проверка Spotify credentials
  checks.spotify = process.env.SPOTIFY_CLIENT_ID ? 'configured' : 'missing';
  
  // Проверка World ID
  checks.worldId = process.env.NEXT_PUBLIC_WORLD_APP_ID ? 'configured' : 'missing';

  return NextResponse.json(checks);
}
