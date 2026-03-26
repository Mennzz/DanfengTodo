import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessibleWeek } from '@/lib/access'
import { prisma } from '@/lib/prisma'
import { formatDateHeader, formatDateForAPI, getWeekDates } from '@/lib/dateUtils'
import type { TodosByDate } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const week = await getAccessibleWeek(id, session.user.id, session.user.role)
    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    const todos = await prisma.todo.findMany({
      where: { weekId: id, parentId: null },
      include: { subtasks: { orderBy: { order: 'asc' } } },
      orderBy: [{ dueDate: 'asc' }, { order: 'asc' }],
    })

    const weekDates = getWeekDates(week.startDate)
    const todosByDate: TodosByDate[] = weekDates.map((date) => {
      const dateStr = formatDateForAPI(date)
      return {
        date: dateStr,
        dateFormatted: formatDateHeader(date),
        todos: todos.filter(
          (todo) => formatDateForAPI(new Date(todo.dueDate)) === dateStr
        ),
      }
    })

    return NextResponse.json({ dates: todosByDate })
  } catch (error) {
    console.error('Error fetching todos:', error)
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}
