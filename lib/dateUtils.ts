import { format, isSameWeek, startOfWeek } from 'date-fns'

/**
 * Format week display: "Week 6 - 4 Feb to 10 Feb"
 */
export function formatWeekDisplay(startDate: Date, endDate: Date, weekNumber: number): string {
  const startFormatted = format(startDate, 'd MMM')
  const endFormatted = format(endDate, 'd MMM')
  return `Week ${weekNumber} - ${startFormatted} to ${endFormatted}`
}

/**
 * Format date header: "15 December [Mon]"
 */
export function formatDateHeader(date: Date): string {
  const dayFormatted = format(date, 'd MMMM')
  const dayOfWeek = format(date, 'EEE')
  return `${dayFormatted} [${dayOfWeek}]`
}

/**
 * Format date for API: "2025-01-07"
 */
export function formatDateForAPI(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Check if a date is in the current week
 */
export function isCurrentWeek(date: Date): boolean {
  return isSameWeek(date, new Date(), { weekStartsOn: 1 })
}

/**
 * Get all dates in a week
 */
export function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = []
  const start = startOfWeek(weekStart, { weekStartsOn: 1 })

  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    dates.push(date)
  }

  return dates
}

/**
 * Parse date from API format
 */
export function parseAPIDate(dateString: string): Date {
  return new Date(dateString)
}
