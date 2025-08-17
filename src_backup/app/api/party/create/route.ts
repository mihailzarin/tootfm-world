import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';
  
  for (let i = 0; i < 3; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 3; i++) {
    code += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, hostWorldId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name required' },
        { status: 400 }
      );
    }

    const worldId = hostWorldId || `demo_${Date.now()}`;

    let user = await prisma.user.findUnique({
      where: { worldId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          worldId,
          displayName: `Host_${worldId.slice(0, 6)}`
        }
      });
    }

    const party = await prisma.party.create({
      data: {
        name,
        code: generateCode(),
        hostId: user.id,
        status: 'WAITING'
      }
    });

    await prisma.participant.create({
      data: {
        userId: user.id,
        partyId: party.id
      }
    });

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name
      }
    });

  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const parties = await prisma.party.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        host: true,
        _count: {
          select: { participants: true }
        }
      }
    });

    return NextResponse.json({ 
      status: 'Party API working',
      parties: parties.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        host: p.host.displayName,
        participants: p._count.participants,
        created: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json({ 
      status: 'Party API working',
      parties: [],
      error: 'Database connection issue'
    });
  }
}
