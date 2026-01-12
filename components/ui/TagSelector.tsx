'use client'

import React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DayTag, DayTagType } from '@/types'

interface TagSelectorProps {
  date: string
  currentTag?: DayTag | null
  onTagChange: (tag: DayTagType | null) => void
  disabled?: boolean
}

export function TagSelector({ date, currentTag, onTagChange, disabled = false }: TagSelectorProps) {
  const handleSelect = (tag: DayTagType | null) => {
    onTagChange(tag)
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'p-1 rounded hover:bg-accent transition-colors',
            currentTag && 'text-primary',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          title="Tag day"
        >
          <Tag className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[160px] bg-popover rounded-md p-1 shadow-md border border-border z-50"
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            className={cn(
              'text-sm rounded px-2 py-1.5 cursor-pointer outline-none',
              'hover:bg-accent focus:bg-accent',
              'transition-colors',
              !currentTag && 'text-muted-foreground'
            )}
            onSelect={() => handleSelect(null)}
          >
            {currentTag ? 'Remove tag' : 'No tag'}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-border my-1" />

          <DropdownMenu.Item
            className={cn(
              'text-sm rounded px-2 py-1.5 cursor-pointer outline-none',
              'hover:bg-accent focus:bg-accent',
              'transition-colors',
              'flex items-center gap-2'
            )}
            onSelect={() => handleSelect('Weekend')}
          >
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            Weekend
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={cn(
              'text-sm rounded px-2 py-1.5 cursor-pointer outline-none',
              'hover:bg-accent focus:bg-accent',
              'transition-colors',
              'flex items-center gap-2'
            )}
            onSelect={() => handleSelect('Vacation')}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Vacation
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={cn(
              'text-sm rounded px-2 py-1.5 cursor-pointer outline-none',
              'hover:bg-accent focus:bg-accent',
              'transition-colors',
              'flex items-center gap-2'
            )}
            onSelect={() => handleSelect('Sick')}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Sick
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
