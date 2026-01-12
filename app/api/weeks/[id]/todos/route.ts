import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDateHeader, formatDateForAPI, getWeekDates } from '@/lib/dateUtils'
import type { TodosByDate } from '@/types'

// GET /api/weeks/[id]/todos - Get todos for a week, grouped by date
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get the week
    const week = await prisma.week.findUnique({
      where: { id },
    })

    if (!week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      )
    }

    // Get all todos for this week (only top-level, with subtasks included)
    const todos = await prisma.todo.findMany({
      where: {
        weekId: id,
        parentId: null, // Only get top-level todos
      },
      include: {
        subtasks: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { order: 'asc' }],
    })

    // Get all dates in the week
    const weekDates = getWeekDates(week.startDate)

    // Group todos by date
    const todosByDate: TodosByDate[] = weekDates.map((date) => {
      const dateStr = formatDateForAPI(date)
      const dateTodos = todos.filter(
        (todo) => formatDateForAPI(new Date(todo.dueDate)) === dateStr
      )

      return {
        date: dateStr,
        dateFormatted: formatDateHeader(date),
        todos: dateTodos,
      }
    })

    return NextResponse.json({
      dates: todosByDate,
    })
  } catch (error) {
    console.error('Error fetching todos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    )
  }
}
