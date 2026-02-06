'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { TodoProvider, useTodoContext } from '@/components/providers/TodoProvider'
import { CategoryPanel } from '@/components/panels/CategoryPanel'
import { WeekPanel } from '@/components/panels/WeekPanel'
import { TodoPanel } from '@/components/panels/TodoPanel'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'

function DashboardContent() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  const year = searchParams.get('year')
  const weekId = searchParams.get('week')

  return (
    <TodoProvider categoryId={categoryId} year={year} weekId={weekId}>
      <DashboardLayout />
    </TodoProvider>
  )
}

function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<'categories' | 'weeks' | 'todos'>('todos')
  const { sidebarVisible, toggleSidebar } = useTodoContext()

  return (
    <>
      <AutoNavigate />
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
        {/* Desktop & Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            {/* Toggle sidebar button - Desktop only */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:block lg:p-2 lg:rounded-md lg:hover:bg-gray-100"
              aria-label="Toggle sidebar"
              title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarVisible ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          <h1 className="text-lg font-semibold">Todo App</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex bg-white border-b border-gray-200">
          <button
            onClick={() => setActivePanel('categories')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activePanel === 'categories'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActivePanel('weeks')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activePanel === 'weeks'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            Weeks
          </button>
          <button
            onClick={() => setActivePanel('todos')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activePanel === 'todos'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Desktop & Mobile Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Categories */}
          <aside className={`
            w-64 flex-shrink-0 h-full overflow-y-auto border-r border-gray-200 bg-white
            ${sidebarVisible ? 'lg:block' : 'lg:hidden'}
            ${activePanel === 'categories' ? 'block' : 'hidden'}
          `}>
            <CategoryPanel />
          </aside>

          {/* Middle Panel: Weeks */}
          <aside className={`
            w-60 flex-shrink-0 h-full overflow-y-auto border-r border-gray-200 bg-white
            ${sidebarVisible ? 'lg:block' : 'lg:hidden'}
            ${activePanel === 'weeks' ? 'block' : 'hidden'}
          `}>
            <WeekPanel />
          </aside>

          {/* Right Panel: Todos */}
          <main className={`
            flex-1 h-full overflow-y-auto
            lg:block
            ${activePanel === 'todos' ? 'block' : 'hidden'}
          `}>
            <TodoPanel />
          </main>
        </div>
      </div>
    </>
  )
}

// Auto-navigate to first category and current week if none selected
function AutoNavigate() {
  const {
    categories,
    weeks,
    selectedCategory,
    selectedYear,
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

    // Generate weeks for selected year if none exist
    if (weeks.length === 0) {
      generateWeeks(selectedCategory.id, selectedYear)
      return
    }

    // Auto-select current week or first week if none selected
    if (!selectedWeek && weeks.length > 0) {
      const now = new Date()
      const currentYear = now.getFullYear()

      // If selected year is current year, find current week
      if (selectedYear === currentYear) {
        const currentWeek = weeks.find((week) => {
          const start = new Date(week.startDate)
          const end = new Date(week.endDate)
          return now >= start && now <= end
        })

        if (currentWeek) {
          selectWeek(currentWeek.id)
          return
        }
      }

      // Otherwise, select first week of the year
      selectWeek(weeks[0].id)
    }
  }, [selectedCategory, selectedYear, weeks, selectedWeek, selectWeek, generateWeeks, isLoadingWeeks])

  return null
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
