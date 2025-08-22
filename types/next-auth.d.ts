import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      googleId?: string | null;
      worldId?: string | null;
      verified?: boolean;
      connectedServices?: {
        google: boolean;
        spotify: boolean;
        lastfm: boolean;
        apple: boolean;
      };
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    googleId?: string | null;
    worldId?: string | null;
    verified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    provider?: string;
    providerAccountId?: string;
  }
}