import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { UpdateTodoInput } from '@/types'

// PATCH /api/todos/[id] - Update a todo
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateTodoInput = await request.json()
    const { content, completed, order } = body

    // Prepare update data
    const updateData: any = {}

    if (content !== undefined) updateData.content = content
    if (order !== undefined) updateData.order = order

    // Handle completion status
    if (completed !== undefined) {
      updateData.completed = completed
      // Set completedAt timestamp if marking as completed
      if (completed) {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    const todo = await prisma.todo.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ todo })
  } catch (error) {
    console.error('Error updating todo:', error)
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    )
  }
}

// DELETE /api/todos/[id] - Delete a todo
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.todo.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    )
  }
}
