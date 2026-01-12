-- CreateTable
CREATE TABLE "WeekReflection" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeekReflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeekReflection_weekId_key" ON "WeekReflection"("weekId");

-- CreateIndex
CREATE INDEX "WeekReflection_weekId_idx" ON "WeekReflection"("weekId");

-- AddForeignKey
ALTER TABLE "WeekReflection" ADD CONSTRAINT "WeekReflection_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE CASCADE ON UPDATE CASCADE;
