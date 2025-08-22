import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, maxMembers = 50, votingEnabled = false, partyRadio = false } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Party name is required" }, { status: 400 });
    }

    // Генерируем уникальный код
    let code: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      code = generateUniqueCode();
      const existingParty = await prisma.party.findUnique({
        where: { code }
      });
      
      if (!existingParty) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: "Failed to generate unique party code" }, { status: 500 });
    }

    // Создаем вечеринку
    const party = await prisma.party.create({
      data: {
        code: code!,
        name: name.trim(),
        description: description?.trim() || null,
        creatorId: user.id,
        maxMembers,
        votingEnabled,
        partyRadio,
        totalMembers: 1
      }
    });

    // Добавляем создателя как HOST
    await prisma.partyMember.create({
      data: {
        partyId: party.id,
        userId: user.id,
        role: 'HOST'
      }
    });

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join/${party.code}`
      }
    });
  } catch (error) {
    console.error("Error creating party:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
