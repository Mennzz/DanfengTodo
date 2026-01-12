import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reflection = await prisma.weekReflection.findUnique({
      where: { weekId: id },
    })

    return NextResponse.json({ reflection })
  } catch (error) {
    console.error('Error fetching week reflection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch week reflection' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content } = body

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' },
        { status: 400 }
      )
    }

    const reflection = await prisma.weekReflection.upsert({
      where: { weekId: id },
      update: {
        content,
      },
      create: {
        weekId: id,
        content,
      },
    })

    return NextResponse.json({ reflection })
  } catch (error) {
    console.error('Error updating week reflection:', error)
    return NextResponse.json(
      { error: 'Failed to update week reflection' },
      { status: 500 }
    )
  }
}
