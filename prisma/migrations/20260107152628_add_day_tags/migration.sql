-- CreateTable
CREATE TABLE "DayTag" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DayTag_categoryId_date_idx" ON "DayTag"("categoryId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DayTag_categoryId_date_key" ON "DayTag"("categoryId", "date");

-- AddForeignKey
ALTER TABLE "DayTag" ADD CONSTRAINT "DayTag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
