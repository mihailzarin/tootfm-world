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
  console.log('📍 Google callback started');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? 'https://tootfm.world/login?error=cancelled'
        : 'http://localhost:3001/login?error=cancelled';
      return NextResponse.redirect(redirectUrl);
    }
    
    if (!code) {
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? 'https://tootfm.world/login?error=no_code'
        : 'http://localhost:3001/login?error=no_code';
      return NextResponse.redirect(redirectUrl);
    }

    // Обмениваем code на токены
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Получаем данные пользователя
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    console.log('✅ User:', data.email);

    // ВАЖНО: Создаём или находим пользователя в БД
    const userId = `google_${data.id}`;
    
    // Находим или создаём пользователя в БД
    let dbUser = await prisma.user.findUnique({
      where: { worldId: userId }
    });
    
    if (!dbUser) {
      console.log('📝 Creating new user in database...');
      dbUser = await prisma.user.create({
        data: {
          worldId: userId,
          googleId: data.id,
          email: data.email,
          displayName: data.name || 'User',
          avatar: data.picture,
          verified: true
        }
      });
      console.log('✅ User created:', dbUser.id);
    } else {
      console.log('✅ Found existing user:', dbUser.id);
      // Обновляем данные если нужно
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          email: data.email,
          displayName: data.name || dbUser.displayName,
          avatar: data.picture || dbUser.avatar
        }
      });
    }
    
    // Правильный redirect URL для продакшена
    const profileUrl = process.env.NODE_ENV === 'production'
      ? 'https://tootfm.world/profile'
      : 'http://localhost:3001/profile';
      
    const response = NextResponse.redirect(profileUrl);
    
    // Сохраняем всё в cookies с правильными настройками для продакшена
    response.cookies.set('tootfm_user_id', userId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      domain: process.env.NODE_ENV === 'production' ? '.tootfm.world' : undefined
    });

    response.cookies.set('google_user', JSON.stringify({
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      domain: process.env.NODE_ENV === 'production' ? '.tootfm.world' : undefined
    });

    console.log('✅ Success! Redirecting to profile');
    return response;

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    const errorUrl = process.env.NODE_ENV === 'production'
      ? 'https://tootfm.world/login?error=auth_failed'
      : 'http://localhost:3001/login?error=auth_failed';
    return NextResponse.redirect(errorUrl);
  }
}