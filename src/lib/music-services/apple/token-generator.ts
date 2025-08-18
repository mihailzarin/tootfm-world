// src/lib/music-services/apple/token-generator.ts
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

export function generateAppleMusicToken(): string {
  try {
    let privateKey: string;
    
    // В проде берём из переменной окружения
    if (process.env.APPLE_PRIVATE_KEY) {
      privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    } else {
      // В деве читаем из файла
      const privateKeyPath = path.join(process.cwd(), 'keys', 'AuthKey_V32BKZL24F.p8');
      
      if (!fs.existsSync(privateKeyPath)) {
        throw new Error(`Key file not found: ${privateKeyPath}`);
      }
      
      privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    }
    
    const teamId = process.env.APPLE_TEAM_ID!;
    const keyId = process.env.APPLE_KEY_ID!;
    
    if (!teamId || !keyId) {
      throw new Error('Missing APPLE_TEAM_ID or APPLE_KEY_ID');
    }
    
    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d',
      issuer: teamId,
      header: {
        alg: 'ES256',
        kid: keyId
      }
    });
    
    console.log('✅ Apple Music token generated');
    return token;
    
  } catch (error) {
    console.error('❌ Token generation error:', error);
    throw error;
  }
}