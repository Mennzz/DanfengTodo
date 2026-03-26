import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAccessibleWeek } from '@/lib/access'
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
    const week = await getAccessibleWeek(id, session.user.id, session.user.role)
    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    const reflection = await prisma.weekReflection.findUnique({
      where: { weekId: id },
    })

    return NextResponse.json({ reflection })
  } catch (error) {
    console.error('Error fetching week reflection:', error)
    return NextResponse.json({ error: 'Failed to fetch week reflection' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const week = await getAccessibleWeek(id, session.user.id, session.user.role)
    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    const { content } = await request.json()
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 })
    }

    const reflection = await prisma.weekReflection.upsert({
      where: { weekId: id },
      update: { content },
      create: { weekId: id, content },
    })

    return NextResponse.json({ reflection })
  } catch (error) {
    console.error('Error updating week reflection:', error)
    return NextResponse.json({ error: 'Failed to update week reflection' }, { status: 500 })
  }
}
