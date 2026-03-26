import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessiblePlanTask } from '@/lib/access'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getAccessiblePlanTask(id, session.user.id, session.user.role)
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content, order, assignedDay, todoId } = body

    const updateData: Record<string, unknown> = {}
    if (typeof content === 'string') updateData.content = content.trim()
    if (typeof order === 'number') updateData.order = order
    if ('assignedDay' in body) updateData.assignedDay = assignedDay
    if ('todoId' in body) updateData.todoId = todoId

    const task = await prisma.planTask.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating plan task:', error)
    return NextResponse.json(
      { error: 'Failed to update plan task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getAccessiblePlanTask(id, session.user.id, session.user.role)
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete the linked todo if it exists
    if (existing.todoId) {
      await prisma.todo.deleteMany({ where: { id: existing.todoId } })
    }

    await prisma.planTask.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting plan task:', error)
    return NextResponse.json(
      { error: 'Failed to delete plan task' },
      { status: 500 }
    )
  }
}
