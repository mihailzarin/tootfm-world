// app/api/music/apple/test/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Проверяем переменные окружения
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    
    // Проверяем файл ключа
    const keyPath = path.join(process.cwd(), 'keys', 'AuthKey_V32BKZL24F.p8');
    const keyExists = fs.existsSync(keyPath);
    
    // Пробуем прочитать ключ
    let keyContent = null;
    let keyError = null;
    
    if (keyExists) {
      try {
        keyContent = fs.readFileSync(keyPath, 'utf8');
      } catch (err: any) {
        keyError = err.message;
      }
    }
    
    return NextResponse.json({
      success: true,
      checks: {
        teamId: teamId ? '✅ Found' : '❌ Missing',
        keyId: keyId ? '✅ Found' : '❌ Missing',
        keyPath: keyPath,
        keyExists: keyExists ? '✅ Yes' : '❌ No',
        keyReadable: keyContent ? '✅ Yes' : '❌ No',
        keyError: keyError,
        keyFirstLine: keyContent ? keyContent.split('\n')[0] : null,
        workingDir: process.cwd()
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}