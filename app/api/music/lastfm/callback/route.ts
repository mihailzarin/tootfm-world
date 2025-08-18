// app/api/lastfm/callback/route.ts
// Исправленный обработчик callback от Last.fm

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Секретный ключ Last.fm из переменных окружения
const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET!;
const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;

/**
 * Генерирует MD5 подпись для Last.fm API
 * @param params - Параметры для подписи (без api_sig)
 * @returns MD5 хеш строки
 */
function generateApiSig(params: Record<string, string>): string {
  // 1. Сортируем параметры по ключам в алфавитном порядке
  const sortedKeys = Object.keys(params).sort();
  
  // 2. Конкатенируем пары ключ-значение
  let sigString = '';
  for (const key of sortedKeys) {
    // Пропускаем format и callback параметры (они не участвуют в подписи)
    if (key !== 'format' && key !== 'callback') {
      sigString += key + params[key];
    }
  }
  
  // 3. Добавляем секретный ключ в конец
  sigString += LASTFM_API_SECRET;
  
  // 4. Генерируем MD5 хеш
  const hash = crypto.createHash('md5').update(sigString, 'utf8').digest('hex');
  
  console.log('📝 Signature generation:', {
    params: sortedKeys.map(k => `${k}=${params[k]}`).join(', '),
    sigString: sigString.substring(0, 50) + '...', // Показываем только начало для безопасности
    hash
  });
  
  return hash;
}

/**
 * Получает session key от Last.fm после успешной авторизации
 * @param token - Временный токен от Last.fm
 * @returns Session key и имя пользователя
 */
async function getSessionKey(token: string) {
  try {
    // Параметры для запроса session
    const params: Record<string, string> = {
      method: 'auth.getSession',
      api_key: LASTFM_API_KEY,
      token: token
    };
    
    // Генерируем подпись
    const apiSig = generateApiSig(params);
    
    // Добавляем подпись к параметрам
    params.api_sig = apiSig;
    params.format = 'json'; // Добавляем format после генерации подписи
    
    // Формируем URL с параметрами
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    console.log('🔗 Requesting session from Last.fm:', url.toString());
    
    // Делаем запрос к Last.fm API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'tootFM/1.0'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok || data.error) {
      console.error('❌ Last.fm API error:', data);
      throw new Error(data.message || 'Failed to get session');
    }
    
    console.log('✅ Session received:', {
      username: data.session?.name,
      key: data.session?.key?.substring(0, 10) + '...'
    });
    
    return {
      sessionKey: data.session.key,
      username: data.session.name
    };
  } catch (error) {
    console.error('❌ Error getting session key:', error);
    throw error;
  }
}

/**
 * GET обработчик для callback от Last.fm
 * Last.fm перенаправляет сюда после авторизации пользователя
 */
export async function GET(request: NextRequest) {
  console.log('🎵 Last.fm callback received');
  
  try {
    // Получаем token из query параметров
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    // Проверяем наличие токена
    if (!token) {
      console.error('❌ No token in callback');
      return NextResponse.redirect(
        new URL('/profile?error=lastfm_no_token', request.url)
      );
    }
    
    console.log('🔑 Token received:', token.substring(0, 10) + '...');
    
    // Получаем session key от Last.fm
    const { sessionKey, username } = await getSessionKey(token);
    
    // TODO: Здесь нужно сохранить sessionKey в базу данных
    // Пока сохраняем в cookies для демонстрации
    
    // Создаем response с редиректом
    const response = NextResponse.redirect(
      new URL('/profile?lastfm=connected', request.url)
    );
    
    // Устанавливаем cookies с данными Last.fm
    // В продакшене используйте JWT токен и храните в БД
    response.cookies.set('lastfm_session', sessionKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/'
    });
    
    response.cookies.set('lastfm_username', username, {
      httpOnly: false, // Можем читать на клиенте для отображения
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    });
    
    console.log('✅ Last.fm connected successfully for user:', username);
    
    return response;
    
  } catch (error) {
    console.error('❌ Last.fm callback error:', error);
    
    // Редиректим с ошибкой
    return NextResponse.redirect(
      new URL('/profile?error=lastfm_connection_failed', request.url)
    );
  }
}

/**
 * POST обработчик для отключения Last.fm
 * Вызывается когда пользователь хочет отключить интеграцию
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    
    // Удаляем cookies
    response.cookies.delete('lastfm_session');
    response.cookies.delete('lastfm_username');
    
    // TODO: Удалить из базы данных
    
    return response;
  } catch (error) {
    console.error('❌ Error disconnecting Last.fm:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}