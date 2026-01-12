import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CreateTodoInput } from '@/types'

// POST /api/todos - Create a new todo
export async function POST(request: Request) {
  try {
    const body: CreateTodoInput = await request.json()
    const { weekId, content, dueDate, parentId } = body

    if (!weekId || !content || !dueDate) {
      return NextResponse.json(
        { error: 'weekId, content, and dueDate are required' },
        { status: 400 }
      )
    }

    // Verify week exists
    const week = await prisma.week.findUnique({
      where: { id: weekId },
    })

    if (!week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      )
    }

    // Validate dueDate is within week range
    const dueDateObj = new Date(dueDate)
    if (dueDateObj < week.startDate || dueDateObj > week.endDate) {
      return NextResponse.json(
        { error: 'Due date must be within the week range' },
        { status: 400 }
      )
    }

    // Get the highest order value for this date and parent
    const lastTodo = await prisma.todo.findFirst({
      where: {
        weekId,
        dueDate: dueDateObj,
        parentId: parentId || null,
      },
      orderBy: { order: 'desc' },
    })

    const newOrder = (lastTodo?.order ?? -1) + 1

    const todo = await prisma.todo.create({
      data: {
        weekId,
        content,
        dueDate: dueDateObj,
        order: newOrder,
        parentId: parentId || null,
      },
    })

    return NextResponse.json({ todo }, { status: 201 })
  } catch (error) {
    console.error('Error creating todo:', error)
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    )
  }
}
