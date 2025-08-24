import jwt from 'jsonwebtoken';

export function generateAppleMusicToken(): string {
  // Используем ПРАВИЛЬНЫЕ названия переменных!
  const teamId = process.env.APPLE_MUSIC_TEAM_ID;
  const keyId = process.env.APPLE_MUSIC_KEY_ID;
  const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY;

  if (!teamId || !keyId || !privateKey) {
    console.error('Missing Apple Music credentials:', {
      teamId: !!teamId,
      keyId: !!keyId,
      privateKey: !!privateKey
    });
    throw new Error('Apple Music configuration is incomplete');
  }

  const now = Math.floor(Date.now() / 1000);
  const expires = now + (6 * 30 * 24 * 60 * 60); // 6 месяцев

  const payload = {
    iss: teamId,
    iat: now,
    exp: expires
  };

  try {
    // Форматируем ключ правильно
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    
    const token = jwt.sign(payload, formattedKey, {
      algorithm: 'ES256',
      keyid: keyId
    });

    return token;
  } catch (error) {
    console.error('Failed to generate Apple Music token:', error);
    throw new Error('Token generation failed');
  }
}