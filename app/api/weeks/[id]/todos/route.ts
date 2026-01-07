import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDateHeader, formatDateForAPI, getWeekDates } from '@/lib/dateUtils'
import type { TodosByDate } from '@/types'

// GET /api/weeks/[id]/todos - Get todos for a week, grouped by date
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the week
    const week = await prisma.week.findUnique({
      where: { id: params.id },
    })

    if (!week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      )
    }

    // Get all todos for this week
    const todos = await prisma.todo.findMany({
      where: { weekId: params.id },
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
