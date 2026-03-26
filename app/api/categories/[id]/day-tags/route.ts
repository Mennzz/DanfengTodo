import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessibleCategory } from '@/lib/access'
import { prisma } from '@/lib/prisma'

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
    const category = await getAccessibleCategory(id, session.user.id, session.user.role)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { categoryId: id }

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
