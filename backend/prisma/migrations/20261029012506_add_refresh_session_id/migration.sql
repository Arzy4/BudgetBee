-- Step 1: Add sessionId as a nullable column
ALTER TABLE "refresh_sessions"
ADD COLUMN "sessionId" TEXT;

-- Step 2: Generate a unique UUID for existing sessions
UPDATE "refresh_sessions"
SET "sessionId" = gen_random_uuid()::text
WHERE "sessionId" IS NULL;

-- Step 3: Make sessionId required
ALTER TABLE "refresh_sessions"
ALTER COLUMN "sessionId" SET NOT NULL;

-- Step 4: Add a unique constraint
CREATE UNIQUE INDEX "refresh_sessions_sessionId_key"
ON "refresh_sessions"("sessionId");