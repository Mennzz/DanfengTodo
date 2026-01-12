import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateWeeks, getCurrentWeekStart } from '@/lib/weekGenerator'
import type { GenerateWeeksInput } from '@/types'

// POST /api/weeks/generate - Auto-generate weeks for a category
export async function POST(request: Request) {
  try {
    const body: GenerateWeeksInput = await request.json()
    const { categoryId, weeksAhead = 12, year } = body

    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Determine start date for generation
    let startDate: Date
    let weeksToGenerate = weeksAhead

    if (year) {
      // If year is specified, start from January 1st of that year
      startDate = new Date(year, 0, 1)
      // Generate 52 weeks for the full year
      weeksToGenerate = 52
    } else {
      // Find the last week for this category
      const lastWeek = await prisma.week.findFirst({
        where: { categoryId },
        orderBy: { startDate: 'desc' },
      })

      if (lastWeek) {
        // Start from the week after the last one
        startDate = new Date(lastWeek.endDate)
        startDate.setDate(startDate.getDate() + 1)
      } else {
        // Start from current week
        startDate = getCurrentWeekStart()
      }
    }

    // Generate weeks
    const weeksData = generateWeeks(startDate, weeksToGenerate)

    // Create weeks in database
    const createdWeeks = await prisma.$transaction(
      weeksData.map((week) =>
        prisma.week.upsert({
          where: {
            categoryId_startDate: {
              categoryId,
              startDate: week.startDate,
            },
          },
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

    // Update generation log
    await prisma.weekGenerationLog.upsert({
      where: { categoryId },
      update: {
        lastGeneratedAt: new Date(),
        weeksGenerated: { increment: createdWeeks.length },
      },
      create: {
        categoryId,
        weeksGenerated: createdWeeks.length,
      },
    })

    return NextResponse.json({
      weeksCreated: createdWeeks.length,
      weeks: createdWeeks,
    })
  } catch (error) {
    console.error('Error generating weeks:', error)
    return NextResponse.json(
      { error: 'Failed to generate weeks' },
      { status: 500 }
    )
  }
}
