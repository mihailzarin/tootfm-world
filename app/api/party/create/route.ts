import { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG, getCookieOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

function generatePartyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * (chars.length)));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, isPublic = false } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Party name is required' },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: 'Party name must be 50 characters or less' },
        { status: 400 }
      );
    }

    console.log('Creating party:', { name });

    // Get user ID from cookies using centralized configuration
    let userId = request.cookies.get(AUTH_CONFIG.COOKIES.USER_ID)?.value;
    const worldId = body.worldId || request.headers.get('x-world-id') || `guest_${Date.now()}`;
    
    // Find or create user
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
          verified: false,
          level: 'guest'
        }
      });
      console.log('Created new user:', user.id);
    }

    // Generate unique party code
    let code = generatePartyCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const existing = await prisma.party.findUnique({
        where: { code }
      });
      
      if (!existing) break;
      
      code = generatePartyCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique party code. Please try again.' },
        { status: 500 }
      );
    }

    // Create party
    const party = await prisma.party.create({
      data: {
        code,
        name: name.trim(),
        description: description?.trim() || '',
        isActive: true,
        isPublic: isPublic,
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

    // Set user ID cookie if not already set
    if (user.id && !userId) {
      response.cookies.set(AUTH_CONFIG.COOKIES.USER_ID, user.id, {
        ...getCookieOptions(true),
        maxAge: AUTH_CONFIG.EXPIRATION.SESSION
      });
    }

    // Set last party code cookie
    response.cookies.set('last_party_code', party.code, {
      ...getCookieOptions(false),
      maxAge: 60 * 60 * 24 * 7 // 7 days
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
      { error: errorMessage },
      { status: 500 }
    );
  }
}
