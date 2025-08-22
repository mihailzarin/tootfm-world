// app/api/party/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const party = await prisma.party.findUnique({
      where: { code: params.code.toUpperCase() },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        tracks: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    // Проверяем, является ли пользователь участником
    const isMember = party.members.some(member => member.userId === user.id);
    
    if (!isMember) {
      return NextResponse.json({ error: "Not a member of this party" }, { status: 403 });
    }

    return NextResponse.json({
      id: party.id,
      code: party.code,
      name: party.name,
      description: party.description,
      creatorId: party.creatorId,
      isActive: party.isActive,
      maxMembers: party.maxMembers,
      votingEnabled: party.votingEnabled,
      partyRadio: party.partyRadio,
      playlistGenerated: party.playlistGenerated,
      totalMembers: party.totalMembers,
      totalTracks: party.totalTracks,
      totalVotes: party.totalVotes,
      members: party.members,
      tracks: party.tracks
    });
  } catch (error) {
    console.error("Error fetching party:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - создать новую party
export async function POST(request: NextRequest) {
  try {
    console.log('🎉 Creating new party...');
    
    // Получаем userId из cookies
    const userCookieId = request.cookies.get('tootfm_user_id')?.value;
    
    if (!userCookieId) {
      console.error('❌ No user cookie found');
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    console.log('🔍 Looking for user with worldId:', userCookieId);

    // Находим или создаём пользователя в БД
    let user = await prisma.user.findUnique({
      where: { worldId: userCookieId }
    });

    if (!user) {
      console.log('👤 User not found, creating new user...');
      
      // Получаем данные из cookie
      const googleUserCookie = request.cookies.get('google_user')?.value;
      let googleUser = null;
      
      if (googleUserCookie) {
        try {
          googleUser = JSON.parse(googleUserCookie);
          console.log('📧 Google user data:', googleUser.email);
        } catch (e) {
          console.error('Failed to parse google_user cookie');
        }
      }

      // Создаём пользователя
      user = await prisma.user.create({
        data: {
          worldId: userCookieId,
          googleId: userCookieId.replace('google_', ''),
          email: googleUser?.email,
          displayName: googleUser?.name || 'Party Host',
          avatar: googleUser?.picture,
          verified: true
        }
      });
      console.log('✅ User created:', user.id);
    } else {
      console.log('✅ Found existing user:', user.id);
    }

    // Получаем код из тела запроса
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ 
        error: 'Party code is required' 
      }, { status: 400 });
    }

    // Проверяем, не занят ли код
    const existingParty = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingParty) {
      return NextResponse.json({ 
        error: 'This party code is already taken' 
      }, { status: 409 });
    }

    // Создаём party
    const party = await prisma.party.create({
      data: {
        code: code.toUpperCase(),
        name: `${user.displayName}'s Party`,
        description: 'Music democracy in action! Everyone gets one vote per track.',
        creatorId: user.id,
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    console.log('🎉 Party created:', party.code, 'by user:', user.displayName);

    return NextResponse.json({
      success: true,
      party
    });

  } catch (error) {
    console.error('❌ Error creating party:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create party',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - обновить party (присоединиться к party)
export async function PUT(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const userCookieId = request.cookies.get('tootfm_user_id')?.value;
    
    if (!userCookieId) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Находим пользователя
    let user = await prisma.user.findUnique({
      where: { worldId: userCookieId }
    });

    if (!user) {
      // Создаём пользователя если его нет
      const googleUserCookie = request.cookies.get('google_user')?.value;
      let googleUser = null;
      
      if (googleUserCookie) {
        try {
          googleUser = JSON.parse(googleUserCookie);
        } catch (e) {}
      }

      user = await prisma.user.create({
        data: {
          worldId: userCookieId,
          googleId: userCookieId.replace('google_', ''),
          email: googleUser?.email,
          displayName: googleUser?.name || 'Party Guest',
          avatar: googleUser?.picture,
          verified: true
        }
      });
    }

    // Находим party
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Проверяем, не является ли пользователь уже участником
    const existingMember = await prisma.partyMember.findUnique({
      where: {
        userId_partyId: {
          userId: user.id,
          partyId: party.id
        }
      }
    });

    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: 'Already a member',
        party
      });
    }

    // Добавляем участника
    await prisma.partyMember.create({
      data: {
        userId: user.id,
        partyId: party.id,
        role: party.creatorId === user.id ? 'host' : 'member'
      }
    });

    console.log('✅ User', user.displayName, 'joined party', party.code);

    // Возвращаем обновлённую party
    const updatedParty = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        creator: true,
        members: {
          include: {
            user: true
          }
        },
        tracks: true
      }
    });

    return NextResponse.json({
      success: true,
      party: updatedParty
    });

  } catch (error) {
    console.error('Error updating party:', error);
    return NextResponse.json(
      { error: 'Failed to update party' },
      { status: 500 }
    );
  }
}

// DELETE - удалить party
export async function DELETE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const userCookieId = request.cookies.get('tootfm_user_id')?.value;
    
    if (!userCookieId) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { worldId: userCookieId }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Находим party
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Проверяем, является ли пользователь создателем
    if (party.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Only the party creator can delete it' },
        { status: 403 }
      );
    }

    // Удаляем party (связанные записи удалятся каскадно)
    await prisma.party.delete({
      where: { id: party.id }
    });

    console.log('🗑️ Party', party.code, 'deleted by', user.displayName);

    return NextResponse.json({
      success: true,
      message: 'Party deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting party:', error);
    return NextResponse.json(
      { error: 'Failed to delete party' },
      { status: 500 }
    );
  }
}