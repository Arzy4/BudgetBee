-- Enable PostgreSQL UUID generation support.
-- gen_random_uuid() is available in modern PostgreSQL.

-- Step 1: Add the column as nullable.
ALTER TABLE "password_resets"
ADD COLUMN "requestId" TEXT;

-- Step 2: Generate UUIDs for existing records.
UPDATE "password_resets"
SET "requestId" = gen_random_uuid()::text
WHERE "requestId" IS NULL;

-- Step 3: Make the column required.
ALTER TABLE "password_resets"
ALTER COLUMN "requestId" SET NOT NULL;

-- Step 4: Enforce uniqueness.
CREATE UNIQUE INDEX "password_resets_requestId_key"
ON "password_resets"("requestId");