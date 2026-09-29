CREATE TABLE "visitorSession" (
    "id" VARCHAR(36) NOT NULL,
    "visitorId" VARCHAR(36) NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "deviceType" VARCHAR(16) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitorSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "visitorSession_createdAt_idx" ON "visitorSession"("createdAt");
CREATE INDEX "visitorSession_ipAddress_createdAt_idx" ON "visitorSession"("ipAddress", "createdAt");
CREATE INDEX "visitorSession_visitorId_createdAt_idx" ON "visitorSession"("visitorId", "createdAt");