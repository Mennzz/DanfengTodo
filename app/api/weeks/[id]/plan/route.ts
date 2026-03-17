import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const plan = await prisma.weekPlan.findUnique({
      where: { weekId: id },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error fetching week plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch week plan' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { mainGoal } = body

    if (typeof mainGoal !== 'string') {
      return NextResponse.json(
        { error: 'mainGoal must be a string' },
        { status: 400 }
      )
    }

    const plan = await prisma.weekPlan.upsert({
      where: { weekId: id },
      update: { mainGoal },
      create: { weekId: id, mainGoal },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error updating week plan:', error)
    return NextResponse.json(
      { error: 'Failed to update week plan' },
      { status: 500 }
    )
  }
}
