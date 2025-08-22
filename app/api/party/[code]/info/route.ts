import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const party = await prisma.party.findUnique({
      where: { code: params.code.toUpperCase() },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isActive: true,
        maxMembers: true,
        votingEnabled: true,
        partyRadio: true,
        totalMembers: true,
        totalTracks: true,
        totalVotes: true
      }
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    if (!party.isActive) {
      return NextResponse.json({ error: "Party is not active" }, { status: 400 });
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error("Error fetching party info:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}