import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessibleDayTag } from '@/lib/access'
import { prisma } from '@/lib/prisma'

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
    const existing = await getAccessibleDayTag(id, session.user.id, session.user.role)
    if (!existing) {
      return NextResponse.json({ error: 'Day tag not found' }, { status: 404 })
    }

    await prisma.dayTag.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting day tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete day tag' },
      { status: 500 }
    )
  }
}
