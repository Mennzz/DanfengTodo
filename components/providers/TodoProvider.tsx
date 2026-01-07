'use client'

import React, { createContext, useContext, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/navigation'
import type {
  Category,
  Week,
  TodosByDate,
  CreateTodoInput,
  UpdateTodoInput,
  CreateCategoryInput,
} from '@/types'

interface TodoContextValue {
  // State
  categories: Category[]
  selectedCategory: Category | null
  weeks: Week[]
  selectedWeek: Week | null
  todos: TodosByDate[]

  // Loading states
  isLoadingCategories: boolean
  isLoadingWeeks: boolean
  isLoadingTodos: boolean

  // Actions
  selectCategory: (id: string) => void
  selectWeek: (id: string) => void
  addCategory: (data: CreateCategoryInput) => Promise<void>
  addTodo: (data: CreateTodoInput) => Promise<void>
  toggleTodo: (id: string, completed: boolean) => Promise<void>
  updateTodo: (id: string, data: UpdateTodoInput) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  generateWeeks: (categoryId: string) => Promise<void>
}

const TodoContext = createContext<TodoContextValue | undefined>(undefined)

interface TodoProviderProps {
  children: React.ReactNode
  categoryId: string | null
  weekId: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TodoProvider({ children, categoryId, weekId }: TodoProviderProps) {
  const router = useRouter()

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useSWR(
    '/api/categories',
    fetcher
  )
  const categories = categoriesData?.categories || []
  const selectedCategory = categories.find((c: Category) => c.id === categoryId) || null

  // Fetch weeks for selected category
  const { data: weeksData, isLoading: isLoadingWeeks } = useSWR(
    categoryId ? `/api/categories/${categoryId}/weeks?limit=52` : null,
    fetcher
  )
  const weeks = weeksData?.weeks || []
  const selectedWeek = weeks.find((w: Week) => w.id === weekId) || null

  // Fetch todos for selected week
  const { data: todosData, isLoading: isLoadingTodos } = useSWR(
    weekId ? `/api/weeks/${weekId}/todos` : null,
    fetcher
  )
  const todos = todosData?.dates || []

  // Actions
  const selectCategory = useCallback(
    (id: string) => {
      router.push(`/?category=${id}`)
    },
    [router]
  )

  const selectWeek = useCallback(
    (id: string) => {
      if (!categoryId) return
      router.push(`/?category=${categoryId}&week=${id}`)
    },
    [router, categoryId]
  )

  const addCategory = useCallback(async (data: CreateCategoryInput) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Failed to create category')

    const { category } = await res.json()

    // Revalidate categories
    await mutate('/api/categories')

    // Auto-generate weeks for new category
    await fetch('/api/weeks/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: category.id, weeksAhead: 52 }),
    })

    return category
  }, [])

  const addTodo = useCallback(
    async (data: CreateTodoInput) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to create todo')

      // Revalidate todos for current week
      await mutate(weekId ? `/api/weeks/${weekId}/todos` : null)
    },
    [weekId]
  )

  const toggleTodo = useCallback(
    async (id: string, completed: boolean) => {
      // Optimistic update
      if (weekId) {
        await mutate(
          `/api/weeks/${weekId}/todos`,
          async (currentData: any) => {
            if (!currentData) return currentData

            return {
              ...currentData,
              dates: currentData.dates.map((dateGroup: TodosByDate) => ({
                ...dateGroup,
                todos: dateGroup.todos.map((todo) =>
                  todo.id === id ? { ...todo, completed } : todo
                ),
              })),
            }
          },
          { revalidate: false }
        )
      }

      // Update on server
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })

      if (!res.ok) {
        // Revert on error
        await mutate(weekId ? `/api/weeks/${weekId}/todos` : null)
        throw new Error('Failed to update todo')
      }

      // Revalidate to get server state
      await mutate(weekId ? `/api/weeks/${weekId}/todos` : null)
    },
    [weekId]
  )

  const updateTodo = useCallback(
    async (id: string, data: UpdateTodoInput) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to update todo')

      await mutate(weekId ? `/api/weeks/${weekId}/todos` : null)
    },
    [weekId]
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete todo')

      await mutate(weekId ? `/api/weeks/${weekId}/todos` : null)
    },
    [weekId]
  )

  const generateWeeks = useCallback(async (categoryId: string) => {
    const res = await fetch('/api/weeks/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, weeksAhead: 52 }),
    })

    if (!res.ok) throw new Error('Failed to generate weeks')

    // Revalidate weeks
    await mutate(`/api/categories/${categoryId}/weeks?limit=52`)
  }, [])

  const value: TodoContextValue = {
    categories,
    selectedCategory,
    weeks,
    selectedWeek,
    todos,
    isLoadingCategories,
    isLoadingWeeks,
    isLoadingTodos,
    selectCategory,
    selectWeek,
    addCategory,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    generateWeeks,
  }

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>
}

export function useTodoContext() {
  const context = useContext(TodoContext)
  if (context === undefined) {
    throw new Error('useTodoContext must be used within a TodoProvider')
  }
  return context
}
