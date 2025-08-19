import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query params for future geo-sorting
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    console.log('Discovering parties', lat && lng ? `near ${lat},${lng}` : 'globally');
    
    // For now, just return recent active parties
    // TODO: Add geo-sorting when we have location data
    const parties = await prisma.party.findMany({
      where: {
        isActive: true,
        // TODO: Add visibility check when we add public/private
        // visibility: 'public'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      include: {
        creator: {
          select: {
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

    const formattedParties = parties.map(party => ({
      code: party.code,
      name: party.name,
      description: party.description,
      memberCount: party._count.members,
      trackCount: party._count.tracks,
      createdAt: party.createdAt,
      // TODO: Calculate real distance when we have locations
      distance: null
    }));

    console.log(`Found ${formattedParties.length} active parties`);

    return NextResponse.json({
      success: true,
      parties: formattedParties
    });

  } catch (error) {
    console.error('Error discovering parties:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load parties',
      parties: [] // Return empty array as fallback
    }, { status: 500 });
  }
}