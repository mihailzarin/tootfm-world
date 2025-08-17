import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Получаем данные из cookies
    const cookieStore = request.cookies;
    const lastfmUserCookie = cookieStore.get('lastfm_user');
    
    if (!lastfmUserCookie) {
      return NextResponse.json({ error: 'Not connected to Last.fm' }, { status: 401 });
    }
    
    let userData;
    try {
      userData = JSON.parse(lastfmUserCookie.value);
    } catch (e) {
      console.error('Error parsing cookie:', e);
      return NextResponse.json({ error: 'Invalid cookie data' }, { status: 400 });
    }
    
    if (!userData.username) {
      return NextResponse.json({ error: 'No username found' }, { status: 401 });
    }
    
    console.log('Fetching tracks for:', userData.username);
    
    // Получаем recent tracks (так как топ треков нет)
    const apiKey = process.env.LASTFM_API_KEY!;
    const recentUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=${userData.username}&api_key=${apiKey}&format=json&limit=10`;
    
    const response = await fetch(recentUrl);
    const data = await response.json();
    
    let tracks = [];
    
    if (data.recenttracks?.track) {
      const recentTracks = Array.isArray(data.recenttracks.track) 
        ? data.recenttracks.track 
        : [data.recenttracks.track];
      
      // Группируем треки и считаем plays
      const trackMap = new Map();
      
      recentTracks.forEach((track: any) => {
        const key = `${track.name}-${track.artist['#text'] || track.artist}`;
        if (!trackMap.has(key)) {
          trackMap.set(key, {
            title: track.name,
            artist: track.artist['#text'] || track.artist || 'Unknown',
            playCount: 1,
            imageUrl: track.image?.[2]?.['#text'] || track.image?.[1]?.['#text'],
            url: track.url,
            album: track.album?.['#text'] || ''
          });
        } else {
          trackMap.get(key).playCount++;
        }
      });
      
      // Конвертируем в массив и сортируем
      tracks = Array.from(trackMap.values())
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 10);
      
      console.log(`Found ${tracks.length} unique tracks from recent plays`);
    }
    
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tracks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
