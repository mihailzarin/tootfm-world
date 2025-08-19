import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate unique 6-character party code
function generatePartyCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, userId, worldId } = body;

    console.log('🎉 Creating party request:', { name, description, userId, worldId });

    // Validate input - only name is required
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Party name is required'
      }, { status: 400 });
    }

    // Determine the user identifier
    let userWorldId = worldId || userId;
    
    if (!userWorldId) {
      // Try to get from cookies
      const cookies = request.cookies;
      
      // Check for world_id from World ID auth
      const worldIdCookie = cookies.get('world_id')?.value;
      if (worldIdCookie) {
        userWorldId = worldIdCookie;
        console.log('Using world_id from cookie:', userWorldId);
      } else {
        // Check for guest_id
        const guestId = cookies.get('guest_id')?.value;
        if (guestId) {
          userWorldId = guestId;
          console.log('Using guest_id from cookie:', guestId);
        } else {
          // Generate a new guest ID
          userWorldId = `guest_${Math.random().toString(36).substring(2, 15)}`;
          console.log('Generated new guest ID:', userWorldId);
        }
      }
    }

    // Ensure we have a userWorldId
    if (!userWorldId) {
      userWorldId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log('Using anonymous ID:', userWorldId);
    }

    // Check if user exists by worldId, create if not
    let user = await prisma.user.findUnique({
      where: { worldId: userWorldId }
    });

    if (!user) {
      console.log('Creating new user with worldId:', userWorldId);
      
      const isGuest = userWorldId.startsWith('guest_') || userWorldId.startsWith('anon_');
      
      user = await prisma.user.create({
        data: {
          worldId: userWorldId,
          verified: !isGuest,
          displayName: isGuest ? 
            `Guest${Math.floor(Math.random() * 9999)}` : 
            undefined
        }
      });
      console.log('Created new user:', user.id);
    } else {
      console.log('Found existing user:', user.id);
    }

    // Generate unique party code
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

    if (attempts === 10) {
      throw new Error('Could not generate unique party code');
    }

    // Create party
    const party = await prisma.party.create({
      data: {
        code,
        name: name.trim(),
        description: description?.trim() || null,
        creatorId: user.id,
        isActive: true,
        members: {
          create: {
            userId: user.id,
            role: 'host'
          }
        }
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

    console.log('✅ Party created successfully:', {
      code: party.code,
      id: party.id,
      creatorId: party.creatorId,
      creatorWorldId: party.creator.worldId
    });

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        description: party.description,
        isActive: party.isActive,
        creatorId: party.creatorId,
        creator: party.creator,
        memberCount: party._count.members,
        trackCount: party._count.tracks,
        createdAt: party.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating party:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create party'
    }, { status: 500 });
  }
}