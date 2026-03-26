import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessibleCategory } from '@/lib/access'
import { prisma } from '@/lib/prisma'
import { generateWeeks, getCurrentWeekStart } from '@/lib/weekGenerator'
import type { GenerateWeeksInput } from '@/types'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateWeeksInput = await request.json()
    const { categoryId, weeksAhead = 12, year } = body

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
    }

    if (year !== undefined && (typeof year !== 'number' || year < 2000 || year > 2100)) {
      return NextResponse.json({ error: 'year must be between 2000 and 2100' }, { status: 400 })
    }

    const category = await getAccessibleCategory(categoryId, session.user.id, session.user.role)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    let startDate: Date
    let weeksToGenerate = weeksAhead

    if (year) {
      startDate = new Date(year, 0, 1)
      weeksToGenerate = 52
    } else {
      const lastWeek = await prisma.week.findFirst({
        where: { categoryId },
        orderBy: { startDate: 'desc' },
      })

      if (lastWeek) {
        startDate = new Date(lastWeek.endDate)
        startDate.setDate(startDate.getDate() + 1)
      } else {
        startDate = getCurrentWeekStart()
      }
    }

    const weeksData = generateWeeks(startDate, weeksToGenerate)

    const createdWeeks = await prisma.$transaction(
      weeksData.map((week) =>
        prisma.week.upsert({
          where: { categoryId_startDate: { categoryId, startDate: week.startDate } },
          update: {},
          create: {
            categoryId,
            startDate: week.startDate,
            endDate: week.endDate,
            weekNumber: week.weekNumber,
            year: week.year,
          },
        })
      )
    )

    await prisma.weekGenerationLog.upsert({
      where: { categoryId },
      update: { lastGeneratedAt: new Date(), weeksGenerated: { increment: createdWeeks.length } },
      create: { categoryId, weeksGenerated: createdWeeks.length },
    })

    return NextResponse.json({ weeksCreated: createdWeeks.length, weeks: createdWeeks })
  } catch (error) {
    console.error('Error generating weeks:', error)
    return NextResponse.json({ error: 'Failed to generate weeks' }, { status: 500 })
  }
}
