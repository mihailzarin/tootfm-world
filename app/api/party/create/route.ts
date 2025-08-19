import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Генерация уникального 6-символьного кода
function generatePartyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, isPublic = false } = body;

    console.log('🎵 Creating party:', { name, isPublic });

    // Пытаемся получить user ID разными способами
    let userId = request.cookies.get('tootfm_uid')?.value;
    let worldId = body.worldId || request.headers.get('x-world-id');
    
    // Если есть World ID, находим пользователя
    if (worldId && !userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { worldId },
          select: { id: true }
        });
        
        if (user) {
          userId = user.id;
        }
      } catch (e) {
        console.log('User lookup failed:', e);
      }
    }

    // Если нет userId, создаём гостевого пользователя
    if (!userId) {
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      try {
        const guestUser = await prisma.user.create({
          data: {
            worldId: guestId,
            displayName: 'Party Host'
          }
        });
        userId = guestUser.id;
        console.log('Created guest user:', userId);
      } catch (e) {
        console.error('Failed to create guest user:', e);
        // Используем существующего гостя если есть
        const existingGuest = await prisma.user.findFirst({
          where: {
            worldId: {
              startsWith: 'guest_'
            }
          }
        });
        
        if (existingGuest) {
          userId = existingGuest.id;
        } else {
          throw new Error('Cannot create user');
        }
      }
    }

    // Генерируем уникальный код
    let code = generatePartyCode();
    let attempts = 0;
    
    while (attempts < 10) {
      const existing = await prisma.party.findUnique({
        where: { code }
      });
      
      if (!existing) break;
      
      code = generatePartyCode();
      attempts++;
    }

    // Создаём party
    const party = await prisma.party.create({
      data: {
        code,
        name: name || `Party ${code}`,
        description: description || '',
        isPublic,
        creatorId: userId,
        currentTrackId: null
      },
      include: {
        creator: {
          select: {
            id: true,
            worldId: true,
            displayName: true
          }
        },
        _count: {
          select: {
            members: true,
            tracks: true
          }
        }
      }
    });

    console.log('✅ Party created successfully:', party.code);

    // Возвращаем успешный ответ
    const response = NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        description: party.description,
        createdAt: party.createdAt,
        memberCount: party._count.members,
        trackCount: party._count.tracks,
        creator: party.creator
      }
    });

    // Сохраняем userId в cookie если создали нового пользователя
    if (userId && !request.cookies.get('tootfm_uid')) {
      response.cookies.set('tootfm_uid', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 дней
      });
    }

    // Сохраняем последний код party
    response.cookies.set('last_party_code', party.code, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 дней
    });

    return response;

  } catch (error) {
    console.error('❌ Error creating party:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create party. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
