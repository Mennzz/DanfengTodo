import { Category, Week, Todo, DayTag, WeekReflection, DayNote, WeekPlan, PlanTask } from '@prisma/client'

// Re-export Prisma types
export type { Category, Week, Todo, DayTag, WeekReflection, DayNote, WeekPlan, PlanTask }

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

export type TodoWithSubtasks = Todo & {
  subtasks: Todo[]
}

// Grouped todos by date for display
export interface TodosByDate {
  date: string // ISO format: "2025-01-07"
  dateFormatted: string // Display format: "15 December [Mon]"
  todos: TodoWithSubtasks[]
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
  parentId?: string // Optional: for creating subtasks
}

export interface UpdateTodoInput {
  content?: string
  completed?: boolean
  order?: number
}

export interface GenerateWeeksInput {
  categoryId: string
  weeksAhead?: number
  year?: number
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

// Day tags types
export type DayTagType = 'Weekend' | 'Vacation' | 'Sick'

export interface CreateDayTagInput {
  categoryId: string
  date: string // ISO format
  tag: DayTagType
}

export interface TodosByDateWithTag extends TodosByDate {
  dayTag?: DayTag | null
  dayNote?: DayNote | null
  isCollapsed?: boolean
}

export interface DayTagsResponse {
  dayTags: DayTag[]
}

// Plan types
export type WeekPlanWithTasks = WeekPlan & {
  tasks: PlanTask[]
}

export interface CreatePlanTaskInput {
  planId: string
  content: string
}

export interface UpdatePlanTaskInput {
  content?: string
  order?: number
  assignedDay?: string | null
  todoId?: string | null
}

export interface AssignPlanTaskInput {
  day: string // ISO date
  weekId: string
}
