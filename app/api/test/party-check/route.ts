import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: {
          include: {
            user: {
              include: {
                musicProfile: true
              }
            }
          }
        },
        tracks: true
      }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    const stats = {
      partyName: party.name,
      code: party.code,
      totalMembers: party.members.length,
      membersWithProfile: party.members.filter(m => m.user.musicProfile).length,
      membersAnalyzed: party.members.filter(m => 
        m.user.musicProfile?.unifiedTopTracks !== null
      ).length,
      existingTracks: party.tracks.length,
      members: party.members.map(m => ({
        name: m.user.name,
        hasProfile: !!m.user.musicProfile,
        hasData: !!(m.user.musicProfile?.unifiedTopTracks)
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}