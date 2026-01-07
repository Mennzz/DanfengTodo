'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { TodoProvider, useTodoContext } from '@/components/providers/TodoProvider'
import { CategoryPanel } from '@/components/panels/CategoryPanel'
import { WeekPanel } from '@/components/panels/WeekPanel'
import { TodoPanel } from '@/components/panels/TodoPanel'

function DashboardContent() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  const weekId = searchParams.get('week')

  return (
    <TodoProvider categoryId={categoryId} weekId={weekId}>
      <AutoNavigate />
      <div className="flex h-screen overflow-hidden bg-gray-200 dark:bg-gray-950">
        {/* Left Panel: Categories */}
        <aside className="w-64 flex-shrink-0 h-full overflow-y-auto border-r border-gray-300 dark:border-gray-800 shadow-sm">
          <CategoryPanel />
        </aside>

        {/* Middle Panel: Weeks */}
        <aside className="w-60 flex-shrink-0 h-full overflow-y-auto border-r border-gray-300 dark:border-gray-800 shadow-sm">
          <WeekPanel />
        </aside>

        {/* Right Panel: Todos */}
        <main className="flex-1 h-full overflow-y-auto">
          <TodoPanel />
        </main>
      </div>
    </TodoProvider>
  )
}

// Auto-navigate to first category and current week if none selected
function AutoNavigate() {
  const {
    categories,
    weeks,
    selectedCategory,
    selectedWeek,
    selectCategory,
    selectWeek,
    generateWeeks,
    isLoadingCategories,
    isLoadingWeeks,
  } = useTodoContext()
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    if (hasInitialized || isLoadingCategories) return

    // Auto-select first category if none selected
    if (!selectedCategory && categories.length > 0) {
      selectCategory(categories[0].id)
      setHasInitialized(true)
      return
    }

    setHasInitialized(true)
  }, [categories, selectedCategory, selectCategory, isLoadingCategories, hasInitialized])

  useEffect(() => {
    if (!selectedCategory || isLoadingWeeks) return

    // Generate weeks if none exist
    if (weeks.length === 0) {
      generateWeeks(selectedCategory.id)
      return
    }

    // Auto-select current week or first week if none selected
    if (!selectedWeek && weeks.length > 0) {
      // Find current week
      const now = new Date()
      const currentWeek = weeks.find((week) => {
        const start = new Date(week.startDate)
        const end = new Date(week.endDate)
        return now >= start && now <= end
      })

      if (currentWeek) {
        selectWeek(currentWeek.id)
      } else {
        // Select first week if no current week found
        selectWeek(weeks[0].id)
      }
    }
  }, [selectedCategory, weeks, selectedWeek, selectWeek, generateWeeks, isLoadingWeeks])

  return null
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
