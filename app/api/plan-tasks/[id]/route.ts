import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { id } = await params

    // Get the task first to check if it has a linked todo
    const task = await prisma.planTask.findUnique({
      where: { id },
      select: { todoId: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete the linked todo if it exists
    if (task.todoId) {
      await prisma.todo.deleteMany({ where: { id: task.todoId } })
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
