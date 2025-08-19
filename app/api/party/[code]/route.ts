import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();
    
    console.log('🔍 Fetching party with code:', code);

    const party = await prisma.party.findUnique({
      where: { 
        code,
        isActive: true  // Only show active parties
      },
      include: {
        creator: {
          select: {
            id: true,
            worldId: true,
            displayName: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                worldId: true,
                displayName: true
              }
            }
          }
        },
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
            }
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

    if (!party) {
      console.log('❌ Party not found:', code);
      
      // Check if party exists but is inactive
      const inactiveParty = await prisma.party.findUnique({
        where: { code }
      });
      
      if (inactiveParty && !inactiveParty.isActive) {
        return NextResponse.json({
          success: false,
          error: 'This party has ended'
        }, { status: 410 }); // 410 Gone
      }
      
      return NextResponse.json({
        success: false,
        error: 'Party not found'
      }, { status: 404 });
    }

    console.log('✅ Party found:', {
      code: party.code,
      name: party.name,
      members: party._count.members,
      tracks: party._count.tracks
    });

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        description: party.description,
        isActive: party.isActive,
        creator: party.creator,
        members: party.members,
        tracks: party.tracks,
        memberCount: party._count.members,
        trackCount: party._count.tracks,
        createdAt: party.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error fetching party:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch party'
    }, { status: 500 });
  }
}