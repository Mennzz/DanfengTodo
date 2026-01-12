import type { Category, DayTag, TodosByDate, TodosByDateWithTag } from '@/types'
import { formatDateHeader, parseAPIDate, formatDateForAPI } from './dateUtils'

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

/**
 * Check if a category is the work daily category
 */
export function isWorkDailyCategory(category: Category | null): boolean {
  if (!category) return false
  return category.name.toLowerCase().includes('work')
}

/**
 * Auto-generate weekend dates for a week
 * @param weekStartDate The start date of the week (Monday)
 * @returns Array of weekend dates (Saturday and Sunday)
 */
export function getWeekendDatesForWeek(weekStartDate: Date): Date[] {
  const dates: Date[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate)
    date.setDate(date.getDate() + i)

    if (isWeekend(date)) {
      dates.push(date)
    }
  }

  return dates
}

/**
 * Merge day tags with todos by date
 * @param todos Array of todos grouped by date
 * @param dayTags Array of day tags
 * @returns Todos with day tags attached and collapse state
 */
export function mergeDayTags(
  todos: TodosByDate[],
  dayTags: DayTag[]
): TodosByDateWithTag[] {
  return todos.map((dateGroup) => {
    const dayTag = dayTags.find(
      (tag) => formatDateForAPI(new Date(tag.date)) === dateGroup.date
    )

    return {
      ...dateGroup,
      dayTag: dayTag || null,
      isCollapsed: !!dayTag, // Collapsed if has any tag
    }
  })
}
