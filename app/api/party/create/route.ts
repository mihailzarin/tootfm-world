// app/api/party/create/route.ts
// Create a new party

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generatePartyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userId = request.cookies.get('tootfm_uid')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Party name is required' },
        { status: 400 }
      );
    }

    // Generate unique code
    let code = generatePartyCode();
    let attempts = 0;
    
    while (attempts < 10) {
      const existing = await prisma.party.findUnique({
        where: { code }
      });
      
      if (!existing) break;
      
      code = generatePartyCode();
      attempts++;
    }

    // Create party
    const party = await prisma.party.create({
      data: {
        code,
        name: name.trim(),
        description: description?.trim(),
        creatorId: userId
      }
    });

    console.log('✅ Party created:', party.code, party.name);

    return NextResponse.json({
      success: true,
      party
    });
    
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    );
  }
}
