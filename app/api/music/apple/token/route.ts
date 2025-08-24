import { NextResponse } from 'next/server';
import { generateAppleMusicToken } from '@/lib/apple-music/token-generator';

export async function GET() {
  try {
    const token = generateAppleMusicToken();
    return NextResponse.json({ 
      success: true,
      token 
    });
  } catch (error: any) {
    console.error('Token generation failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}
