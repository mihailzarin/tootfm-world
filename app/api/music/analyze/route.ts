import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, appleLibrary } = body; // Now accepting appleLibrary
    
    console.log('🎵 Analyzing music for user:', userId);
    console.log('🍎 Apple Music data included:', !!appleLibrary);

    // Get all cookies
    const cookies = request.cookies;
    
    // Check connected services
    const spotifyToken = cookies.get('spotify_token')?.value;
    const lastfmUsername = cookies.get('lastfm_username')?.value;
    const lastfmSession = cookies.get('lastfm_session')?.value;
    
    console.log('📊 Connected services:', {
      spotify: !!spotifyToken,
      lastfm: !!lastfmUsername,
      appleMusic: !!appleLibrary
    });

    // Collect data from all sources
    let allTracks: any[] = [];
    let allArtists: any[] = [];
    let allGenres: string[] = [];
    let audioFeatures: any = null;
    let sources: string[] = [];

    // 1. SPOTIFY DATA
    if (spotifyToken) {
      console.log('🎧 Fetching Spotify data...');
      
      try {
        // Top tracks
        const tracksResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });

        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json();
          const spotifyTracks = tracksData.items || [];
          
          spotifyTracks.forEach((track: any) => {
            track.source = 'Spotify';
            allTracks.push(track);
          });
          
          console.log(`✅ Got ${spotifyTracks.length} tracks from Spotify`);
        }

        // Top artists
        const artistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });

        if (artistsResponse.ok) {
          const artistsData = await artistsResponse.json();
          const spotifyArtists = artistsData.items || [];
          
          spotifyArtists.forEach((artist: any) => {
            artist.source = 'Spotify';
            allArtists.push(artist);
            
            // Collect genres
            if (artist.genres) {
              allGenres.push(...artist.genres);
            }
          });
          
          console.log(`✅ Got ${spotifyArtists.length} artists from Spotify`);
        }

        // Audio features for energy
        if (allTracks.length > 0) {
          const trackIds = allTracks
            .filter(t => t.source === 'Spotify')
            .slice(0, 10)
            .map(t => t.id)
            .join(',');
            
          const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
          });

          if (featuresResponse.ok) {
            const featuresData = await featuresResponse.json();
            audioFeatures = featuresData.audio_features;
          }
        }
        
        sources.push('Spotify');
      } catch (error) {
        console.error('❌ Error fetching Spotify data:', error);
      }
    }

    // 2. LAST.FM DATA
    if (lastfmUsername) {
      console.log('📻 Fetching Last.fm data...');
      
      try {
        const apiKey = process.env.LASTFM_API_KEY!;
        
        // Top tracks
        const topTracksUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getTopTracks&user=${lastfmUsername}&api_key=${apiKey}&format=json&limit=20&period=6month`;
        const topTracksResponse = await fetch(topTracksUrl);
        
        if (topTracksResponse.ok) {
          const topTracksData = await topTracksResponse.json();
          const lastfmTracks = topTracksData.toptracks?.track || [];
          
          lastfmTracks.forEach((track: any) => {
            allTracks.push({
              name: track.name,
              artist: track.artist.name,
              album: { name: track.album?.['#text'] || 'Unknown Album' },
              playcount: parseInt(track.playcount) || 0,
              source: 'Last.fm',
              url: track.url,
              image: track.image?.[2]?.['#text']
            });
          });
          
          console.log(`✅ Got ${lastfmTracks.length} tracks from Last.fm`);
        }

        // Top artists
        const topArtistsUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getTopArtists&user=${lastfmUsername}&api_key=${apiKey}&format=json&limit=10&period=6month`;
        const topArtistsResponse = await fetch(topArtistsUrl);
        
        if (topArtistsResponse.ok) {
          const topArtistsData = await topArtistsResponse.json();
          const lastfmArtists = topArtistsData.topartists?.artist || [];
          
          lastfmArtists.forEach((artist: any) => {
            allArtists.push({
              name: artist.name,
              playcount: parseInt(artist.playcount) || 0,
              source: 'Last.fm',
              url: artist.url,
              image: artist.image?.[2]?.['#text']
            });
          });
          
          console.log(`✅ Got ${lastfmArtists.length} artists from Last.fm`);
        }

        // User tags (genres)
        const topTagsUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getTopTags&user=${lastfmUsername}&api_key=${apiKey}&format=json&limit=20`;
        const topTagsResponse = await fetch(topTagsUrl);
        
        if (topTagsResponse.ok) {
          const topTagsData = await topTagsResponse.json();
          const tags = topTagsData.toptags?.tag || [];
          
          tags.forEach((tag: any) => {
            allGenres.push(tag.name);
          });
          
          console.log(`✅ Got ${tags.length} tags from Last.fm`);
        }
        
        sources.push('Last.fm');
      } catch (error) {
        console.error('❌ Error fetching Last.fm data:', error);
      }
    }

    // 3. APPLE MUSIC DATA
    if (appleLibrary) {
      console.log('🍎 Processing Apple Music data...');
      
      try {
        // Process artists
        if (appleLibrary.artists && Array.isArray(appleLibrary.artists)) {
          appleLibrary.artists.forEach((artist: any) => {
            allArtists.push({
              name: artist.attributes?.name || artist.name || 'Unknown Artist',
              playcount: 0,
              source: 'Apple Music'
            });
          });
          console.log(`✅ Got ${appleLibrary.artists.length} artists from Apple Music`);
        }
        
        // Process songs
        if (appleLibrary.songs && Array.isArray(appleLibrary.songs)) {
          appleLibrary.songs.slice(0, 20).forEach((song: any) => {
            allTracks.push({
              name: song.attributes?.name || song.name || 'Unknown Track',
              artist: song.attributes?.artistName || 'Unknown Artist',
              album: { name: song.attributes?.albumName || 'Unknown Album' },
              source: 'Apple Music'
            });
          });
          console.log(`✅ Got ${Math.min(20, appleLibrary.songs.length)} tracks from Apple Music`);
        }
        
        // Process genres
        if (appleLibrary.genres && Array.isArray(appleLibrary.genres)) {
          allGenres.push(...appleLibrary.genres);
          console.log(`✅ Got ${appleLibrary.genres.length} genres from Apple Music`);
        }
        
        sources.push('Apple Music');
      } catch (error) {
        console.error('❌ Error processing Apple Music data:', error);
      }
    }

    // 4. ANALYZE COLLECTED DATA
    console.log('🔍 Analyzing collected data:', {
      tracks: allTracks.length,
      artists: allArtists.length,
      genres: allGenres.length,
      sources: sources
    });

    // If no data from any service, return demo
    if (allTracks.length === 0 && allArtists.length === 0) {
      console.log('⚠️ No data from services, returning demo profile');
      return NextResponse.json({
        success: true,
        profile: getDemoProfile(),
        sources: []
      });
    }

    // Process and sort data
    const uniqueGenres = processGenres(allGenres);
    const topTracks = processTopTracks(allTracks);
    const topArtists = processTopArtists(allArtists);
    const energyLevel = calculateEnergy(audioFeatures, allTracks);
    const diversityScore = calculateDiversity(uniqueGenres, allArtists);
    const musicPersonality = generatePersonality(uniqueGenres, energyLevel, diversityScore, sources);

    const profile = {
      topGenres: uniqueGenres.slice(0, 6),
      musicPersonality,
      energyLevel: Math.round(energyLevel),
      diversityScore: Math.round(diversityScore),
      topArtists: topArtists.slice(0, 5),
      topTracks: topTracks.slice(0, 5),
      totalTracks: allTracks.length,
      totalArtists: new Set(allArtists.map(a => a.name)).size,
      totalGenres: uniqueGenres.length,
      sources
    };

    console.log('✅ Analysis complete:', {
      personality: profile.musicPersonality,
      genres: profile.topGenres.length,
      sources: profile.sources
    });

    return NextResponse.json({ 
      success: true, 
      profile,
      sources 
    });

  } catch (error) {
    console.error('❌ Music analysis error:', error);
    
    return NextResponse.json({
      success: true,
      profile: getDemoProfile(),
      sources: [],
      error: 'Failed to analyze music data'
    });
  }
}

// HELPER FUNCTIONS

function processGenres(genres: string[]): string[] {
  const genreMap = new Map<string, number>();
  
  genres.forEach(genre => {
    const normalized = genre
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    genreMap.set(normalized, (genreMap.get(normalized) || 0) + 1);
  });
  
  // Add basic genres if too few
  if (genreMap.size < 3) {
    ['Pop', 'Rock', 'Electronic', 'Indie', 'Hip Hop'].forEach(g => {
      if (!genreMap.has(g)) {
        genreMap.set(g, 1);
      }
    });
  }
  
  return Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre);
}

function processTopTracks(tracks: any[]): any[] {
  const trackMap = new Map();
  
  tracks.forEach(track => {
    const key = `${track.name || track.title}-${track.artist || track.artists?.[0]?.name}`;
    
    if (!trackMap.has(key)) {
      trackMap.set(key, {
        name: track.name || track.title,
        artist: track.artist || track.artists?.[0]?.name || 'Unknown',
        album: track.album?.name || 'Unknown Album',
        image: track.album?.images?.[0]?.url || track.image,
        playcount: track.playcount || track.popularity || 0,
        source: track.source
      });
    }
  });
  
  return Array.from(trackMap.values())
    .sort((a, b) => (b.playcount || 0) - (a.playcount || 0));
}

function processTopArtists(artists: any[]): any[] {
  const artistMap = new Map();
  
  artists.forEach(artist => {
    const name = artist.name;
    
    if (!artistMap.has(name)) {
      artistMap.set(name, {
        name,
        image: artist.images?.[0]?.url || artist.image,
        popularity: artist.popularity || artist.playcount || 0,
        source: artist.source
      });
    } else {
      // If artist from multiple sources, sum popularity
      const existing = artistMap.get(name);
      existing.popularity += artist.popularity || artist.playcount || 0;
    }
  });
  
  return Array.from(artistMap.values())
    .sort((a, b) => b.popularity - a.popularity);
}

function calculateEnergy(audioFeatures: any, tracks: any[]): number {
  if (audioFeatures && audioFeatures.length > 0) {
    const avgEnergy = audioFeatures.reduce((acc: number, f: any) => {
      return acc + (f?.energy || 0.5);
    }, 0) / audioFeatures.length;
    
    const avgDanceability = audioFeatures.reduce((acc: number, f: any) => {
      return acc + (f?.danceability || 0.5);
    }, 0) / audioFeatures.length;
    
    return (avgEnergy * 0.6 + avgDanceability * 0.4) * 100;
  }
  
  // Default based on genre and popularity
  return 65 + Math.random() * 20;
}

function calculateDiversity(genres: string[], artists: any[]): number {
  const genreDiversity = Math.min(genres.length / 10, 1) * 60;
  const artistCount = new Set(artists.map(a => a.name)).size;
  const artistDiversity = Math.min(artistCount / 15, 1) * 40;
  
  return genreDiversity + artistDiversity;
}

function generatePersonality(genres: string[], energy: number, diversity: number, sources: string[]): string {
  const sourceEmoji = sources.length > 2 ? '🌐' : sources.includes('Spotify') ? '🎧' : '📻';
  
  if (diversity > 80 && genres.length > 6) {
    return `Eclectic Explorer ${sourceEmoji}`;
  } else if (energy > 75) {
    return `Energy Enthusiast ⚡`;
  } else if (genres.some(g => g.toLowerCase().includes('jazz') || g.toLowerCase().includes('classical'))) {
    return `Sophisticated Listener 🎩`;
  } else if (genres.some(g => g.toLowerCase().includes('indie') || g.toLowerCase().includes('alternative'))) {
    return `Indie Connoisseur 🎸`;
  } else if (genres.some(g => g.toLowerCase().includes('electronic') || g.toLowerCase().includes('techno'))) {
    return `Electronic Voyager 🎛️`;
  } else if (genres.some(g => g.toLowerCase().includes('hip') || g.toLowerCase().includes('rap'))) {
    return `Beat Master 🎤`;
  } else if (energy < 40) {
    return `Chill Vibes Curator 😌`;
  } else {
    return `Music Enthusiast ${sourceEmoji}`;
  }
}

function getDemoProfile() {
  return {
    topGenres: ["Electronic", "Indie Rock", "Hip Hop", "Pop", "Jazz"],
    musicPersonality: "Music Explorer 🎵",
    energyLevel: 70,
    diversityScore: 75,
    topArtists: [
      { name: "Daft Punk", popularity: 85 },
      { name: "Radiohead", popularity: 82 },
      { name: "Kendrick Lamar", popularity: 88 }
    ],
    topTracks: [
      { name: "Get Lucky", artist: "Daft Punk", album: "Random Access Memories" },
      { name: "Karma Police", artist: "Radiohead", album: "OK Computer" },
      { name: "HUMBLE.", artist: "Kendrick Lamar", album: "DAMN." }
    ],
    totalTracks: 0,
    totalArtists: 0,
    totalGenres: 0,
    sources: []
  };
}