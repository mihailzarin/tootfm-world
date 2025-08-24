import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

export function generateAppleMusicToken(): string {
  try {
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    let privateKey = process.env.APPLE_PRIVATE_KEY;
    
    // Читаем ключ из файла
    if (!privateKey) {
      const keyPath = path.join(process.cwd(), 'keys', `AuthKey_${keyId}.p8`);
      if (fs.existsSync(keyPath)) {
        console.log('📁 Reading Apple key from file:', keyPath);
        privateKey = fs.readFileSync(keyPath, 'utf8');
      } else {
        throw new Error(`Key file not found: ${keyPath}`);
      }
    }
    
    if (!teamId || !keyId || !privateKey) {
      throw new Error('Missing Apple Music credentials');
    }
    
    // Генерируем токен
    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d',
      issuer: teamId,
      header: {
        alg: 'ES256',
        kid: keyId
      }
    });
    
    console.log('✅ Apple Music token generated successfully');
    return token;
    
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}
