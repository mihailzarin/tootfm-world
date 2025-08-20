// app/api/music/apple/token/route.ts
import { NextResponse } from 'next/server';
import { generateAppleMusicToken } from '@/src/lib/music-services/apple/token-generator';

export async function GET() {
  try {
    // Генерируем developer token
    const token = generateAppleMusicToken();
    
    return NextResponse.json({ 
      success: true,
      token,
      expiresIn: 15552000 // 180 дней в секундах
    });
  } catch (error: any) {
    console.error('❌ Ошибка генерации Apple Music токена:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate token' 
      },
      { status: 500 }
    );
  }
}