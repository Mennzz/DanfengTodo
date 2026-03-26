import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, getCategoryFilter } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { CreateCategoryInput } from '@/types'

// GET /api/categories - Get all categories visible to the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: getCategoryFilter(session.user.id, session.user.role),
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category owned by the current user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateCategoryInput = await request.json()
    const { name, color = '#3B82F6' } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const lastCategory = await prisma.category.findFirst({
      orderBy: { order: 'desc' },
    })

    const newOrder = (lastCategory?.order ?? -1) + 1

    const category = await prisma.category.create({
      data: {
        name,
        color,
        order: newOrder,
        isDefault: false,
        ownerId: session.user.id,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
