// lib/auth/server-auth.ts
// Server-side authentication utilities

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { AUTH_CONFIG, getCookieOptions, UserLevel } from './config';

export interface TootUser {
  id: string;
  primaryId: string;
  displayName: string;
  avatar?: string;
  email?: string;
  level: UserLevel;
  services: {
    spotify?: { id: string; email?: string; connected: Date };
    lastfm?: { username: string; connected: Date };
    apple?: { id: string; email?: string; connected: Date };
  };
  worldId?: string;
  verified: boolean;
  createdAt: Date;
  lastSeen: Date;
  partiesCreated: number;
  tracksAdded: number;
}

export async function getCurrentUser(): Promise<TootUser | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(AUTH_CONFIG.COOKIES.USER_ID)?.value;
    
    if (!userId) {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        musicServices: true,
        _count: {
          select: {
            createdParties: true,
            addedTracks: true
          }
        }
      }
    });
    
    if (!user) {
      return null;
    }
    
    return formatUser(user);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function findOrCreateUserByService(
  service: 'spotify' | 'apple' | 'lastfm',
  serviceData: {
    id: string;
    email?: string;
    username?: string;
    displayName?: string;
    avatar?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  }
): Promise<TootUser> {
  
  const existingService = await prisma.musicService.findFirst({
    where: {
      service: service.toUpperCase() as any,
      serviceUserId: serviceData.id
    },
    include: {
      user: {
        include: {
          musicServices: true,
          _count: {
            select: {
              createdParties: true,
              addedTracks: true
            }
          }
        }
      }
    }
  });
  
  if (existingService) {
    console.log(`Found existing user via ${service}:`, existingService.user.displayName);
    
    // Update service tokens
    await prisma.musicService.update({
      where: { id: existingService.id },
      data: {
        accessToken: serviceData.accessToken,
        refreshToken: serviceData.refreshToken,
        expiresAt: serviceData.expiresAt,
        lastSyncAt: new Date()
      }
    });
    
    // Update user last seen
    await prisma.user.update({
      where: { id: existingService.user.id },
      data: { 
        updatedAt: new Date(),
        lastLogin: new Date()
      }
    });
    
    await saveUserSession(existingService.user.id);
    
    return formatUser(existingService.user);
  }
  
  const primaryId = generatePrimaryId();
  const tempWorldId = `temp_${primaryId}`;
  
  console.log(`Creating new user via ${service}:`, serviceData.displayName);
  
  const newUser = await prisma.user.create({
    data: {
      worldId: tempWorldId,
      primaryId: primaryId,
      displayName: serviceData.displayName || serviceData.username || 'Music Lover',
      avatar: serviceData.avatar,
      email: serviceData.email,
      level: 'music',
      verified: false,
      musicServices: {
        create: {
          service: service.toUpperCase() as any,
          serviceUserId: serviceData.id,
          serviceUserName: serviceData.username || serviceData.displayName,
          serviceEmail: serviceData.email,
          accessToken: serviceData.accessToken,
          refreshToken: serviceData.refreshToken,
          expiresAt: serviceData.expiresAt
        }
      }
    },
    include: {
      musicServices: true,
      _count: {
        select: {
          createdParties: true,
          addedTracks: true
        }
      }
    }
  });
  
  console.log('✅ New user created:', newUser.displayName);
  
  await saveUserSession(newUser.id);
  
  return formatUser(newUser);
}

function generatePrimaryId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `usr_${timestamp}${random}`;
}

async function saveUserSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(AUTH_CONFIG.COOKIES.USER_ID, userId, {
    ...getCookieOptions(true),
    maxAge: AUTH_CONFIG.EXPIRATION.SESSION
  });
}

function formatUser(dbUser: any): TootUser {
  const services: any = {};
  
  dbUser.musicServices?.forEach((ms: any) => {
    const serviceName = ms.service.toLowerCase();
    services[serviceName] = {
      id: ms.serviceUserId,
      email: ms.serviceEmail,
      username: ms.serviceUserName,
      connected: ms.connectedAt
    };
  });
  
  let level: UserLevel = 'guest';
  if (dbUser.verified && dbUser.worldId && !dbUser.worldId.startsWith('temp_')) {
    level = 'verified';
  } else if (dbUser.musicServices?.length > 0) {
    level = 'music';
  }
  
  return {
    id: dbUser.id,
    primaryId: dbUser.primaryId || dbUser.id,
    displayName: dbUser.displayName || 'Music Lover',
    avatar: dbUser.avatar,
    email: dbUser.email,
    level,
    services,
    worldId: dbUser.worldId?.startsWith('temp_') ? undefined : dbUser.worldId,
    verified: dbUser.verified,
    createdAt: dbUser.createdAt,
    lastSeen: dbUser.updatedAt,
    partiesCreated: dbUser._count?.createdParties || 0,
    tracksAdded: dbUser._count?.addedTracks || 0
  };
}
