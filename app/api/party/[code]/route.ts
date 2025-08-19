import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase();
    
    console.log('Fetching party:', code);

    const party = await prisma.party.findUnique({
      where: { code },
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

    if (!party) {
      return NextResponse.json({
        success: false,
        error: 'Party not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        description: party.description,
        isActive: party.isActive,
        creator: party.creator,
        memberCount: party._count.members,
        trackCount: party._count.tracks,
        createdAt: party.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching party:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch party'
    }, { status: 500 });
  }
}