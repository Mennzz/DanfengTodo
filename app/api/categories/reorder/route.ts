import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/categories/reorder - Update order of categories
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids }: { ids: string[] } = await request.json()
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 })
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.category.updateMany({
          where: { id, ownerId: session.user.id },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error reordering categories:', error)
    return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 })
  }
}
