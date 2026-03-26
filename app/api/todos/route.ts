import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessibleWeek } from '@/lib/access'
import { prisma } from '@/lib/prisma'
import type { CreateTodoInput } from '@/types'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateTodoInput = await request.json()
    const { weekId, content, dueDate, parentId } = body

    if (!weekId || !content || !dueDate) {
      return NextResponse.json(
        { error: 'weekId, content, and dueDate are required' },
        { status: 400 }
      )
    }

    const week = await getAccessibleWeek(weekId, session.user.id, session.user.role)
    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    const dueDateObj = new Date(dueDate)
    if (dueDateObj < week.startDate || dueDateObj > week.endDate) {
      return NextResponse.json(
        { error: 'Due date must be within the week range' },
        { status: 400 }
      )
    }

    const lastTodo = await prisma.todo.findFirst({
      where: { weekId, dueDate: dueDateObj, parentId: parentId || null },
      orderBy: { order: 'desc' },
    })

    const todo = await prisma.todo.create({
      data: {
        weekId,
        content,
        dueDate: dueDateObj,
        order: (lastTodo?.order ?? -1) + 1,
        parentId: parentId || null,
      },
    })

    return NextResponse.json({ todo }, { status: 201 })
  } catch (error) {
    console.error('Error creating todo:', error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}
