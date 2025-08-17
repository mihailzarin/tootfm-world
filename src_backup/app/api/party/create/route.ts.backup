import { NextRequest, NextResponse } from 'next/server';

// Временное хранилище в памяти (пока без БД)
const parties = new Map();

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

    if (!hostWorldId || !name) {
      return NextResponse.json(
        { error: 'Name and World ID required' },
        { status: 400 }
      );
    }

    const partyId = `party_${Date.now()}`;
    const partyCode = generateCode();
    
    const party = {
      id: partyId,
      code: partyCode,
      name: name,
      hostWorldId: hostWorldId,
      status: 'WAITING',
      createdAt: new Date().toISOString(),
      participants: 1
    };

    parties.set(partyCode, party);
    
    console.log('Party created:', party);

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
  return NextResponse.json({
    status: 'Party API is working',
    parties: parties.size
  });
}
