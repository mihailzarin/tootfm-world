import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

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
    await prisma.$connect();
    
    const body = await request.json();
    const { name, description, isPublic = false } = body;

    console.log('Creating party:', { name });

    // Получаем или создаём пользователя
    let userId = request.cookies.get('tootfm_uid')?.value;
    const worldId = body.worldId || request.headers.get('x-world-id') || `guest_${Date.now()}`;
    
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId || '' },
          { worldId: worldId }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          worldId: worldId,
          displayName: 'Party Host',
          verified: true
        }
      });
      console.log('Created new user:', user.id);
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

    // Создаём party БЕЗ isPublic (используем isActive для публичности)
    const party = await prisma.party.create({
      data: {
        code,
        name: name || `Party ${code}`,
        description: description || '',
        isActive: true, // Вместо isPublic используем isActive
        creatorId: user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            worldId: true
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

    console.log('Party created successfully:', party.code);

    const response = NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        description: party.description,
        isActive: party.isActive,
        createdAt: party.createdAt,
        memberCount: party._count.members,
        trackCount: party._count.tracks,
        creator: party.creator
      }
    });

    if (user.id) {
      response.cookies.set('tootfm_uid', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });
    }

    response.cookies.set('last_party_code', party.code, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;

  } catch (error) {
    console.error('Error creating party:', error);
    
    let errorMessage = 'Failed to create party';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('P2002')) {
        errorMessage = 'Party code already exists. Please try again.';
      } else if (errorMessage.includes('P2021')) {
        errorMessage = 'Database table not found.';
      } else if (errorMessage.includes('P1001')) {
        errorMessage = 'Cannot connect to database.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
