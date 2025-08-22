import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    };
    
    return NextResponse.json({
      status: 'ok',
      session: session || null,
      envCheck,
      spotifyRedirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/spotify`,
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: (error as Error).message
    }, { status: 500 });
  }
}