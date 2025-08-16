import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';
  
  for (let i = 0; i < 3; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 3; i++) {
    code += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, hostWorldId } = body;

    if (!hostWorldId || !name) {
      return NextResponse.json(
        { error: 'Name and World ID required' },
        { status: 400 }
      );
    }

    // Находим или создаем пользователя
    let user = await prisma.user.findUnique({
      where: { worldId: hostWorldId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          worldId: hostWorldId,
          displayName: `Host_${hostWorldId.slice(0, 6)}`
        }
      });
    }

    // Создаем party
    const party = await prisma.party.create({
      data: {
        name,
        code: generateCode(),
        hostId: user.id,
        status: 'WAITING'
      }
    });

    // Добавляем хоста как участника
    await prisma.participant.create({
      data: {
        userId: user.id,
        partyId: party.id
      }
    });

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name
      }
    });

  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    );
  }
}
