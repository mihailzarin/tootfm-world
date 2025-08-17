import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("World ID verification request:", body);
    
    // Временно просто подтверждаем успех
    // TODO: Добавить реальную верификацию через World ID API
    
    const userData = {
      worldId: body.nullifier_hash || "test_user",
      credentialType: body.credential_type || "phone",
      verified: true,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 400 }
    );
  }
}
