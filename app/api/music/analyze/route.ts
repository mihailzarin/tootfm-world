// app/api/music/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Получаем сессию NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: 'Unauthorized - Please sign in'
      }, { status: 401 });
    }

    // Получаем пользователя из БД
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found'
      }, { status: 404 });
    }

    // Получаем данные анализа из тела запроса
    const analysisData = await request.json();
    
    console.log('💾 Saving music profile for user:', user.id);

    // Сохраняем или обновляем музыкальный профиль
    const musicProfile = await prisma.musicProfile.upsert({
      where: { userId: user.id },
      update: {
        unifiedTopTracks: analysisData.topTracks || null,
        unifiedTopArtists: analysisData.topArtists || null,
        unifiedTopGenres: analysisData.topGenres || null,
        musicPersonality: analysisData.musicPersonality || null,
        dominantGenres: analysisData.topGenres || null,
        energyLevel: analysisData.energyLevel || null,
        diversityScore: analysisData.diversityScore || null,
        lastAnalyzed: new Date()
      },
      create: {
        userId: user.id,
        unifiedTopTracks: analysisData.topTracks || null,
        unifiedTopArtists: analysisData.topArtists || null,
        unifiedTopGenres: analysisData.topGenres || null,
        musicPersonality: analysisData.musicPersonality || null,
        dominantGenres: analysisData.topGenres || null,
        energyLevel: analysisData.energyLevel || null,
        diversityScore: analysisData.diversityScore || null,
        lastAnalyzed: new Date()
      }
    });

    console.log('✅ Music profile saved successfully');

    return NextResponse.json({ 
      success: true,
      profileId: musicProfile.id
    });

  } catch (error) {
    console.error('❌ Error saving music profile:', error);
    return NextResponse.json({ 
      error: 'Failed to save music profile'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Получаем сессию NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Получаем профиль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        musicProfile: true
      }
    });

    if (!user?.musicProfile) {
      return NextResponse.json({ 
        error: 'Music profile not found'
      }, { status: 404 });
    }

    return NextResponse.json(user.musicProfile);

  } catch (error) {
    console.error('❌ Error fetching music profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch music profile'
    }, { status: 500 });
  }
}