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
      where: { email: session.user.email },
      include: { musicProfile: true }
    });

    if (!user?.musicProfile) {
      return NextResponse.json({ error: "Music profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      musicPersonality: user.musicProfile.musicPersonality,
      dominantGenres: user.musicProfile.dominantGenres,
      energyLevel: user.musicProfile.energyLevel,
      diversityScore: user.musicProfile.diversityScore,
      mainstreamScore: user.musicProfile.mainstreamScore,
      unifiedTopTracks: user.musicProfile.unifiedTopTracks,
      unifiedTopArtists: user.musicProfile.unifiedTopArtists
    });
  } catch (error) {
    console.error("Error fetching music profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}