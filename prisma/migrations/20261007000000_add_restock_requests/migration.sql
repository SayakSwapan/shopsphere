CREATE TYPE "RestockRequestStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'NOTIFIED', 'EXPIRED');
CREATE TYPE "RestockNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

CREATE TABLE "restockrequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "sizeId" TEXT,
    "userId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "RestockRequestStatus" NOT NULL DEFAULT 'ACTIVE',
    "notificationStatus" "RestockNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    CONSTRAINT "restockrequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "restockrequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "restockrequest_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "productvariant"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "restockrequest_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "size"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "restockrequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "restockrequest_productId_status_idx"
    ON "restockrequest" ("productId", "status");
CREATE INDEX "restockrequest_userId_status_idx"
    ON "restockrequest" ("userId", "status");
CREATE INDEX "restockrequest_variantId_status_idx"
    ON "restockrequest" ("variantId", "status");
CREATE INDEX "restockrequest_sizeId_status_idx"
    ON "restockrequest" ("sizeId", "status");
CREATE INDEX "restockrequest_notificationStatus_status_idx"
    ON "restockrequest" ("notificationStatus", "status");
CREATE INDEX "restockrequest_guestPhone_status_idx"
    ON "restockrequest" ("guestPhone", "status");
CREATE INDEX "restockrequest_createdAt_idx"
    ON "restockrequest" ("createdAt");
