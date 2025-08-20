// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === 'production'
    ? 'https://tootfm.world/api/auth/google/callback'
    : 'http://localhost:3001/api/auth/google/callback'
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect('http://localhost:3001/login?error=cancelled');
    }
    
    if (!code) {
      return NextResponse.redirect('http://localhost:3001/login?error=no_code');
    }

    // Обмениваем code на токены
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Получаем данные пользователя
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    console.log('✅ Google user:', data.email);

    // Создаём или обновляем пользователя в БД
    let user;
    try {
      // Сначала пробуем найти по email
      user = await prisma.user.findUnique({
        where: { email: data.email! }
      });

      if (user) {
        // Обновляем существующего
        user = await prisma.user.update({
          where: { email: data.email! },
          data: {
            displayName: data.name || data.email,
            avatar: data.picture,
            googleId: data.id
          }
        });
        console.log('✅ Updated existing user:', user.id);
      } else {
        // Создаём нового
        user = await prisma.user.create({
          data: {
            email: data.email!,
            googleId: data.id!,
            displayName: data.name || data.email!,
            avatar: data.picture,
            worldId: `google_${data.id}`, // временный worldId
            emailVerified: data.verified_email || false
          }
        });
        console.log('✅ Created new user:', user.id);
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Если БД не работает, используем fallback
      user = {
        id: `google_${data.id}`,
        email: data.email,
        displayName: data.name || data.email
      };
    }

    // Создаём response
    const response = NextResponse.redirect('http://localhost:3001/profile');
    
    // Сохраняем user ID
    response.cookies.set('tootfm_user_id', user.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });

    // Сохраняем данные пользователя (для отображения в UI)
    response.cookies.set('google_user', JSON.stringify({
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    }), {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });

    // Сохраняем токены для YouTube API
    if (tokens.access_token) {
      response.cookies.set('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });
    }

    return response;

  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    return NextResponse.redirect('http://localhost:3001/login?error=auth_failed');
  }
}