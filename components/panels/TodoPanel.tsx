'use client'

import React, { useState } from 'react'
import { useTodoContext } from '../providers/TodoProvider'
import { Checkbox } from '../ui/Checkbox'

export function TodoPanel() {
  const { todos, selectedWeek, addTodo, toggleTodo, deleteTodo, isLoadingTodos } = useTodoContext()
  const [newTodoContent, setNewTodoContent] = useState<{ [date: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTodo = async (date: string, e: React.FormEvent) => {
    e.preventDefault()
    const content = newTodoContent[date]?.trim()
    if (!content || !selectedWeek) return

    setIsSubmitting(true)
    try {
      await addTodo({
        weekId: selectedWeek.id,
        content,
        dueDate: date,
      })
      setNewTodoContent((prev) => ({ ...prev, [date]: '' }))
    } catch (error) {
      console.error('Failed to add todo:', error)
      alert('Failed to add todo. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleTodo = async (id: string, currentCompleted: boolean) => {
    try {
      await toggleTodo(id, !currentCompleted)
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  const handleDeleteTodo = async (id: string) => {
    if (!confirm('Delete this todo?')) return

    try {
      await deleteTodo(id)
    } catch (error) {
      console.error('Failed to delete todo:', error)
      alert('Failed to delete todo. Please try again.')
    }
  }

  const handleKeyDown = (date: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTodo(date, e as any)
    }
  }

  if (!selectedWeek) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400 dark:text-gray-500">Select a week to view todos</p>
      </div>
    )
  }

  if (isLoadingTodos) {
    return (
      <div className="h-full bg-white dark:bg-gray-900">
        <div className="p-8 text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 overflow-y-auto">
      {/* Header with current week info */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-8 py-6">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Week {selectedWeek.weekNumber} - {new Date(selectedWeek.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} to {new Date(selectedWeek.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-8 py-6">
        {todos.map((dateGroup) => (
          <div key={dateGroup.date} className="mb-8">
            {/* Date Header - OneNote Style */}
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {dateGroup.dateFormatted}
            </h2>

            {/* Todo Items */}
            <div className="space-y-1">
              {dateGroup.todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 py-1 group"
                >
                  <div className="pt-0.5">
                    <Checkbox
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id, todo.completed)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${
                        todo.completed
                          ? 'text-gray-400 dark:text-gray-600 line-through'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {todo.content}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-opacity p-1"
                    title="Delete"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add Todo Input */}
              <div className="flex items-start gap-3 py-1">
                <div className="pt-0.5">
                  <div className="w-5 h-5" /> {/* Spacer for alignment */}
                </div>
                <div className="flex-1">
                  <form onSubmit={(e) => handleAddTodo(dateGroup.date, e)}>
                    <input
                      type="text"
                      value={newTodoContent[dateGroup.date] || ''}
                      onChange={(e) =>
                        setNewTodoContent((prev) => ({
                          ...prev,
                          [dateGroup.date]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => handleKeyDown(dateGroup.date, e)}
                      placeholder="Add a todo..."
                      className="w-full px-0 py-0 text-sm border-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-0"
                      disabled={isSubmitting}
                    />
                  </form>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
