import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    // Получаем вечеринки, где пользователь является участником
    const memberships = await prisma.partyMember.findMany({
      where: { userId: user.id },
      include: {
        party: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            createdAt: true,
            totalMembers: true,
            totalTracks: true,
            playlistGenerated: true,
            votingEnabled: true,
            partyRadio: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const parties = memberships.map(membership => ({
      id: membership.party.id,
      code: membership.party.code,
      name: membership.party.name,
      description: membership.party.description,
      createdAt: membership.party.createdAt,
      totalMembers: membership.party.totalMembers,
      totalTracks: membership.party.totalTracks,
      playlistGenerated: membership.party.playlistGenerated,
      votingEnabled: membership.party.votingEnabled,
      partyRadio: membership.party.partyRadio,
      role: membership.role
    }));

    return NextResponse.json(parties);
  } catch (error) {
    console.error("Error fetching user parties:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}