import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AUTH_CONFIG } from '@/lib/auth/config';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const userId = request.cookies.get(AUTH_CONFIG.COOKIES.USER_ID)?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    if (!code) {
      return NextResponse.json({ error: 'Party code is required' }, { status: 400 });
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { worldId: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Find party
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });
    
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }
    
    // Check if already member
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
        partyId: party.id,
        party: {
          id: party.id,
          code: party.code,
          name: party.name,
          creator: party.creator
        }
      });
    }
    
    // Add as member
    await prisma.partyMember.create({
      data: {
        userId: user.id,
        partyId: party.id,
        role: party.creatorId === user.id ? 'host' : 'member'
      }
    });
    
    console.log('✅ User', user.displayName, 'joined party', party.code);
    
    return NextResponse.json({ 
      success: true,
      partyId: party.id,
      code: party.code,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        creator: party.creator
      }
    });
    
  } catch (error) {
    console.error('Error joining party:', error);
    return NextResponse.json(
      { error: 'Failed to join party' },
      { status: 500 }
    );
  }
}