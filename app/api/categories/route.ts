import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CreateCategoryInput } from '@/types'

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
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

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  try {
    const body: CreateCategoryInput = await request.json()
    const { name, color = '#3B82F6' } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Get the highest order value
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
