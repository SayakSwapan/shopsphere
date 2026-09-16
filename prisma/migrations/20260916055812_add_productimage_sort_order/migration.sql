-- DropIndex
DROP INDEX "productimage_productId_idx";

-- AlterTable
ALTER TABLE "productimage" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill: number each product's existing gallery rows by their current
-- physical (insertion) order so the first row (the cover everyone already
-- renders) stays put and ordering becomes deterministic going forward.
UPDATE "productimage" p
SET "sortOrder" = r."rn" - 1
FROM (
    SELECT id, row_number() OVER (PARTITION BY "productId" ORDER BY ctid) AS "rn"
    FROM "productimage"
) r
WHERE p.id = r.id;

-- CreateIndex
CREATE INDEX "productimage_productId_sortOrder_idx" ON "productimage"("productId", "sortOrder");
