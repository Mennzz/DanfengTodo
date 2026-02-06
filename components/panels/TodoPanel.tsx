'use client'

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useTodoContext } from '../providers/TodoProvider'
import { Checkbox } from '../ui/Checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { TagSelector } from '../ui/TagSelector'
import { DraggableTodoItem } from '../ui/DraggableTodoItem'
import { TodoItem } from '../ui/TodoItem'
import { ContextMenu } from '../ui/ContextMenu'
import { DayNoteEditor } from '../ui/DayNoteEditor'
import { WeeklyStats } from './WeeklyStats'
import { WeekReflection } from './WeekReflection'
import { Trash2, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { formatDateForAPI } from '@/lib/dateUtils'
import type { TodosByDateWithTag, DayTagType, TodosByDate, TodoWithSubtasks } from '@/types'

export function TodoPanel() {
  const {
    todos,
    selectedWeek,
    selectedCategory,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    isLoadingTodos,
    isCombinedView,
    isWorkDaily,
    collapsedDays,
    addDayTag,
    deleteDayTag,
    toggleDayCollapse,
    reorderTodos,
  } = useTodoContext()
  const [newTodoContent, setNewTodoContent] = useState<{ [date: string]: string }>({})
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    todo: TodoWithSubtasks
  } | null>(null)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
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
    try {
      await deleteTodo(id)
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }

  const handleStartEdit = (todoId: string, currentContent: string) => {
    setEditingTodoId(todoId)
    setEditingContent(currentContent)
  }

  const handleSaveEdit = async (todoId: string) => {
    const trimmedContent = editingContent.trim()
    if (!trimmedContent) {
      setEditingTodoId(null)
      setEditingContent('')
      return
    }

    try {
      await updateTodo(todoId, { content: trimmedContent })
      setEditingTodoId(null)
      setEditingContent('')
    } catch (error) {
      console.error('Failed to update todo:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingTodoId(null)
    setEditingContent('')
  }

  const handleEditKeyDown = (todoId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit(todoId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleContextMenu = (e: React.MouseEvent, todo: TodoWithSubtasks) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      todo,
    })
  }

  const handleAddSubtask = async () => {
    if (!contextMenu || !selectedWeek) return

    const subtaskContent = prompt('Enter subtask:')
    if (!subtaskContent?.trim()) return

    try {
      await addTodo({
        weekId: selectedWeek.id,
        content: subtaskContent.trim(),
        dueDate: contextMenu.todo.dueDate.toString(),
        parentId: contextMenu.todo.id,
      })
    } catch (error) {
      console.error('Failed to add subtask:', error)
    }
  }

  const handleKeyDown = (date: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTodo(date, e as any)
    }
  }

  const handleTagChange = async (date: string, tag: DayTagType | null, currentTag?: any) => {
    try {
      if (tag === null && currentTag) {
        // Remove tag
        await deleteDayTag(currentTag.id)
      } else if (tag && selectedCategory) {
        // Add or update tag
        await addDayTag({
          categoryId: selectedCategory.id,
          date,
          tag,
        })
      }
    } catch (error) {
      console.error('Failed to update day tag:', error)
    }
  }

  const handleDragEnd = (event: DragEndEvent, dateGroup: any) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = dateGroup.todos.findIndex((t: any) => t.id === active.id)
    const newIndex = dateGroup.todos.findIndex((t: any) => t.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTodos(dateGroup.date, oldIndex, newIndex)
    }
  }

  if (!selectedWeek) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground text-center">Select a week to view todos</p>
      </div>
    )
  }

  if (isLoadingTodos) {
    return (
      <div className="h-full bg-background">
        <div className="p-4 md:p-8 text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="bg-card border-b px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-normal text-foreground mb-2">
          Week {selectedWeek.weekNumber} - {new Date(selectedWeek.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} to {new Date(selectedWeek.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          {isCombinedView && (
            <span className="text-xs px-2 py-1 rounded bg-muted">
              Read-only view
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
        {todos.map((dateGroup) => {
          const dateGroupWithTag = dateGroup as TodosByDateWithTag
          const isCollapsed =
            dateGroupWithTag.dayTag && (dateGroupWithTag.isCollapsed || collapsedDays.has(dateGroup.date))

          return (
            <Card key={dateGroup.date}>
              <CardHeader
                className={isWorkDaily && dateGroupWithTag.dayTag ? 'cursor-pointer' : ''}
                onClick={() => {
                  if (isWorkDaily && dateGroupWithTag.dayTag) {
                    toggleDayCollapse(dateGroup.date)
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg md:text-xl font-normal flex flex-wrap items-center gap-2">
                    <span>{dateGroup.dateFormatted}</span>
                    {dateGroupWithTag.dayTag && (
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                        {dateGroupWithTag.dayTag.tag}
                      </span>
                    )}
                  </CardTitle>
                  {isWorkDaily && !isCombinedView && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <TagSelector
                        date={dateGroup.date}
                        currentTag={dateGroupWithTag.dayTag}
                        onTagChange={(tag) => handleTagChange(dateGroup.date, tag, dateGroupWithTag.dayTag)}
                      />
                      {dateGroupWithTag.dayTag && (
                        <div className="text-muted-foreground">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="space-y-4">
                  {/* Todo Items with Drag and Drop */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, dateGroup)}
                  >
                    <SortableContext
                      items={dateGroup.todos.map((t: any) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {dateGroup.todos.map((todo) => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          level={0}
                          editingTodoId={editingTodoId}
                          editingContent={editingContent}
                          isCombinedView={isCombinedView}
                          onToggle={handleToggleTodo}
                          onDelete={handleDeleteTodo}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onEditKeyDown={handleEditKeyDown}
                          onContextMenu={handleContextMenu}
                          setEditingContent={setEditingContent}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

              {dateGroup.todos.length === 0 && (
                <p className="text-muted-foreground text-sm italic py-2">No todos for this day</p>
              )}

                  {/* Add Todo Input - Hidden in combined view */}
                  {!isCombinedView && (
                    <div className="flex items-start gap-4 pt-4 border-t">
                      <div className="pt-1">
                        <div className="w-5 h-5" />
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
                            placeholder="Add a new todo..."
                            className="w-full px-0 py-0 text-base border-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                            disabled={isSubmitting}
                            spellCheck={true}
                            autoCorrect="on"
                            autoCapitalize="sentences"
                            autoComplete="off"
                          />
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Day Note Editor - Hidden in combined view */}
                  {!isCombinedView && selectedCategory && (
                    <DayNoteEditor
                      date={dateGroup.date}
                      categoryId={selectedCategory.id}
                      initialContent={dateGroupWithTag.dayNote?.content || ''}
                      disabled={false}
                    />
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}

        {/* Weekly Stats and Reflection - Only show for non-combined views */}
        {!isCombinedView && selectedWeek && (
          <>
            <div className="mt-8">
              <WeeklyStats todos={todos as TodosByDate[]} />
            </div>
            <div className="mt-6">
              <WeekReflection weekId={selectedWeek.id} />
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: 'Add Subtask',
              icon: <Plus className="w-4 h-4" />,
              onClick: handleAddSubtask,
            },
          ]}
        />
      )}
    </div>
  )
}
