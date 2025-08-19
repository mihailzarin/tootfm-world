// app/api/party/create/route.ts
// Create a new party with fallback to old system

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
    const body = await request.json();
    const { name, description, userId: bodyUserId } = body;

    // Try multiple ways to get user ID
    let userId = request.cookies.get('tootfm_uid')?.value || bodyUserId;
    
    // If no userId, try to find by World ID
    if (!userId && body.worldId) {
      const user = await prisma.user.findUnique({
        where: { worldId: body.worldId },
        select: { id: true }
      });
      
      if (user) {
        userId = user.id;
      }
    }
    
    // If still no user, create a temporary one from World ID
    if (!userId && body.worldId) {
      const newUser = await prisma.user.create({
        data: {
          worldId: body.worldId,
          primaryId: `usr_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`,
          displayName: 'Party Host',
          level: 'guest',
          verified: true
        }
      });
      userId = newUser.id;
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

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
