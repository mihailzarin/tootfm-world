// app/api/party/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';  // Используем singleton

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

    console.log('Creating party:', { name });

    // Проверяем сессию Google
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: 'Please sign in with Google to create a party' 
      }, { status: 401 });
    }

    // Получаем пользователя из БД по email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('❌ User not found:', session.user.email);
      return NextResponse.json({ 
        error: 'User not found. Please sign in again.' 
      }, { status: 404 });
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
        isActive: true,
        creatorId: user.id,
        maxMembers: 50,
        votingEnabled: false,
        partyRadio: false
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
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

    // Добавляем создателя как HOST
    await prisma.partyMember.create({
      data: {
        partyId: party.id,
        userId: user.id,
        role: 'HOST'
      }
    });

    console.log('✅ Party created successfully:', party.code, 'by', user.name);

    const response = NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        description: party.description,
        isActive: party.isActive,
        createdAt: party.createdAt,
        memberCount: party._count.members + 1, // +1 для HOST
        trackCount: party._count.tracks,
        creator: {
          id: party.creator.id,
          name: party.creator.name
        },
        shareUrl: `/party/${party.code}`
      }
    });

    // Сохраняем последний код party в cookies для удобства
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
      } else if (errorMessage.includes('prepared statement')) {
        errorMessage = 'Database connection issue. Please refresh and try again.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}