// app/api/party/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AUTH_CONFIG, getCookieOptions } from '@/lib/auth/config';

// GET - get party information
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    console.log('📍 Getting party:', code);

    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatar: true
              }
            }
          }
        },
        tracks: {
          orderBy: {
            voteCount: 'desc'
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
      party
    });

  } catch (error) {
    console.error('Error fetching party:', error);
    return NextResponse.json(
      { error: 'Failed to fetch party' },
      { status: 500 }
    );
  }
}

// POST - create new party
export async function POST(request: NextRequest) {
  try {
    console.log('🎉 Creating new party...');
    
    // Get user ID from cookies using centralized configuration
    const userCookieId = request.cookies.get(AUTH_CONFIG.COOKIES.USER_ID)?.value;
    
    if (!userCookieId) {
      console.error('❌ No user cookie found');
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    console.log('🔍 Looking for user with worldId:', userCookieId);

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { worldId: userCookieId }
    });

    if (!user) {
      console.log('👤 User not found, creating new user...');
      
      // Get data from cookie
      const googleUserCookie = request.cookies.get(AUTH_CONFIG.COOKIES.GOOGLE_USER)?.value;
      let googleUser = null;
      
      if (googleUserCookie) {
        try {
          googleUser = JSON.parse(googleUserCookie);
          console.log('📧 Google user data:', googleUser.email);
        } catch (e) {
          console.error('Failed to parse google_user cookie');
        }
      }

      // Create user
      user = await prisma.user.create({
        data: {
          worldId: userCookieId,
          googleId: userCookieId.replace('google_', ''),
          email: googleUser?.email,
          displayName: googleUser?.name || 'Party Host',
          avatar: googleUser?.picture,
          verified: true,
          level: 'verified'
        }
      });
      console.log('✅ User created:', user.id);
    } else {
      console.log('✅ Found existing user:', user.id);
    }

    // Get code from request body
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ 
        error: 'Party code is required' 
      }, { status: 400 });
    }

    // Check if code is already taken
    const existingParty = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingParty) {
      return NextResponse.json({ 
        error: 'This party code is already taken' 
      }, { status: 409 });
    }

    // Create party
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

// PUT - join party
export async function PUT(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const userCookieId = request.cookies.get(AUTH_CONFIG.COOKIES.USER_ID)?.value;
    
    if (!userCookieId) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Find user
    let user = await prisma.user.findUnique({
      where: { worldId: userCookieId }
    });

    if (!user) {
      // Create user if not exists
      const googleUserCookie = request.cookies.get(AUTH_CONFIG.COOKIES.GOOGLE_USER)?.value;
      let googleUser = null;
      
      if (googleUserCookie) {
        try {
          googleUser = JSON.parse(googleUserCookie);
        } catch (e) {
          console.error('Failed to parse google_user cookie');
        }
      }

      user = await prisma.user.create({
        data: {
          worldId: userCookieId,
          googleId: userCookieId.replace('google_', ''),
          email: googleUser?.email,
          displayName: googleUser?.name || 'Party Guest',
          avatar: googleUser?.picture,
          verified: true,
          level: 'verified'
        }
      });
    }

    // Find party
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
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

    // Add member
    await prisma.partyMember.create({
      data: {
        userId: user.id,
        partyId: party.id,
        role: party.creatorId === user.id ? 'host' : 'member'
      }
    });

    console.log('✅ User', user.displayName, 'joined party', party.code);

    // Return updated party
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

// DELETE - delete party
export async function DELETE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const userCookieId = request.cookies.get(AUTH_CONFIG.COOKIES.USER_ID)?.value;
    
    if (!userCookieId) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { worldId: userCookieId }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Find party
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator
    if (party.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Only the party creator can delete it' },
        { status: 403 }
      );
    }

    // Delete party (cascade will handle related records)
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