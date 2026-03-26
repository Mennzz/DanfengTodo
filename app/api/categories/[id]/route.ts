import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import type { UpdateCategoryInput } from '@/types'

async function getAccessibleCategory(id: string, userId: string, role: Role) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { shares: { select: { userId: true } } },
  })

  if (!category) return null

  const hasAccess =
    role === Role.ADMIN ||
    category.ownerId === userId ||
    category.shares.some((s) => s.userId === userId)

  return hasAccess ? category : null
}

// GET /api/categories/[id]
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

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PATCH /api/categories/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getAccessibleCategory(id, session.user.id, session.user.role)

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const body: UpdateCategoryInput = await request.json()
    const { name, color, order } = body

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order }),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - only owner or admin
export async function DELETE(
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

    const canDelete =
      session.user.role === Role.ADMIN || category.ownerId === session.user.id

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Only the owner can delete this category' },
        { status: 403 }
      )
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default categories' },
        { status: 403 }
      )
    }

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
