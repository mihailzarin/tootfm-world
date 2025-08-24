import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Деактивируем Apple Music сервис
    await prisma.musicService.updateMany({
      where: {
        userId: session.user.id,
        service: 'APPLE'
      },
      data: {
        isActive: false,
        appleToken: null
      }
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
