import { startOfWeek, endOfWeek, addWeeks, getISOWeek, getISOWeekYear } from 'date-fns'

export interface WeekData {
  startDate: Date
  endDate: Date
  weekNumber: number
  year: number
}

/**
 * Generate weeks for a category starting from a given date
 * @param startDate The starting date (will be adjusted to Monday)
 * @param count Number of weeks to generate (default: 12)
 * @returns Array of week data
 */
export function generateWeeks(startDate: Date, count: number = 12): WeekData[] {
  const weeks: WeekData[] = []

  // Start from the Monday of the given week
  let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 }) // 1 = Monday

  for (let i = 0; i < count; i++) {
    const weekStart = new Date(currentWeekStart)
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 }) // Sunday

    weeks.push({
      startDate: weekStart,
      endDate: weekEnd,
      weekNumber: getISOWeek(weekStart),
      year: getISOWeekYear(weekStart),
    })

    currentWeekStart = addWeeks(currentWeekStart, 1)
  }

  return weeks
}

/**
 * Get the current week's start date (Monday)
 */
export function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 })
}

/**
 * Check if a date is within a week's range
 */
export function isDateInWeek(date: Date, weekStart: Date, weekEnd: Date): boolean {
  return date >= weekStart && date <= weekEnd
}
