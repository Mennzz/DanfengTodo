'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Todo } from '@/types'

interface DraggableTodoItemProps {
  todo: Todo
  children: React.ReactNode
  disabled?: boolean
  onContextMenu?: (e: React.MouseEvent) => void
}

export function DraggableTodoItem({ todo, children, disabled = false, onContextMenu }: DraggableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 sm:gap-3 group py-3 sm:py-2"
      onContextMenu={onContextMenu}
    >
      {/* Drag Handle */}
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="pt-1 cursor-grab active:cursor-grabbing opacity-0 sm:group-hover:opacity-100 touch-none transition-opacity md:opacity-0"
        >
          <GripVertical className="w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground" />
        </div>
      )}

      {/* Todo Content */}
      <div className="flex-1 flex items-start gap-3 sm:gap-4">
        {children}
      </div>
    </div>
  )
}
