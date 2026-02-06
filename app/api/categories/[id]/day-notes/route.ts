import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories/[id]/day-notes - Get day notes for a category within a date range
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const dayNotes = await prisma.dayNote.findMany({
      where: {
        categoryId: id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ dayNotes })
  } catch (error) {
    console.error('Error fetching day notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch day notes' },
      { status: 500 }
    )
  }
}

// POST /api/categories/[id]/day-notes - Create or update a day note
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { date, content } = body

    if (!date || content === undefined) {
      return NextResponse.json(
        { error: 'date and content are required' },
        { status: 400 }
      )
    }

    const dayNote = await prisma.dayNote.upsert({
      where: {
        categoryId_date: {
          categoryId: id,
          date: new Date(date),
        },
      },
      update: {
        content,
      },
      create: {
        categoryId: id,
        date: new Date(date),
        content,
      },
    })

    return NextResponse.json({ dayNote }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating day note:', error)
    return NextResponse.json(
      { error: 'Failed to create/update day note' },
      { status: 500 }
    )
  }
}
