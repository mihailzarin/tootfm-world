import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Пробуем несколько способов получить user ID
    let userId = request.cookies.get('tootfm_uid')?.value;
    
    // Если нет userId, ищем по World ID из headers
    if (!userId) {
      const worldId = request.headers.get('x-world-id');
      if (worldId) {
        const user = await prisma.user.findUnique({
          where: { worldId },
          select: { id: true }
        });
        if (user) userId = user.id;
      }
    }
    
    // Возвращаем пустой массив если нет user
    if (!userId) {
      return NextResponse.json({ parties: [] });
    }

    const parties = await prisma.party.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            members: true,
            tracks: true
          }
        }
      }
    });

    return NextResponse.json({ parties });
    
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json({ parties: [] });
  }
}
