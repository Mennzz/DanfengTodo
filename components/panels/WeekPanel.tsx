'use client'

import React from 'react'
import { useTodoContext } from '../providers/TodoProvider'
import { formatWeekDisplay } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

export function WeekPanel() {
  const { weeks, selectedWeek, selectWeek, selectedCategory, selectedYear, isLoadingWeeks } =
    useTodoContext()

  if (!selectedCategory) {
    return (
      <div className="h-full bg-card flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a category
        </p>
      </div>
    )
  }

  if (isLoadingWeeks) {
    return (
      <div className="h-full bg-card">
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (weeks.length === 0) {
    return (
      <div className="h-full bg-card flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          No weeks for {selectedYear}
          <br />
          <span className="text-xs">Generating...</span>
        </p>
      </div>
    )
  }

  return (
    <div className="h-full bg-card flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-muted-foreground">
          {selectedCategory.name} - {selectedYear}
        </p>
      </div>

      {/* Week List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {weeks.map((week) => {
          const isSelected = selectedWeek?.id === week.id

          return (
            <button
              key={week.id}
              onClick={() => selectWeek(week.id)}
              className={cn(
                "w-full px-4 py-3 mb-1 text-left transition-all rounded-md",
                isSelected
                  ? 'bg-accent'
                  : 'hover:bg-accent/50'
              )}
            >
              <div className="text-sm text-foreground">
                {formatWeekDisplay(
                  new Date(week.startDate),
                  new Date(week.endDate),
                  week.weekNumber
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
