-- AlterTable
ALTER TABLE "TripLog" ADD COLUMN     "lastLatitude" DOUBLE PRECISION,
ADD COLUMN     "lastLongitude" DOUBLE PRECISION,
ADD COLUMN     "lastUpdatedAt" TIMESTAMP(3);
