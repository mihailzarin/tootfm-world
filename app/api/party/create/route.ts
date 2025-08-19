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
    const { name, description, userId } = body;

    console.log('Creating party:', { name, description, userId });

    // Validate input
    if (!name || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Party name and user ID are required'
      }, { status: 400 });
    }

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { worldId: userId }
    });

    if (!user) {
      console.log('Creating new user:', userId);
      user = await prisma.user.create({
        data: {
          worldId: userId,
          verified: true
        }
      });
    }

    // Generate unique party code
    let code = generatePartyCode();
    let attempts = 0;
    
    // Ensure code is unique
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
        creator: true,
        _count: {
          select: {
            members: true,
            tracks: true
          }
        }
      }
    });

    console.log('✅ Party created successfully:', party.code);

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        description: party.description,
        isActive: party.isActive,
        creatorId: party.creatorId,
        memberCount: party._count.members,
        trackCount: party._count.tracks,
        createdAt: party.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating party:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create party'
    }, { status: 500 });
  }
}