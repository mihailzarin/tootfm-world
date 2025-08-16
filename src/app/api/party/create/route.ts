import { NextRequest, NextResponse } from 'next/server';

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

    // Временно: создаем party без БД
    const party = {
      id: `party_${Date.now()}`,
      code: generateCode(),
      name: name,
      hostWorldId: hostWorldId,
      createdAt: new Date().toISOString(),
      participants: 1
    };

    console.log('🎉 Party created:', party);

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        participants: party.participants
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
