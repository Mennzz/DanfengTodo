import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessibleTodo } from '@/lib/access'
import { prisma } from '@/lib/prisma'
import type { UpdateTodoInput } from '@/types'

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
    const existing = await getAccessibleTodo(id, session.user.id, session.user.role)
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    const body: UpdateTodoInput = await request.json()
    const { content, completed, order } = body

    const updateData: Record<string, unknown> = {}
    if (content !== undefined) updateData.content = content
    if (order !== undefined) updateData.order = order
    if (completed !== undefined) {
      updateData.completed = completed
      updateData.completedAt = completed ? new Date() : null
    }

    const todo = await prisma.todo.update({ where: { id }, data: updateData })
    return NextResponse.json({ todo })
  } catch (error) {
    console.error('Error updating todo:', error)
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
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
    const existing = await getAccessibleTodo(id, session.user.id, session.user.role)
    if (!existing) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    await prisma.todo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
