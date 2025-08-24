import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userToken } = await request.json();
    
    if (!userToken) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // Сохраняем или обновляем Apple Music сервис
    await prisma.musicService.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'APPLE'
        }
      },
      update: {
        appleToken: userToken,
        isActive: true,
        lastSynced: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'APPLE',
        appleToken: userToken,
        isActive: true
      }
    });

    console.log('✅ Apple Music connected for user:', session.user.id);

    return NextResponse.json({ 
      success: true,
      message: 'Apple Music connected successfully'
    });
    
  } catch (error) {
    console.error('Apple Music connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect Apple Music' },
      { status: 500 }
    );
  }
}
