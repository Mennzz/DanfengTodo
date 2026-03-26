import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { verifyAllPlanTasksAccessible } from '@/lib/access'
import { prisma } from '@/lib/prisma'

interface ReorderUpdate {
  id: string
  order: number
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body as { updates: ReorderUpdate[] }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Missing or invalid updates array' },
        { status: 400 }
      )
    }

    const ids = updates.map((u) => u.id)
    const allAccessible = await verifyAllPlanTasksAccessible(ids, session.user.id, session.user.role)
    if (!allAccessible) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.$transaction(
      updates.map((update) =>
        prisma.planTask.update({
          where: { id: update.id },
          data: { order: update.order },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering plan tasks:', error)
    return NextResponse.json(
      { error: 'Failed to reorder plan tasks' },
      { status: 500 }
    )
  }
}
