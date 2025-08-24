import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Пробуем подключиться к БД
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      database: 'Connected',
      users: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}