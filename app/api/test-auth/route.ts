import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Test Auth] Error:', error);
    return NextResponse.json({ 
      error: 'Authentication test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}