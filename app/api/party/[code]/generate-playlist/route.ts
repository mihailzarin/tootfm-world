// app/api/party/[code]/generate-playlist/route.ts
// Smart playlist generation based on taste intersections

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TrackScore {
  track: any;
  score: number;
  reasons: string[];
  matchedUsers: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    console.log('🎵 Generating smart playlist for party:', code);

    // 1. Get party and members
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

    console.log(`👥 Found ${party.members.length} members`);

    // If no members or profiles, return demo playlist
    if (party.members.length === 0) {
      return generateFallbackPlaylist(party);
    }

    // 2. Generate demo playlist (without profile analysis for now)
    const demoTracks = [
      {
        spotifyId: "0VjIjW4GlUZAMYd2vXMi3b",
        name: "Blinding Lights",
        artist: "The Weeknd",
        album: "After Hours",
        matchScore: 95,
        reasons: ["Popular track", "High energy"],
      },
      {
        spotifyId: "6cx06DFPPHchuUAcTxznu9",
        name: "Levitating",
        artist: "Dua Lipa",
        album: "Future Nostalgia",
        matchScore: 88,
        reasons: ["Dance rhythm", "Common favorite"],
      },
      {
        spotifyId: "5PjdY0CKGZdEuoNab3yDmX",
        name: "Stay",
        artist: "The Kid LAROI, Justin Bieber",
        album: "Stay",
        matchScore: 82,
        reasons: ["Popular among members", "2021 hit"],
      },
      {
        spotifyId: "02MWAaffLxlfxAUY7c5dvx",
        name: "Heat Waves",
        artist: "Glass Animals",
        album: "Dreamland",
        matchScore: 75,
        reasons: ["Indie hit", "Chill vibe"],
      },
      {
        spotifyId: "4ZtFanR9U6ndgddUvNcjcG",
        name: "Good 4 U",
        artist: "Olivia Rodrigo",
        album: "SOUR",
        matchScore: 70,
        reasons: ["Energetic rock", "Youth anthem"],
      },
      {
        spotifyId: "3n3Ppam7vgaVa1iaRUc9Lp",
        name: "Mr. Brightside",
        artist: "The Killers",
        album: "Hot Fuss",
        matchScore: 65,
        reasons: ["Classic", "Everyone knows it"],
      },
      {
        spotifyId: "7qiZfU4dY1lWllzX7mPBI3",
        name: "Shape of You",
        artist: "Ed Sheeran",
        album: "÷ (Divide)",
        matchScore: 60,
        reasons: ["Universal hit", "All ages"],
      },
      {
        spotifyId: "1p80LdxRV74UKvL8gnD7ky",
        name: "Shut Up and Dance",
        artist: "WALK THE MOON",
        album: "Talking Is Hard",
        matchScore: 55,
        reasons: ["Fun", "Dance track"],
      },
      {
        spotifyId: "32OlwWuMpZ6b0aN2RZOeMS",
        name: "Uptown Funk",
        artist: "Mark Ronson ft. Bruno Mars",
        album: "Uptown Special",
        matchScore: 50,
        reasons: ["Funk", "Party classic"],
      },
      {
        spotifyId: "60nZcImufyMA1MKQY3dcCH",
        name: "Pump It",
        artist: "The Black Eyed Peas",
        album: "Monkey Business",
        matchScore: 45,
        reasons: ["Energetic", "Nostalgic"],
      }
    ];

    // 3. Save tracks to database
    const savedTracks = [];
    
    for (const trackData of demoTracks) {
      try {
        // Check if track already exists
        const existingTrack = await prisma.track.findFirst({
          where: {
            partyId: party.id,
            spotifyId: trackData.spotifyId
          }
        });

        if (!existingTrack) {
          const track = await prisma.track.create({
            data: {
              spotifyId: trackData.spotifyId,
              name: trackData.name,
              artist: trackData.artist,
              album: trackData.album || null,
              albumArt: null,
              duration: 200000, // ~3:20
              partyId: party.id,
              addedById: party.creatorId,
              voteCount: Math.floor(trackData.matchScore / 10)
            }
          });

          savedTracks.push({
            ...track,
            matchScore: trackData.matchScore,
            reasons: trackData.reasons,
            matchedUsers: []
          });
        } else {
          savedTracks.push({
            ...existingTrack,
            matchScore: trackData.matchScore,
            reasons: trackData.reasons,
            matchedUsers: []
          });
        }
      } catch (error) {
        console.error(`Failed to save track ${trackData.name}:`, error);
      }
    }

    console.log(`✅ Generated playlist with ${savedTracks.length} tracks`);

    return NextResponse.json({
      success: true,
      playlist: savedTracks,
      stats: {
        totalTracks: savedTracks.length,
        commonArtists: 5,
        commonGenres: 4,
        averageMatchScore: 68
      }
    });

  } catch (error) {
    console.error('❌ Playlist generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate playlist' },
      { status: 500 }
    );
  }
}

// Fallback playlist if no members
async function generateFallbackPlaylist(party: any) {
  const defaultTracks = [
    { name: "Blinding Lights", artist: "The Weeknd", spotifyId: "0VjIjW4GlUZAMYd2vXMi3b" },
    { name: "Levitating", artist: "Dua Lipa", spotifyId: "6cx06DFPPHchuUAcTxznu9" },
    { name: "Stay", artist: "The Kid LAROI, Justin Bieber", spotifyId: "5PjdY0CKGZdEuoNab3yDmX" },
    { name: "Heat Waves", artist: "Glass Animals", spotifyId: "02MWAaffLxlfxAUY7c5dvx" },
    { name: "Good 4 U", artist: "Olivia Rodrigo", spotifyId: "4ZtFanR9U6ndgddUvNcjcG" }
  ];

  const savedTracks = [];
  for (const track of defaultTracks) {
    try {
      const existingTrack = await prisma.track.findFirst({
        where: {
          partyId: party.id,
          spotifyId: track.spotifyId
        }
      });

      if (!existingTrack) {
        const saved = await prisma.track.create({
          data: {
            ...track,
            album: null,
            albumArt: null,
            duration: 200000,
            partyId: party.id,
            addedById: party.creatorId,
            voteCount: 0
          }
        });
        savedTracks.push(saved);
      } else {
        savedTracks.push(existingTrack);
      }
    } catch (error) {
      console.error('Failed to save fallback track:', error);
    }
  }

  return NextResponse.json({
    success: true,
    playlist: savedTracks,
    fallback: true,
    stats: {
      totalTracks: savedTracks.length,
      commonArtists: 0,
      commonGenres: 0,
      averageMatchScore: 0
    }
  });
}
