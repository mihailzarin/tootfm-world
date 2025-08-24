import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Используем ПРАВИЛЬНЫЕ названия переменных
    const teamId = process.env.APPLE_MUSIC_TEAM_ID;
    const keyId = process.env.APPLE_MUSIC_KEY_ID;
    const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY;
    
    return NextResponse.json({
      success: true,
      checks: {
        teamId: teamId ? '✅ Found' : '❌ Missing',
        keyId: keyId ? '✅ Found' : '❌ Missing',
        privateKey: privateKey ? '✅ Found' : '❌ Missing',
        privateKeyLength: privateKey?.length || 0,
        env: {
          APPLE_MUSIC_TEAM_ID: !!process.env.APPLE_MUSIC_TEAM_ID,
          APPLE_MUSIC_KEY_ID: !!process.env.APPLE_MUSIC_KEY_ID,
          APPLE_MUSIC_PRIVATE_KEY: !!process.env.APPLE_MUSIC_PRIVATE_KEY
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}