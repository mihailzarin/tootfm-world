import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface UniversalTrack {
  name: string;
  artist: string;
  album?: string;
  sources: string[];
  matchScore: number;
  spotifyId?: string;
  appleId?: string;
  lastfmId?: string;
  isrc?: string;
  previewUrl?: string;
  albumArt?: string;
  duration?: number;
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
        },
        creator: {
          include: {
            musicProfile: true
          }
        }
      }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    const trackMap = new Map<string, UniversalTrack>();

    // Функция для добавления треков в Map
    const addTracksToMap = (tracksData: any, userId: string) => {
      if (!tracksData) return;
      
      try {
        const tracks = typeof tracksData === 'string' 
          ? JSON.parse(tracksData) 
          : tracksData;
        
        if (Array.isArray(tracks)) {
          tracks.forEach((track: any) => {
            const key = `${track.name}-${track.artists?.[0]?.name || track.artist}`.toLowerCase();
            
            if (trackMap.has(key)) {
              const existing = trackMap.get(key)!;
              existing.sources.push(userId);
              existing.matchScore++;
              // Дополняем данные если их не было
              if (!existing.spotifyId && track.spotifyId) existing.spotifyId = track.spotifyId;
              if (!existing.albumArt && track.album?.images?.[0]?.url) existing.albumArt = track.album.images[0].url;
              if (!existing.previewUrl && track.preview_url) existing.previewUrl = track.preview_url;
            } else {
              trackMap.set(key, {
                name: track.name,
                artist: track.artists?.[0]?.name || track.artist || 'Unknown',
                album: track.album?.name || track.album,
                sources: [userId],
                matchScore: 1,
                spotifyId: track.id || track.spotifyId,
                isrc: track.external_ids?.isrc,
                albumArt: track.album?.images?.[0]?.url,
                previewUrl: track.preview_url,
                duration: track.duration_ms
              });
            }
          });
        }
      } catch (e) {
        console.error('Error parsing tracks for user:', userId, e);
      }
    };

    // Добавляем треки создателя
    if (party.creator.musicProfile?.unifiedTopTracks) {
      addTracksToMap(party.creator.musicProfile.unifiedTopTracks, party.creatorId);
    }

    // Добавляем треки участников
    party.members.forEach(member => {
      if (member.user.musicProfile?.unifiedTopTracks) {
        addTracksToMap(member.user.musicProfile.unifiedTopTracks, member.userId);
      }
    });

    if (trackMap.size === 0) {
      return NextResponse.json({
        error: 'No music data found',
        message: 'Party members need to analyze their music first'
      }, { status: 400 });
    }

    // Сортируем по matchScore
    const topTracks = Array.from(trackMap.values())
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 30);

    // Удаляем старые треки
    await prisma.track.deleteMany({
      where: { partyId: party.id }
    });

    // Сохраняем новые треки
    const savedTracks = [];
    for (let i = 0; i < topTracks.length && i < 20; i++) {
      const track = topTracks[i];
      
      try {
        const saved = await prisma.track.create({
          data: {
            // Идентификаторы
            isrc: track.isrc || null,
            spotifyId: track.spotifyId || null,
            appleId: track.appleId || null,
            lastfmMbid: track.lastfmId || null,
            
            // Метаданные (обязательные)
            name: track.name,
            artist: track.artist,
            
            // Метаданные (опциональные)
            album: track.album || null,
            albumArt: track.albumArt || null,
            duration: track.duration || 180000,
            previewUrl: track.previewUrl || null,
            
            // Источники и скоринг (обязательные)
            sources: track.sources, // Prisma автоматически сериализует в JSON
            matchScore: track.matchScore,
            
            // Party связь (обязательно)
            partyId: party.id,
            
            // Позиция (обязательно)
            position: i + 1,
            
            // Голосование
            voteCount: 0
          }
        });
        
        savedTracks.push(saved);
        
      } catch (error) {
        console.error(`Failed to save track ${i + 1}:`, error);
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

    console.log(`✅ Generated playlist with ${savedTracks.length} tracks`);

    return NextResponse.json({
      success: true,
      playlist: savedTracks,
      stats: {
        totalTracks: savedTracks.length,
        membersAnalyzed: party.members.length + 1, // +1 for creator
        topMatchScore: savedTracks[0]?.matchScore || 0
      }
    });

  } catch (error) {
    console.error('❌ Playlist generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate playlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
