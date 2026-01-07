import { Category, Week, Todo } from '@prisma/client'

// Re-export Prisma types
export type { Category, Week, Todo }

// Extended types with relations
export type CategoryWithWeeks = Category & {
  weeks: Week[]
}

export type WeekWithTodos = Week & {
  todos: Todo[]
  category: Category
}

export type TodoWithWeek = Todo & {
  week: Week
}

// Grouped todos by date for display
export interface TodosByDate {
  date: string // ISO format: "2025-01-07"
  dateFormatted: string // Display format: "15 December [Mon]"
  todos: Todo[]
}

// API request/response types
export interface CreateCategoryInput {
  name: string
  color?: string
}

export interface UpdateCategoryInput {
  name?: string
  color?: string
  order?: number
}

export interface CreateTodoInput {
  weekId: string
  content: string
  dueDate: string // ISO format
}

export interface UpdateTodoInput {
  content?: string
  completed?: boolean
  order?: number
}

export interface GenerateWeeksInput {
  categoryId: string
  weeksAhead?: number
}

export interface GenerateWeeksResponse {
  weeksCreated: number
  weeks: Week[]
}

// API responses
export interface CategoriesResponse {
  categories: Category[]
}

export interface WeeksResponse {
  weeks: Week[]
}

export interface TodosGroupedResponse {
  dates: TodosByDate[]
}
