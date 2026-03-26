import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

async function getOwnedCategory(categoryId: string, userId: string, role: Role) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  })
  if (!category) return null
  if (role === Role.ADMIN || category.ownerId === userId) return category
  return null
}

// GET /api/categories/[id]/shares - List users this category is shared with
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const category = await getOwnedCategory(id, session.user.id, session.user.role)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const shares = await prisma.categoryShare.findMany({
      where: { categoryId: id },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ shares })
  } catch (error) {
    console.error('Error fetching shares:', error)
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
  }
}

// POST /api/categories/[id]/shares - Share with a user by email
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const category = await getOwnedCategory(id, session.user.id, session.user.role)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.id === category.ownerId) {
      return NextResponse.json(
        { error: 'Cannot share with the category owner' },
        { status: 400 }
      )
    }

    const share = await prisma.categoryShare.create({
      data: { categoryId: id, userId: targetUser.id },
      include: { user: { select: { id: true, email: true, name: true } } },
    })

    return NextResponse.json({ share }, { status: 201 })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Already shared with this user' }, { status: 409 })
    }
    console.error('Error creating share:', error)
    return NextResponse.json({ error: 'Failed to share category' }, { status: 500 })
  }
}

// DELETE /api/categories/[id]/shares - Remove a share by userId
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const category = await getOwnedCategory(id, session.user.id, session.user.role)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    await prisma.categoryShare.deleteMany({
      where: { categoryId: id, userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing share:', error)
    return NextResponse.json({ error: 'Failed to remove share' }, { status: 500 })
  }
}
