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
      where: { email: session.user.email },
      include: { musicServices: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Проверяем, есть ли подключенные сервисы
    const activeServices = user.musicServices.filter(service => service.isActive);
    
    if (activeServices.length === 0) {
      return NextResponse.json({ 
        error: "No music services connected. Please connect at least one service first." 
      }, { status: 400 });
    }

    // Здесь будет логика анализа данных из всех сервисов
    // Пока создаем базовый профиль
    const musicProfile = await prisma.musicProfile.upsert({
      where: { userId: user.id },
      update: {
        musicPersonality: "Eclectic Explorer 🌐",
        dominantGenres: ["indie rock", "electronic", "pop"],
        energyLevel: 75.0,
        diversityScore: 85.0,
        mainstreamScore: 45.0,
        unifiedTopTracks: [
          {
            name: "Bohemian Rhapsody",
            artist: "Queen",
            sources: ["spotify", "lastfm"],
            popularity: 95
          },
          {
            name: "Hotel California",
            artist: "Eagles",
            sources: ["spotify"],
            popularity: 90
          }
        ],
        unifiedTopArtists: [
          { name: "Queen", sources: ["spotify", "lastfm"] },
          { name: "Eagles", sources: ["spotify"] }
        ],
        lastAnalyzed: new Date()
      },
      create: {
        userId: user.id,
        musicPersonality: "Eclectic Explorer 🌐",
        dominantGenres: ["indie rock", "electronic", "pop"],
        energyLevel: 75.0,
        diversityScore: 85.0,
        mainstreamScore: 45.0,
        unifiedTopTracks: [
          {
            name: "Bohemian Rhapsody",
            artist: "Queen",
            sources: ["spotify", "lastfm"],
            popularity: 95
          },
          {
            name: "Hotel California",
            artist: "Eagles",
            sources: ["spotify"],
            popularity: 90
          }
        ],
        unifiedTopArtists: [
          { name: "Queen", sources: ["spotify", "lastfm"] },
          { name: "Eagles", sources: ["spotify"] }
        ]
      }
    });

    return NextResponse.json({
      musicPersonality: musicProfile.musicPersonality,
      dominantGenres: musicProfile.dominantGenres,
      energyLevel: musicProfile.energyLevel,
      diversityScore: musicProfile.diversityScore,
      mainstreamScore: musicProfile.mainstreamScore,
      unifiedTopTracks: musicProfile.unifiedTopTracks,
      unifiedTopArtists: musicProfile.unifiedTopArtists
    });
  } catch (error) {
    console.error("Error generating music profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}