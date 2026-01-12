import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { categoryId, date, tag } = body

    // Validate required fields
    if (!categoryId || !date || !tag) {
      return NextResponse.json(
        { error: 'Missing required fields: categoryId, date, tag' },
        { status: 400 }
      )
    }

    // Validate tag value
    const validTags = ['Weekend', 'Vacation', 'Sick']
    if (!validTags.includes(tag)) {
      return NextResponse.json(
        { error: `Invalid tag. Must be one of: ${validTags.join(', ')}` },
        { status: 400 }
      )
    }

    // Upsert (create or update) the day tag
    const dayTag = await prisma.dayTag.upsert({
      where: {
        categoryId_date: {
          categoryId,
          date: new Date(date),
        },
      },
      update: {
        tag,
      },
      create: {
        categoryId,
        date: new Date(date),
        tag,
      },
    })

    return NextResponse.json({ dayTag }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating day tag:', error)
    return NextResponse.json(
      { error: 'Failed to create/update day tag' },
      { status: 500 }
    )
  }
}
