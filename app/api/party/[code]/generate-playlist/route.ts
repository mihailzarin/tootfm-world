import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface UniversalTrack {
  name: string;
  artist: string;
  album?: string;
  sources: string[]; // Массив user IDs кто любит трек
  matchScore: number;
  spotifyId?: string;
  lastfmId?: string;
  appleId?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    console.log('🎵 Generating playlist for party:', code);

    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: {
          include: {
            user: {
              include: {
                musicProfile: true
              }
            }
          }
        }
      }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // Анализируем профили всех участников
    const universalTracks = analyzeProfiles(party.members);
    
    if (universalTracks.length === 0) {
      return NextResponse.json({
        error: 'No music data found',
        message: 'Party members need to analyze their music first'
      }, { status: 400 });
    }

    // Сортируем по matchScore и берем топ 30
    const topTracks = universalTracks
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 30);

    // Сохраняем треки в БД
    const savedTracks = [];
    for (let i = 0; i < topTracks.length && i < 20; i++) {
      const track = topTracks[i];
      
      try {
        const saved = await prisma.track.create({
          data: {
            spotifyId: track.spotifyId || `gen-${Date.now()}-${i}`,
            name: track.name,
            artist: track.artist,
            album: track.album || null,
            albumArt: null,
            duration: 180000,
            partyId: party.id,
            
            // ВАЖНО: сохраняем кто любит этот трек
            sources: track.sources, // ["user1", "user2"]
            matchScore: track.matchScore, // Сколько людей любят
            
            voteCount: 0
          }
        });
        
        savedTracks.push(saved);
      } catch (error) {
        console.error(`Failed to save: ${track.name}`, error);
      }
    }

    // Обновляем статус party
    await prisma.party.update({
      where: { id: party.id },
      data: {
        playlistGenerated: true,
        totalTracks: savedTracks.length
      }
    });

    return NextResponse.json({
      success: true,
      playlist: savedTracks,
      stats: {
        totalTracks: savedTracks.length,
        membersAnalyzed: party.members.length,
        topMatchScore: savedTracks[0]?.matchScore || 0
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate playlist' },
      { status: 500 }
    );
  }
}

function analyzeProfiles(members: any[]): UniversalTrack[] {
  const trackMap = new Map<string, UniversalTrack>();

  // Для каждого участника
  members.forEach(member => {
    const userId = member.user.id;
    const profile = member.user.musicProfile;
    
    if (!profile?.unifiedTopTracks) return;

    try {
      const tracks = typeof profile.unifiedTopTracks === 'string' 
        ? JSON.parse(profile.unifiedTopTracks) 
        : profile.unifiedTopTracks;
      
      if (Array.isArray(tracks)) {
        tracks.forEach((track: any) => {
          const key = `${track.name}-${track.artists?.[0]?.name || track.artist}`.toLowerCase();
          
          if (trackMap.has(key)) {
            // Трек уже есть - добавляем пользователя
            const existing = trackMap.get(key)!;
            existing.sources.push(userId);
            existing.matchScore++;
            
            // Добавляем ID из других сервисов если есть
            if (track.spotifyId) existing.spotifyId = track.spotifyId;
            if (track.lastfmId) existing.lastfmId = track.lastfmId;
            if (track.appleId) existing.appleId = track.appleId;
          } else {
            // Новый трек
            trackMap.set(key, {
              name: track.name,
              artist: track.artists?.[0]?.name || track.artist || 'Unknown',
              album: track.album?.name || track.album,
              sources: [userId], // Кто любит этот трек
              matchScore: 1,
              spotifyId: track.id || track.spotifyId,
              lastfmId: track.lastfmId,
              appleId: track.appleId
            });
          }
        });
      }
    } catch (e) {
      console.error('Error parsing tracks for user:', userId, e);
    }
  });

  return Array.from(trackMap.values());
}
