import jwt from 'jsonwebtoken';

export function generateAppleMusicToken(): string {
  // Используем правильные названия переменных
  const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const teamId = process.env.APPLE_MUSIC_TEAM_ID!;
  const keyId = process.env.APPLE_MUSIC_KEY_ID!;
  
  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '180d',
    issuer: teamId,
    header: {
      alg: 'ES256',
      kid: keyId
    }
  });
  
  return token;
}