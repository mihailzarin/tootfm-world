import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        hasGoogleCreds: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        hasSpotifyCreds: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
      spotifyCallback: `${process.env.NEXTAUTH_URL}/api/auth/callback/spotify`
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: (error as Error).message
    }, { status: 500 });
  }
}