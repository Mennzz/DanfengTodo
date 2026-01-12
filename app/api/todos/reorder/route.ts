import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ReorderUpdate {
  id: string
  order: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { updates } = body as { updates: ReorderUpdate[] }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Missing or invalid updates array' },
        { status: 400 }
      )
    }

    // Update all todos in a transaction
    await prisma.$transaction(
      updates.map((update) =>
        prisma.todo.update({
          where: { id: update.id },
          data: { order: update.order },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering todos:', error)
    return NextResponse.json(
      { error: 'Failed to reorder todos' },
      { status: 500 }
    )
  }
}
