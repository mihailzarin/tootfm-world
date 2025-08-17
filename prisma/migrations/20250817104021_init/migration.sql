-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "credentialType" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Party" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartyMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Track" (
    "id" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "albumArt" TEXT,
    "duration" INTEGER NOT NULL,
    "partyId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voteCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_worldId_key" ON "public"."User"("worldId");

-- CreateIndex
CREATE UNIQUE INDEX "Party_code_key" ON "public"."Party"("code");

-- CreateIndex
CREATE INDEX "Party_code_idx" ON "public"."Party"("code");

-- CreateIndex
CREATE INDEX "Party_creatorId_idx" ON "public"."Party"("creatorId");

-- CreateIndex
CREATE INDEX "PartyMember_partyId_idx" ON "public"."PartyMember"("partyId");

-- CreateIndex
CREATE INDEX "PartyMember_userId_idx" ON "public"."PartyMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PartyMember_userId_partyId_key" ON "public"."PartyMember"("userId", "partyId");

-- CreateIndex
CREATE INDEX "Track_partyId_idx" ON "public"."Track"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "Track_spotifyId_partyId_key" ON "public"."Track"("spotifyId", "partyId");

-- CreateIndex
CREATE INDEX "Vote_trackId_idx" ON "public"."Vote"("trackId");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "public"."Vote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_trackId_key" ON "public"."Vote"("userId", "trackId");

-- AddForeignKey
ALTER TABLE "public"."Party" ADD CONSTRAINT "Party_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartyMember" ADD CONSTRAINT "PartyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartyMember" ADD CONSTRAINT "PartyMember_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Track" ADD CONSTRAINT "Track_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "public"."Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "public"."Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
