'use client'

import React from 'react'
import { useTodoContext } from '../providers/TodoProvider'
import { formatWeekDisplay, isCurrentWeek } from '@/lib/dateUtils'

export function WeekPanel() {
  const { weeks, selectedWeek, selectWeek, selectedCategory, isLoadingWeeks } = useTodoContext()

  if (!selectedCategory) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
          Select a category
        </p>
      </div>
    )
  }

  if (isLoadingWeeks) {
    return (
      <div className="h-full bg-white dark:bg-gray-900">
        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (weeks.length === 0) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
          Generating weeks...
        </p>
      </div>
    )
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Week List - OneNote Style */}
      <div className="flex-1 overflow-y-auto">
        {weeks.map((week) => {
          const isCurrent = isCurrentWeek(new Date(week.startDate))
          const isSelected = selectedWeek?.id === week.id

          return (
            <button
              key={week.id}
              onClick={() => selectWeek(week.id)}
              className={`
                w-full px-4 py-3 text-left transition-colors
                ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              <div className="text-sm text-gray-900 dark:text-gray-100">
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
