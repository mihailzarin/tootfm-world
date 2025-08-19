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

    // Получаем user ID разными способами
    let userId = request.cookies.get('tootfm_uid')?.value;
    let worldId = null;
    
    // Пробуем получить World ID из headers
    worldId = request.headers.get('x-world-id');
    
    // Если нет World ID в headers, ищем в cookies/localStorage через body
    if (!worldId && body.worldId) {
      worldId = body.worldId;
    }

    // Если есть World ID, находим или создаём пользователя
    if (worldId) {
      const user = await prisma.user.findUnique({
        where: { worldId },
        select: { id: true }
      });
      
      if (!user) {
        // Создаём нового пользователя
        console.log('Creating new user with World ID:', worldId);
        const newUser = await prisma.user.create({
          data: { 
            worldId,
            displayName: `User ${worldId.substring(0, 8)}`
          }
        });
        userId = newUser.id;
      } else {
        userId = user.id;
      }
    }

    // Если всё ещё нет userId, создаём временного пользователя
    if (!userId) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const tempUser = await prisma.user.create({
        data: {
          worldId: tempId,
          displayName: 'Guest User'
        }
      });
      userId = tempUser.id;
      
      // Сохраняем в cookie для последующих запросов
      const response = NextResponse.json({
        error: 'Please sign in to create a party'
      }, { status: 401 });
      
      response.cookies.set('tootfm_uid', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 дней
      });
      
      return response;
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

    // Сохраняем последний код party в cookie
    response.cookies.set('last_party_code', party.code, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 дней
    });

    return response;

  } catch (error) {
    console.error('❌ Error creating party:', error);
    
    // Проверяем специфичные ошибки Prisma
    if (error instanceof Error) {
      if (error.message.includes('P2002')) {
        return NextResponse.json(
          { error: 'Party code already exists. Please try again.' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create party. Please try again.' },
      { status: 500 }
    );
  }
}
