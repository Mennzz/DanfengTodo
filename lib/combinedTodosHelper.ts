import type { Category, Week, Todo, TodosByDate } from '@/types'
import { formatDateHeader, parseAPIDate } from './dateUtils'

export interface TodoWithCategory extends Todo {
  categoryName?: string
  categoryColor?: string
}

export interface TodosByDateWithCategory {
  date: string
  dateFormatted: string
  todos: TodoWithCategory[]
}

/**
 * Check if a category is a combined category
 * @param category Category to check
 * @returns true if category name contains "combined" (case-insensitive)
 */
export function isCombinedCategory(category: Category | null): boolean {
  if (!category) return false
  return category.name.toLowerCase().includes('combined')
}

/**
 * Find work and personal categories from a list of categories
 * @param categories List of all categories
 * @returns Object with workCategory and personalCategory, or null if not found
 */
export function findSourceCategories(categories: Category[]): {
  workCategory: Category | null
  personalCategory: Category | null
} {
  const workCategory =
    categories.find((cat) => cat.name.toLowerCase().includes('work')) || null
  const personalCategory =
    categories.find((cat) => cat.name.toLowerCase().includes('personal')) || null

  return { workCategory, personalCategory }
}

/**
 * Find matching weeks from two category week lists based on week number and year
 * @param workWeeks Weeks from work category
 * @param personalWeeks Weeks from personal category
 * @param selectedWeekNumber The week number to find
 * @returns Object with matching weeks or null
 */
export function findMatchingWeeks(
  workWeeks: Week[] | undefined,
  personalWeeks: Week[] | undefined,
  selectedWeekNumber: number | undefined
): {
  workWeek: Week | null
  personalWeek: Week | null
} | null {
  if (!selectedWeekNumber) return null

  const workWeek = workWeeks?.find((w) => w.weekNumber === selectedWeekNumber) || null
  const personalWeek =
    personalWeeks?.find((w) => w.weekNumber === selectedWeekNumber) || null

  return { workWeek, personalWeek }
}

/**
 * Merge todos from work and personal categories by date
 * @param workTodos Todos from work category
 * @param personalTodos Todos from personal category
 * @param workCategory Work category for color/name
 * @param personalCategory Personal category for color/name
 * @returns Merged todos grouped by date
 */
export function mergeTodosByDate(
  workTodos: TodosByDate[],
  personalTodos: TodosByDate[],
  workCategory: Category | null,
  personalCategory: Category | null
): TodosByDateWithCategory[] {
  // Create a map of date -> todos
  const dateMap = new Map<string, TodoWithCategory[]>()

  // Add work todos
  workTodos.forEach((dateGroup) => {
    const todos = dateGroup.todos.map((todo) => ({
      ...todo,
      categoryName: workCategory?.name.split(' ')[0] || 'Work',
      categoryColor: workCategory?.color || '#3B82F6',
    }))
    dateMap.set(dateGroup.date, todos)
  })

  // Add personal todos
  personalTodos.forEach((dateGroup) => {
    const existing = dateMap.get(dateGroup.date) || []
    const todos = dateGroup.todos.map((todo) => ({
      ...todo,
      categoryName: personalCategory?.name.split(' ')[0] || 'Personal',
      categoryColor: personalCategory?.color || '#10B981',
    }))
    dateMap.set(dateGroup.date, [...existing, ...todos])
  })

  // Convert back to array and sort by date
  const result = Array.from(dateMap.entries())
    .map(([date, todos]) => ({
      date,
      dateFormatted: formatDateHeader(parseAPIDate(date)),
      todos: todos.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return result
}

/**
 * Merge weeks from work and personal categories, keeping unique week numbers
 * @param workWeeks Weeks from work category
 * @param personalWeeks Weeks from personal category
 * @returns Combined list of unique weeks
 */
export function mergeWeeks(
  workWeeks: Week[] | undefined,
  personalWeeks: Week[] | undefined
): Week[] {
  const weekMap = new Map<number, Week>()

  // Add work weeks
  workWeeks?.forEach((week) => {
    weekMap.set(week.weekNumber, week)
  })

  // Add personal weeks (if week number already exists, skip)
  personalWeeks?.forEach((week) => {
    if (!weekMap.has(week.weekNumber)) {
      weekMap.set(week.weekNumber, week)
    }
  })

  // Return sorted by week number
  return Array.from(weekMap.values()).sort((a, b) => a.weekNumber - b.weekNumber)
}
