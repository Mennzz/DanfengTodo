import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planId, content } = body

    if (!planId || typeof planId !== 'string') {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    // Get the current max order for this plan
    const maxOrderTask = await prisma.planTask.findFirst({
      where: { planId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = maxOrderTask ? maxOrderTask.order + 1 : 0

    const task = await prisma.planTask.create({
      data: {
        planId,
        content: content.trim(),
        order: nextOrder,
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating plan task:', error)
    return NextResponse.json(
      { error: 'Failed to create plan task' },
      { status: 500 }
    )
  }
}
