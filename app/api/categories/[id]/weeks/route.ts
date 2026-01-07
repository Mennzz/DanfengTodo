import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories/[id]/weeks - Get weeks for a category
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = parseInt(searchParams.get('offset') || '0')

    const weeks = await prisma.week.findMany({
      where: { categoryId: params.id },
      orderBy: { startDate: 'asc' },
      skip: offset,
      take: limit,
    })

    const total = await prisma.week.count({
      where: { categoryId: params.id },
    })

    return NextResponse.json({
      weeks,
      total,
      hasMore: offset + weeks.length < total,
    })
  } catch (error) {
    console.error('Error fetching weeks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weeks' },
      { status: 500 }
    )
  }
}
