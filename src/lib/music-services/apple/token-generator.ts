// lib/music-services/apple/token-generator.ts
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

export function generateAppleMusicToken(): string {
  try {
    // Читаем приватный ключ из файла
    const privateKeyPath = path.join(process.cwd(), 'keys', 'AuthKey_V32BKZL24F.p8');
    
    // Проверяем существование файла
    if (!fs.existsSync(privateKeyPath)) {
      throw new Error(`Файл ключа не найден: ${privateKeyPath}`);
    }
    
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    
    // Данные из env
    const teamId = process.env.APPLE_TEAM_ID!;
    const keyId = process.env.APPLE_KEY_ID!;
    
    if (!teamId || !keyId) {
      throw new Error('Не найдены APPLE_TEAM_ID или APPLE_KEY_ID в .env.local');
    }
    
    // Генерируем токен
    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d', // 6 месяцев
      issuer: teamId,
      header: {
        alg: 'ES256',
        kid: keyId
      }
    });
    
    console.log('✅ Apple Music токен сгенерирован');
    return token;
    
  } catch (error) {
    console.error('❌ Ошибка генерации токена:', error);
    throw error;
  }
}