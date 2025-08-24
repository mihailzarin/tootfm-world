import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ connected: false });
    }

    const musicService = await prisma.musicService.findFirst({
      where: {
        userId: session.user.id,
        service: 'APPLE',
        isActive: true
      }
    });

    return NextResponse.json({ 
      connected: !!musicService?.appleToken 
    });
  } catch (error) {
    return NextResponse.json({ connected: false });
  }
}
