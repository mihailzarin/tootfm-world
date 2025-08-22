import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

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
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Party code is required" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: { members: true }
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    if (!party.isActive) {
      return NextResponse.json({ error: "Party is not active" }, { status: 400 });
    }

    if (party.members.length >= party.maxMembers) {
      return NextResponse.json({ error: "Party is full" }, { status: 400 });
    }

    // Проверяем, не участник ли уже
    const existingMember = party.members.find(m => m.userId === user.id);
    if (existingMember) {
      return NextResponse.json({ 
        success: true, 
        party: {
          id: party.id,
          code: party.code,
          name: party.name,
          description: party.description,
          creatorId: party.creatorId,
          isActive: party.isActive,
          maxMembers: party.maxMembers,
          votingEnabled: party.votingEnabled,
          partyRadio: party.partyRadio,
          playlistGenerated: party.playlistGenerated,
          totalMembers: party.totalMembers,
          totalTracks: party.totalTracks,
          totalVotes: party.totalVotes
        }
      });
    }

    // Добавляем участника
    await prisma.partyMember.create({
      data: {
        partyId: party.id,
        userId: user.id,
        role: 'MEMBER'
      }
    });

    // Обновляем счетчик
    await prisma.party.update({
      where: { id: party.id },
      data: { totalMembers: { increment: 1 } }
    });

    return NextResponse.json({
      success: true,
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        description: party.description,
        creatorId: party.creatorId,
        isActive: party.isActive,
        maxMembers: party.maxMembers,
        votingEnabled: party.votingEnabled,
        partyRadio: party.partyRadio,
        playlistGenerated: party.playlistGenerated,
        totalMembers: party.totalMembers + 1,
        totalTracks: party.totalTracks,
        totalVotes: party.totalVotes
      }
    });
  } catch (error) {
    console.error("Error joining party:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}