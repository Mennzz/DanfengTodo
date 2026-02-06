'use client'

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/navigation'
import type {
  Category,
  Week,
  TodosByDate,
  CreateTodoInput,
  UpdateTodoInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  DayTag,
  CreateDayTagInput,
  TodosByDateWithTag,
} from '@/types'
import {
  isCombinedCategory,
  findSourceCategories,
  findMatchingWeeks,
  mergeTodosByDate,
  mergeWeeks,
  type TodosByDateWithCategory,
} from '@/lib/combinedTodosHelper'
import {
  isWorkDailyCategory,
  mergeDayTags,
  getWeekendDatesForWeek,
} from '@/lib/dayTagsHelper'
import { formatDateForAPI } from '@/lib/dateUtils'

interface TodoContextValue {
  // State
  categories: Category[]
  selectedCategory: Category | null
  selectedYear: number
  weeks: Week[]
  selectedWeek: Week | null
  todos: TodosByDate[] | TodosByDateWithCategory[] | TodosByDateWithTag[]
  isCombinedView: boolean
  isWorkDaily: boolean
  dayTags: DayTag[]
  collapsedDays: Set<string>
  sidebarVisible: boolean

  // Loading states
  isLoadingCategories: boolean
  isLoadingWeeks: boolean
  isLoadingTodos: boolean
  isLoadingDayTags: boolean

  // Actions
  selectCategory: (id: string) => void
  selectWeek: (id: string) => void
  selectYear: (year: number) => void
  addCategory: (data: CreateCategoryInput) => Promise<void>
  updateCategory: (id: string, data: UpdateCategoryInput) => Promise<void>
  addTodo: (data: CreateTodoInput) => Promise<void>
  toggleTodo: (id: string, completed: boolean) => Promise<void>
  updateTodo: (id: string, data: UpdateTodoInput) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  generateWeeks: (categoryId: string, year?: number) => Promise<void>
  addDayTag: (data: CreateDayTagInput) => Promise<void>
  deleteDayTag: (id: string) => Promise<void>
  toggleDayCollapse: (date: string) => void
  reorderTodos: (date: string, oldIndex: number, newIndex: number) => Promise<void>
  toggleSidebar: () => void
}

const TodoContext = createContext<TodoContextValue | undefined>(undefined)

interface TodoProviderProps {
  children: React.ReactNode
  categoryId: string | null
  year: string | null
  weekId: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TodoProvider({ children, categoryId, year, weekId }: TodoProviderProps) {
  const router = useRouter()

  // Parse year (default to current year)
  const selectedYear = year ? parseInt(year) : new Date().getFullYear()

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useSWR(
    '/api/categories',
    fetcher
  )
  const categories = categoriesData?.categories || []
  const selectedCategory = categories.find((c: Category) => c.id === categoryId) || null

  // Check if this is a combined view
  const isCombined = useMemo(() => isCombinedCategory(selectedCategory), [selectedCategory])

  // Check if this is a work daily category
  const isWorkDaily = useMemo(
    () => !isCombined && isWorkDailyCategory(selectedCategory),
    [isCombined, selectedCategory]
  )

  // Find source categories for combined view
  const sourceCategories = useMemo(
    () => (isCombined ? findSourceCategories(categories) : null),
    [isCombined, categories]
  )

  // Local state for collapsed days
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())

  // Local state for sidebar visibility (with localStorage persistence)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Initialize from localStorage on client side
    const stored = localStorage.getItem('sidebarVisible')
    setSidebarVisible(stored === null ? true : JSON.parse(stored))
    setIsHydrated(true)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => {
      const newValue = !prev
      localStorage.setItem('sidebarVisible', JSON.stringify(newValue))
      return newValue
    })
  }, [])

  // Fetch weeks for selected category (or work category if combined)
  const { data: weeksData, isLoading: isLoadingWeeks } = useSWR(
    categoryId && !isCombined
      ? `/api/categories/${categoryId}/weeks?limit=52&year=${selectedYear}`
      : null,
    fetcher
  )

  // Fetch weeks from work category (for combined view)
  const { data: workWeeksData, isLoading: isLoadingWorkWeeks } = useSWR(
    isCombined && sourceCategories?.workCategory
      ? `/api/categories/${sourceCategories.workCategory.id}/weeks?limit=52&year=${selectedYear}`
      : null,
    fetcher
  )

  // Fetch weeks from personal category (for combined view)
  const { data: personalWeeksData, isLoading: isLoadingPersonalWeeks } = useSWR(
    isCombined && sourceCategories?.personalCategory
      ? `/api/categories/${sourceCategories.personalCategory.id}/weeks?limit=52&year=${selectedYear}`
      : null,
    fetcher
  )

  // Merge weeks for combined view
  const weeks = useMemo(() => {
    if (isCombined) {
      return mergeWeeks(workWeeksData?.weeks, personalWeeksData?.weeks)
    }
    return weeksData?.weeks || []
  }, [isCombined, weeksData, workWeeksData, personalWeeksData])

  const selectedWeek = weeks.find((w: Week) => w.id === weekId) || null

  // Find matching weeks in work and personal for combined view
  const matchingWeeks = useMemo(() => {
    if (!isCombined || !selectedWeek) return null
    return findMatchingWeeks(
      workWeeksData?.weeks,
      personalWeeksData?.weeks,
      selectedWeek.weekNumber
    )
  }, [isCombined, selectedWeek, workWeeksData, personalWeeksData])

  // Fetch todos for selected week (normal view)
  const { data: todosData, isLoading: isLoadingTodos } = useSWR(
    weekId && !isCombined ? `/api/weeks/${weekId}/todos` : null,
    fetcher
  )

  // Fetch todos from work week (combined view)
  const { data: workTodosData, isLoading: isLoadingWorkTodos } = useSWR(
    isCombined && matchingWeeks?.workWeek
      ? `/api/weeks/${matchingWeeks.workWeek.id}/todos`
      : null,
    fetcher
  )

  // Fetch todos from personal week (combined view)
  const { data: personalTodosData, isLoading: isLoadingPersonalTodos } = useSWR(
    isCombined && matchingWeeks?.personalWeek
      ? `/api/weeks/${matchingWeeks.personalWeek.id}/todos`
      : null,
    fetcher
  )

  // Fetch day tags for work daily category
  const { data: dayTagsData, isLoading: isLoadingDayTags } = useSWR(
    isWorkDaily && selectedCategory && selectedWeek
      ? `/api/categories/${selectedCategory.id}/day-tags?startDate=${selectedWeek.startDate}&endDate=${selectedWeek.endDate}`
      : null,
    fetcher
  )

  const dayTags = dayTagsData?.dayTags || []

  // Fetch day notes for selected category and week
  const { data: dayNotesData } = useSWR(
    selectedCategory && selectedWeek
      ? `/api/categories/${selectedCategory.id}/day-notes?startDate=${selectedWeek.startDate}&endDate=${selectedWeek.endDate}`
      : null,
    fetcher
  )

  const dayNotes = dayNotesData?.dayNotes || []

  // Merge todos for combined view or with day tags for work daily
  const todos = useMemo(() => {
    if (isCombined) {
      return mergeTodosByDate(
        workTodosData?.dates || [],
        personalTodosData?.dates || [],
        sourceCategories?.workCategory || null,
        sourceCategories?.personalCategory || null
      )
    }

    let result = todosData?.dates || []

    // Merge day tags for work daily category
    if (isWorkDaily && dayTags.length > 0) {
      result = mergeDayTags(result, dayTags)
    }

    // Merge day notes
    if (dayNotes.length > 0) {
      result = result.map((dateGroup) => {
        const dayNote = dayNotes.find(
          (note) => formatDateForAPI(new Date(note.date)) === dateGroup.date
        )
        return {
          ...dateGroup,
          dayNote: dayNote || null,
        }
      })
    }

    return result
  }, [isCombined, isWorkDaily, workTodosData, personalTodosData, todosData, sourceCategories, dayTags, dayNotes])

  // Combined loading state
  const isLoadingWeeksActual = isCombined
    ? isLoadingWorkWeeks || isLoadingPersonalWeeks
    : isLoadingWeeks

  const isLoadingTodosActual = isCombined
    ? isLoadingWorkTodos || isLoadingPersonalTodos
    : isLoadingTodos

  // Actions
  const selectCategory = useCallback(
    (id: string) => {
      const currentYear = new Date().getFullYear()
      router.push(`/?category=${id}&year=${currentYear}`)
    },
    [router]
  )

  const selectWeek = useCallback(
    (id: string) => {
      if (!categoryId) return
      router.push(`/?category=${categoryId}&year=${selectedYear}&week=${id}`)
    },
    [router, categoryId, selectedYear]
  )

  const selectYear = useCallback(
    (year: number) => {
      if (!categoryId) return
      // When year changes, clear week selection
      router.push(`/?category=${categoryId}&year=${year}`)
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

    // Auto-generate weeks for new category (current year)
    const currentYear = new Date().getFullYear()
    await fetch('/api/weeks/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: category.id, year: currentYear }),
    })

    return category
  }, [])

  const updateCategory = useCallback(async (id: string, data: UpdateCategoryInput) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Failed to update category')

    // Revalidate categories
    await mutate('/api/categories')
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

  const generateWeeks = useCallback(async (categoryId: string, year?: number) => {
    const res = await fetch('/api/weeks/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        ...(year ? { year } : { weeksAhead: 52 })
      }),
    })

    if (!res.ok) throw new Error('Failed to generate weeks')

    // Revalidate weeks for the year
    const targetYear = year || new Date().getFullYear()
    await mutate(`/api/categories/${categoryId}/weeks?limit=52&year=${targetYear}`)
  }, [])

  const addDayTag = useCallback(
    async (data: CreateDayTagInput) => {
      const res = await fetch('/api/day-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to create day tag')

      // Revalidate day tags
      if (selectedCategory && selectedWeek) {
        await mutate(
          `/api/categories/${selectedCategory.id}/day-tags?startDate=${selectedWeek.startDate}&endDate=${selectedWeek.endDate}`
        )
      }
    },
    [selectedCategory, selectedWeek]
  )

  const deleteDayTag = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/day-tags/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete day tag')

      // Revalidate day tags
      if (selectedCategory && selectedWeek) {
        await mutate(
          `/api/categories/${selectedCategory.id}/day-tags?startDate=${selectedWeek.startDate}&endDate=${selectedWeek.endDate}`
        )
      }
    },
    [selectedCategory, selectedWeek]
  )

  const toggleDayCollapse = useCallback((date: string) => {
    setCollapsedDays((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(date)) {
        newSet.delete(date) // Expand
      } else {
        newSet.add(date) // Collapse
      }
      return newSet
    })
  }, [])

  const reorderTodos = useCallback(
    async (date: string, oldIndex: number, newIndex: number) => {
      if (!weekId) return

      // Optimistic update
      await mutate(
        `/api/weeks/${weekId}/todos`,
        async (currentData: any) => {
          if (!currentData) return currentData

          return {
            ...currentData,
            dates: currentData.dates.map((dateGroup: TodosByDate) => {
              if (dateGroup.date !== date) return dateGroup

              const newTodos = [...dateGroup.todos]
              const [movedTodo] = newTodos.splice(oldIndex, 1)
              newTodos.splice(newIndex, 0, movedTodo)

              // Update order values
              const todosWithNewOrder = newTodos.map((todo, index) => ({
                ...todo,
                order: index,
              }))

              return {
                ...dateGroup,
                todos: todosWithNewOrder,
              }
            }),
          }
        },
        { revalidate: false }
      )

      // Update order on server
      const dateGroup = (todosData?.dates || []).find((d: TodosByDate) => d.date === date)
      if (!dateGroup) return

      const newTodos = [...dateGroup.todos]
      const [movedTodo] = newTodos.splice(oldIndex, 1)
      newTodos.splice(newIndex, 0, movedTodo)

      // Prepare bulk update payload
      const updates = newTodos.map((todo, index) => ({
        id: todo.id,
        order: index,
      }))

      try {
        const res = await fetch('/api/todos/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        })

        if (!res.ok) {
          // Revert on error
          await mutate(weekId ? `/api/weeks/${weekId}/todos` : null)
          throw new Error('Failed to reorder todos')
        }
      } catch (error) {
        console.error('Failed to reorder todos:', error)
        // Revert on error
        await mutate(weekId ? `/api/weeks/${weekId}/todos` : null)
      }
    },
    [weekId, todosData]
  )

  // Auto-generate weekend tags for Work Daily category
  useEffect(() => {
    if (!isWorkDaily || !selectedWeek || !selectedCategory || isLoadingDayTags) {
      return
    }

    const autoGenerateWeekendTags = async () => {
      const weekendDates = getWeekendDatesForWeek(new Date(selectedWeek.startDate))

      for (const date of weekendDates) {
        const dateStr = formatDateForAPI(date)
        const hasTag = dayTags.some(
          (tag) => formatDateForAPI(new Date(tag.date)) === dateStr
        )

        if (!hasTag) {
          // Auto-create weekend tag
          try {
            await addDayTag({
              categoryId: selectedCategory.id,
              date: dateStr,
              tag: 'Weekend',
            })
          } catch (error) {
            console.error('Failed to auto-create weekend tag:', error)
          }
        }
      }
    }

    autoGenerateWeekendTags()
  }, [isWorkDaily, selectedWeek, selectedCategory, dayTags, isLoadingDayTags, addDayTag])

  const value: TodoContextValue = {
    categories,
    selectedCategory,
    selectedYear,
    weeks,
    selectedWeek,
    todos,
    isCombinedView: isCombined,
    isWorkDaily,
    dayTags,
    collapsedDays,
    sidebarVisible,
    isLoadingCategories,
    isLoadingWeeks: isLoadingWeeksActual,
    isLoadingTodos: isLoadingTodosActual,
    isLoadingDayTags,
    selectCategory,
    selectWeek,
    selectYear,
    addCategory,
    updateCategory,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    generateWeeks,
    addDayTag,
    deleteDayTag,
    toggleDayCollapse,
    reorderTodos,
    toggleSidebar,
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
