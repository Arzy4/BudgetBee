-- AlterTable
ALTER TABLE "refresh_sessions" ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
