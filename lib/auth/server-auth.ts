import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface UserSession {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  worldId: string | null;
  displayName: string | null;
  avatar: string | null;
  verified: boolean;
  partiesCreated: number;
  partiesJoined: number;
  votesCount: number;
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    const dbUser = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      include: {
        _count: {
          select: {
            parties: true,      // Созданные вечеринки
            memberships: true,  // Участие в вечеринках
            votes: true        // Голоса за треки
          }
        }
      }
    });

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      worldId: dbUser.worldId,
      displayName: dbUser.displayName,
      avatar: dbUser.avatar,
      verified: dbUser.verified,
      partiesCreated: dbUser._count?.parties || 0,
      partiesJoined: dbUser._count?.memberships || 0,
      votesCount: dbUser._count?.votes || 0
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function createUserFromWorldID(worldId: string, verified: boolean) {
  const existingUser = await prisma.user.findUnique({
    where: { worldId }
  });

  if (existingUser) {
    return await prisma.user.update({
      where: { worldId },
      data: { 
        verified,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            parties: true,
            memberships: true,
            votes: true
          }
        }
      }
    });
  }

  const newUser = await prisma.user.create({
    data: {
      worldId,
      verified,
      displayName: `User_${worldId.slice(-6)}`,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${worldId}`
    },
    include: {
      _count: {
        select: {
          parties: true,
          memberships: true,
          votes: true
        }
      }
    }
  });

  console.log('✅ New user created:', newUser.displayName);
  
  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    image: newUser.image,
    worldId: newUser.worldId,
    displayName: newUser.displayName,
    avatar: newUser.avatar,
    verified: newUser.verified,
    partiesCreated: newUser._count?.parties || 0,
    partiesJoined: newUser._count?.memberships || 0,
    votesCount: newUser._count?.votes || 0
  };
}
