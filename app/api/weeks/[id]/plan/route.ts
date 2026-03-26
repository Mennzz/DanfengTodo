import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessibleWeek } from '@/lib/access'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const week = await getAccessibleWeek(id, session.user.id, session.user.role)
    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    const plan = await prisma.weekPlan.findUnique({
      where: { weekId: id },
      include: { tasks: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error fetching week plan:', error)
    return NextResponse.json({ error: 'Failed to fetch week plan' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const week = await getAccessibleWeek(id, session.user.id, session.user.role)
    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    const { mainGoal } = await request.json()
    if (typeof mainGoal !== 'string') {
      return NextResponse.json({ error: 'mainGoal must be a string' }, { status: 400 })
    }

    const plan = await prisma.weekPlan.upsert({
      where: { weekId: id },
      update: { mainGoal },
      create: { weekId: id, mainGoal },
      include: { tasks: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error updating week plan:', error)
    return NextResponse.json({ error: 'Failed to update week plan' }, { status: 500 })
  }
}
