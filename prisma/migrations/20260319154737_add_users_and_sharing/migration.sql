-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Seed admin user (password: changeme — update via app before going to production)
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "createdAt", "updatedAt")
VALUES (
    'admin-user-seed-id',
    'admin@danfengtodo.com',
    'Admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- AlterTable: add ownerId as nullable first so we can backfill
ALTER TABLE "Category" ADD COLUMN "ownerId" TEXT;

-- Backfill: assign all existing categories to the admin user
UPDATE "Category" SET "ownerId" = 'admin-user-seed-id';

-- Now enforce NOT NULL
ALTER TABLE "Category" ALTER COLUMN "ownerId" SET NOT NULL;

-- CreateTable: CategoryShare
CREATE TABLE "CategoryShare" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryShare_userId_idx" ON "CategoryShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryShare_categoryId_userId_key" ON "CategoryShare"("categoryId", "userId");

-- CreateIndex
CREATE INDEX "Category_ownerId_idx" ON "Category"("ownerId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryShare" ADD CONSTRAINT "CategoryShare_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryShare" ADD CONSTRAINT "CategoryShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
