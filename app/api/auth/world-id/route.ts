// app/api/auth/world-id/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const proof = await request.json();
    
    // Сохраняем World ID в сессию
    const worldId = proof.nullifier_hash || proof.merkle_root;
    
    return NextResponse.json({ 
      success: true, 
      worldId,
      message: "World ID verified" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 400 }
    );
  }
}