import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@danfengtodo.com' },
    update: {},
    create: {
      id: 'admin-user-seed-id',
      email: 'admin@danfengtodo.com',
      name: 'Admin',
      passwordHash: await bcrypt.hash('changeme', 10),
      role: 'ADMIN',
    },
  })

  // Create default categories owned by admin
  const workDaily = await prisma.category.upsert({
    where: { id: 'work-daily-2025' },
    update: {},
    create: {
      id: 'work-daily-2025',
      name: 'Work Daily - 2025',
      color: '#DC2626',
      isDefault: true,
      order: 0,
      ownerId: admin.id,
    },
  })

  const personalDaily = await prisma.category.upsert({
    where: { id: 'personal-daily-2025' },
    update: {},
    create: {
      id: 'personal-daily-2025',
      name: 'Personal Daily - 2025',
      color: '#7C3AED',
      isDefault: true,
      order: 1,
      ownerId: admin.id,
    },
  })

  console.log('Created default categories:')
  console.log(`- ${workDaily.name}`)
  console.log(`- ${personalDaily.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
