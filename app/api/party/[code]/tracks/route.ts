// app/api/party/[code]/tracks/route.ts
// API endpoint для добавления треков в party

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    
    console.log('🎵 Adding track to party:', code);

    // Получаем ID пользователя из cookies или создаём гостевой
    let userId = request.cookies.get('world_id')?.value;
    
    if (!userId) {
      // Для гостей используем guest ID
      userId = request.cookies.get('guest_id')?.value;
      
      if (!userId) {
        // Создаём нового гостя
        userId = `guest_${Math.random().toString(36).substring(2, 15)}`;
        console.log('📝 Creating guest user:', userId);
      }
    }

    // Проверяем существование party
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Получаем или создаём пользователя
    let user = await prisma.user.findUnique({
      where: { worldId: userId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          worldId: userId,
          verified: !userId.startsWith('guest_'),
          displayName: userId.startsWith('guest_') ? 'Guest' : null
        }
      });
      console.log('✅ Created new user:', userId);
    }

    // Проверяем, является ли пользователь участником party
    let member = await prisma.partyMember.findUnique({
      where: {
        userId_partyId: {
          userId: user.id,
          partyId: party.id
        }
      }
    });

    if (!member) {
      // Добавляем пользователя как участника
      member = await prisma.partyMember.create({
        data: {
          userId: user.id,
          partyId: party.id,
          role: 'member'
        }
      });
      console.log('✅ Added user as party member');
    }

    // Проверяем, не добавлен ли уже этот трек
    const existingTrack = await prisma.track.findFirst({
      where: {
        spotifyId: body.spotifyId,
        partyId: party.id
      }
    });

    if (existingTrack) {
      console.log('⚠️ Track already exists in party');
      return NextResponse.json({
        success: true,
        track: existingTrack,
        message: 'Track already in playlist'
      });
    }

    // Добавляем трек
    const track = await prisma.track.create({
      data: {
        spotifyId: body.spotifyId,
        name: body.name,
        artist: body.artist,
        album: body.album || null,
        albumArt: body.albumArt || null,
        duration: body.duration || 180000,
        partyId: party.id,
        addedById: user.id,
        voteCount: 0
      },
      include: {
        addedBy: {
          select: {
            displayName: true,
            worldId: true
          }
        }
      }
    });

    console.log('✅ Track added successfully:', track.name);

    // Если это гостевой пользователь, сохраняем guest_id в cookies
    const response = NextResponse.json({
      success: true,
      track
    });

    if (userId.startsWith('guest_') && !request.cookies.get('guest_id')) {
      response.cookies.set('guest_id', userId, {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 дней
      });
    }

    return response;

  } catch (error) {
    console.error('❌ Error adding track:', error);
    return NextResponse.json(
      { error: 'Failed to add track' },
      { status: 500 }
    );
  }
}

// GET endpoint для получения треков party
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        tracks: {
          orderBy: {
            voteCount: 'desc'
          },
          include: {
            addedBy: {
              select: {
                displayName: true,
                worldId: true
              }
            },
            votes: {
              select: {
                userId: true,
                value: true
              }
            }
          }
        }
      }
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tracks: party.tracks
    });

  } catch (error) {
    console.error('❌ Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
