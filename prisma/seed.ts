import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create default categories
  const workDaily = await prisma.category.upsert({
    where: { id: 'work-daily-2025' },
    update: {},
    create: {
      id: 'work-daily-2025',
      name: 'Work Daily - 2025',
      color: '#DC2626', // Red
      isDefault: true,
      order: 0,
    },
  })

  const personalDaily = await prisma.category.upsert({
    where: { id: 'personal-daily-2025' },
    update: {},
    create: {
      id: 'personal-daily-2025',
      name: 'Personal Daily - 2025',
      color: '#7C3AED', // Purple
      isDefault: true,
      order: 1,
    },
  })

  console.log('Created default categories:')
  console.log('- Work Daily - 2025')
  console.log('- Personal Daily - 2025')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
