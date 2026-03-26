import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessiblePlanTask, getAccessibleWeek } from '@/lib/access'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { day, weekId } = body

    if (!day || typeof day !== 'string') {
      return NextResponse.json({ error: 'Missing day (ISO date string)' }, { status: 400 })
    }
    if (!weekId || typeof weekId !== 'string') {
      return NextResponse.json({ error: 'Missing weekId' }, { status: 400 })
    }

    const [planTask, week] = await Promise.all([
      getAccessiblePlanTask(id, session.user.id, session.user.role),
      getAccessibleWeek(weekId, session.user.id, session.user.role),
    ])

    if (!planTask) {
      return NextResponse.json({ error: 'Plan task not found' }, { status: 404 })
    }
    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    // If already assigned, delete the old todo first
    if (planTask.todoId) {
      await prisma.todo.deleteMany({ where: { id: planTask.todoId } })
    }

    // Get next order for todos on that day
    const maxOrderTodo = await prisma.todo.findFirst({
      where: {
        weekId,
        dueDate: {
          gte: new Date(day),
          lt: new Date(new Date(day).getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = maxOrderTodo ? maxOrderTodo.order + 1 : 0

    // Create the todo
    const todo = await prisma.todo.create({
      data: {
        weekId,
        content: planTask.content,
        dueDate: new Date(day),
        order: nextOrder,
      },
    })

    // Update the plan task with the assignment
    const task = await prisma.planTask.update({
      where: { id },
      data: {
        assignedDay: day,
        todoId: todo.id,
      },
    })

    return NextResponse.json({ task, todo })
  } catch (error) {
    console.error('Error assigning plan task:', error)
    return NextResponse.json(
      { error: 'Failed to assign plan task' },
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
    const planTask = await getAccessiblePlanTask(id, session.user.id, session.user.role)
    if (!planTask) {
      return NextResponse.json({ error: 'Plan task not found' }, { status: 404 })
    }

    // Delete the linked todo if it exists
    if (planTask.todoId) {
      await prisma.todo.deleteMany({ where: { id: planTask.todoId } })
    }

    // Clear the assignment on the plan task
    const task = await prisma.planTask.update({
      where: { id },
      data: {
        assignedDay: null,
        todoId: null,
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error unassigning plan task:', error)
    return NextResponse.json(
      { error: 'Failed to unassign plan task' },
      { status: 500 }
    )
  }
}
