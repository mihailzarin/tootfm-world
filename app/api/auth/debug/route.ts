import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const cookieStore = cookies();
    
    // Проверяем все cookies связанные с авторизацией
    const authCookies = {
      sessionToken: cookieStore.get('next-auth.session-token')?.value || 
                     cookieStore.get('__Secure-next-auth.session-token')?.value,
      csrfToken: cookieStore.get('next-auth.csrf-token')?.value ||
                 cookieStore.get('__Host-next-auth.csrf-token')?.value,
      callbackUrl: cookieStore.get('next-auth.callback-url')?.value
    };
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      sessionData: session ? {
        email: session.user?.email,
        name: session.user?.name,
        id: (session.user as any)?.id
      } : null,
      cookies: {
        found: Object.values(authCookies).some(v => !!v),
        details: authCookies
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasGoogleCreds: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
