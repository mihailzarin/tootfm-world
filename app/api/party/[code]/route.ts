import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: {
          include: {
            user: true
          }
        },
        tracks: {
          orderBy: {
            voteCount: 'desc'
          }
        },
        creator: true,
        // Добавляем подсчет для правильного отображения количества участников
        _count: {
          select: {
            members: true,
            tracks: true
          }
        }
      }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // ИСПРАВЛЕНО: Возвращаем party в обертке, как ожидает клиент
    return NextResponse.json({ party });
  } catch (error) {
    console.error('Error fetching party:', error);
    return NextResponse.json(
      { error: 'Failed to fetch party' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎉 Joining party...');
    
    const body = await request.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: true,
        _count: {
          select: {
            members: true,
            tracks: true
          }
        }
      }
    });
    
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }
    
    // ИСПРАВЛЕНО: используем findFirst вместо findUnique
    const existingMember = await prisma.partyMember.findFirst({
      where: {
        userId: user.id,
        partyId: party.id
      }
    });
    
    if (existingMember) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already a member',
        party 
      });
    }
    
    if (party.members.length >= party.maxMembers) {
      return NextResponse.json({ error: 'Party is full' }, { status: 400 });
    }
    
    await prisma.partyMember.create({
      data: {
        partyId: party.id,
        userId: user.id,
        role: 'MEMBER'
      }
    });
    
    await prisma.party.update({
      where: { id: party.id },
      data: { totalMembers: { increment: 1 } }
    });
    
    // Получаем обновленные данные party с новым участником
    const updatedParty = await prisma.party.findUnique({
      where: { id: party.id },
      include: {
        members: {
          include: {
            user: true
          }
        },
        tracks: {
          orderBy: {
            voteCount: 'desc'
          }
        },
        creator: true,
        _count: {
          select: {
            members: true,
            tracks: true
          }
        }
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Successfully joined party',
      party: updatedParty
    });
    
  } catch (error) {
    console.error('Error joining party:', error);
    return NextResponse.json(
      { error: 'Failed to join party' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });
    
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }
    
    if (party.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only creator can delete party' }, { status: 403 });
    }
    
    await prisma.party.delete({
      where: { code: code.toUpperCase() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting party:', error);
    return NextResponse.json(
      { error: 'Failed to delete party' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() }
    });
    
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }
    
    if (party.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only creator can update party' }, { status: 403 });
    }
    
    const updated = await prisma.party.update({
      where: { code: code.toUpperCase() },
      data: {
        name: body.name || party.name,
        description: body.description !== undefined ? body.description : party.description,
        votingEnabled: body.votingEnabled !== undefined ? body.votingEnabled : party.votingEnabled,
        partyRadio: body.partyRadio !== undefined ? body.partyRadio : party.partyRadio,
        maxMembers: body.maxMembers || party.maxMembers
      },
      include: {
        members: {
          include: {
            user: true
          }
        },
        tracks: {
          orderBy: {
            voteCount: 'desc'
          }
        },
        creator: true,
        _count: {
          select: {
            members: true,
            tracks: true
          }
        }
      }
    });
    
    // ИСПРАВЛЕНО: Возвращаем в правильном формате
    return NextResponse.json({ party: updated });
  } catch (error) {
    console.error('Error updating party:', error);
    return NextResponse.json(
      { error: 'Failed to update party' },
      { status: 500 }
    );
  }
}