import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { musicServices: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const services = user.musicServices.map(service => ({
      service: service.service,
      isActive: service.isActive,
      lastSynced: service.lastSynced?.toISOString()
    }));

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching music services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}