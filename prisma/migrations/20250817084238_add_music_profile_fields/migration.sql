-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "spotifyId" TEXT,
    "spotifyToken" TEXT,
    "spotifyRefreshToken" TEXT,
    "spotifyTokenExpiry" DATETIME,
    "appleMusicId" TEXT,
    "appleMusicToken" TEXT,
    "youtubeId" TEXT,
    "youtubeToken" TEXT,
    "youtubeRefreshToken" TEXT,
    "youtubeTokenExpiry" DATETIME,
    "lastfmUsername" TEXT,
    "lastfmKey" TEXT,
    "lastfmScrobbling" BOOLEAN NOT NULL DEFAULT true,
    "preferredService" TEXT
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "allowSpotify" BOOLEAN NOT NULL DEFAULT true,
    "allowAppleMusic" BOOLEAN NOT NULL DEFAULT true,
    "allowYouTube" BOOLEAN NOT NULL DEFAULT true,
    "hostService" TEXT,
    "enableScrobbling" BOOLEAN NOT NULL DEFAULT true,
    "shareStats" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "hostId" TEXT NOT NULL,
    "currentTrackId" TEXT,
    CONSTRAINT "Party_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Participant_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "thumbnail" TEXT,
    "spotifyUri" TEXT,
    "appleId" TEXT,
    "youtubeId" TEXT,
    "lastfmUrl" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "source" TEXT NOT NULL,
    "playedAt" DATETIME,
    "position" INTEGER NOT NULL DEFAULT 0,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partyId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    CONSTRAINT "Track_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scrobble" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    CONSTRAINT "Scrobble_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scrobble_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MusicProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "musicPersonality" TEXT,
    "energyLevel" INTEGER NOT NULL DEFAULT 50,
    "diversityScore" INTEGER NOT NULL DEFAULT 50,
    "listeningHours" INTEGER NOT NULL DEFAULT 0,
    "topGenres" TEXT,
    "topArtists" TEXT,
    "topTracks" TEXT,
    "audioFeatures" TEXT,
    "genreDistribution" TEXT,
    "totalScrobbles" INTEGER NOT NULL DEFAULT 0,
    "weeklyAverage" INTEGER NOT NULL DEFAULT 0,
    "favoriteTime" TEXT,
    "compatibility" REAL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAnalyzed" DATETIME,
    "userId" TEXT NOT NULL,
    CONSTRAINT "MusicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Vote_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserTrack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "duration" INTEGER,
    "popularity" INTEGER,
    "imageUrl" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 1,
    "lastPlayed" DATETIME,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserArtist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genres" TEXT,
    "popularity" INTEGER,
    "imageUrl" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 1,
    "rank" INTEGER,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserGenre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "genre" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "trackCount" INTEGER NOT NULL DEFAULT 0,
    "artistCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserGenre_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_worldId_key" ON "User"("worldId");

-- CreateIndex
CREATE UNIQUE INDEX "Party_code_key" ON "Party"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_userId_partyId_key" ON "Participant"("userId", "partyId");

-- CreateIndex
CREATE INDEX "Scrobble_userId_timestamp_idx" ON "Scrobble"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MusicProfile_userId_key" ON "MusicProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_trackId_key" ON "Vote"("userId", "trackId");

-- CreateIndex
CREATE INDEX "UserTrack_userId_service_idx" ON "UserTrack"("userId", "service");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrack_userId_externalId_service_key" ON "UserTrack"("userId", "externalId", "service");

-- CreateIndex
CREATE INDEX "UserArtist_userId_service_idx" ON "UserArtist"("userId", "service");

-- CreateIndex
CREATE UNIQUE INDEX "UserArtist_userId_externalId_service_key" ON "UserArtist"("userId", "externalId", "service");

-- CreateIndex
CREATE INDEX "UserGenre_userId_idx" ON "UserGenre"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGenre_userId_genre_key" ON "UserGenre"("userId", "genre");
