import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("World ID verification received:", body);

    // Простая проверка для тестирования
    if (body.nullifier_hash) {
      const response = NextResponse.json({
        success: true,
        user: {
          worldId: body.nullifier_hash,
          verified: true,
        },
      });

      // Установим cookie для сохранения сессии
      response.cookies.set("world_id", body.nullifier_hash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 дней
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid verification" },
      { status: 400 }
    );
  } catch (error) {
    console.error("World ID callback error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

// Добавим GET метод для тестирования
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: "World ID callback endpoint is working",
    path: "/api/auth/world/callback"
  });
}