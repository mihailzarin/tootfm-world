import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // Получаем пользователя из сессии
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ИСПРАВЛЕНО: используем findFirst вместо findUnique
    let member = await prisma.partyMember.findFirst({
      where: {
        userId: user.id,
        partyId: party.id
      }
    });

    // Если не член party - добавляем
    if (!member) {
      member = await prisma.partyMember.create({
        data: {
          userId: user.id,
          partyId: party.id,
          role: 'MEMBER'
        }
      });
    }

    // Добавляем трек
    const track = await prisma.track.create({
      data: {
        spotifyId: body.spotifyId || `manual-${Date.now()}`,
        name: body.name,
        artist: body.artist,
        album: body.album || null,
        albumArt: body.albumArt || null,
        duration: body.duration || 180000,
        previewUrl: body.previewUrl || null,
        partyId: party.id,
        sources: [user.id],
        matchScore: 1,
        position: body.position || 999,
        voteCount: 0
      }
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error('Error adding track:', error);
    return NextResponse.json(
      { error: 'Failed to add track' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        tracks: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    return NextResponse.json(party.tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
