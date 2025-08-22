import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("🎵 Fetching music profile...");
    
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      console.log("❌ No session or email found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Looking for user:", session.user.email);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { musicProfile: true }
    });

    if (!user) {
      console.log("❌ User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.musicProfile) {
      console.log("ℹ️ No music profile found for user");
      return NextResponse.json({ error: "Music profile not found" }, { status: 404 });
    }

    console.log("✅ Music profile found, returning data");

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
    console.error("❌ Error fetching music profile:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}