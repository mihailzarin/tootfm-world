import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    console.log('Creating party:', name);

    // Создаём или находим дефолтного пользователя для тестирования
    let user = await prisma.user.findFirst({
      where: {
        worldId: 'default_user'
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          worldId: 'default_user',
          displayName: 'Party Host'
        }
      });
    }

    // Генерируем код
    let code = generatePartyCode();
    
    // Проверяем уникальность
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
        creatorId: user.id
      }
    });

    console.log('Party created:', party.code);

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        description: party.description
      }
    });

  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { 
        error: 'Database error. Please check connection.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
