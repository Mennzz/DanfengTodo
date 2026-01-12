import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build the where clause
    const where: any = {
      categoryId: id,
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const dayTags = await prisma.dayTag.findMany({
      where,
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ dayTags })
  } catch (error) {
    console.error('Error fetching day tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch day tags' },
      { status: 500 }
    )
  }
}
