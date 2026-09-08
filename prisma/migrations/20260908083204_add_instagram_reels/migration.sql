-- CreateTable
CREATE TABLE "InstagramReel" (
    "id" TEXT NOT NULL,
    "caption" TEXT,
    "reelUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramReel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstagramReel_isActive_idx" ON "InstagramReel"("isActive");

-- CreateIndex
CREATE INDEX "InstagramReel_sortOrder_idx" ON "InstagramReel"("sortOrder");
