'use client'

import React, { useState, useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import {
  DndContext,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, Plus, GripVertical } from 'lucide-react'
import type { PlanTask, WeekPlanWithTasks } from '@/types'
import { getWeekDates, formatDateForAPI } from '@/lib/dateUtils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface PlanPanelProps {
  weekId: string
  startDate: Date | string
}

// ─── Day Column ───────────────────────────────────────────────────────────────

function DayColumn({
  dayDate,
  dayLabel,
  tasks,
}: {
  dayDate: string
  dayLabel: string
  tasks: PlanTask[]
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${dayDate}` })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[60px] flex flex-col p-2 min-h-[100px] transition-colors ${
        isOver ? 'bg-primary/5' : ''
      }`}
    >
      <div className="text-xs font-medium text-muted-foreground mb-2 text-center">{dayLabel}</div>
      <div className="space-y-1 flex-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="text-xs bg-primary/10 text-primary rounded px-1.5 py-1 break-words"
            title={task.content}
          >
            {task.content}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sortable Task Item ───────────────────────────────────────────────────────

function SortablePlanTask({
  task,
  onEdit,
  onDelete,
  onUnassign,
  dayLabel,
}: {
  task: PlanTask
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onUnassign: (id: string) => void
  dayLabel?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-1.5 group p-2 rounded-md border border-border bg-card hover:bg-accent/50"
    >
      <div
        className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <span
          className="text-sm break-words cursor-text"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(task.id, task.content)
          }}
        >
          {task.content}
        </span>
        {task.assignedDay && dayLabel && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {dayLabel}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUnassign(task.id)
              }}
              className="text-muted-foreground hover:text-foreground"
              title="Remove assignment"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(task.id)
        }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5 transition-opacity"
        title="Delete task"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── PlanPanel ────────────────────────────────────────────────────────────────

export function PlanPanel({ weekId, startDate }: PlanPanelProps) {
  const [mainGoal, setMainGoal] = useState('')
  const [isSavingGoal, setIsSavingGoal] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskContent, setNewTaskContent] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskContent, setEditingTaskContent] = useState('')
  const [localTasks, setLocalTasks] = useState<PlanTask[]>([])

  const { data, mutate } = useSWR<{ plan: WeekPlanWithTasks | null }>(
    weekId ? `/api/weeks/${weekId}/plan` : null,
    fetcher
  )

  const plan = data?.plan

  useEffect(() => {
    setMainGoal(plan?.mainGoal || '')
    setLocalTasks(plan?.tasks || [])
  }, [plan])

  const weekDates = getWeekDates(new Date(startDate))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const getDayLabel = (isoDate: string) => {
    const idx = weekDates.findIndex((d) => formatDateForAPI(d) === isoDate)
    return idx !== -1 ? DAY_NAMES[idx] : isoDate
  }

  // Upsert plan and return its id
  const ensurePlanId = async (): Promise<string> => {
    if (plan?.id) return plan.id
    const res = await fetch(`/api/weeks/${weekId}/plan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mainGoal: '' }),
    })
    const json = await res.json()
    if (!res.ok || !json.plan) {
      throw new Error(json.error || `Failed to create plan (${res.status})`)
    }
    return json.plan.id
  }

  const handleGoalBlur = async () => {
    if (mainGoal === (plan?.mainGoal || '')) return
    setIsSavingGoal(true)
    try {
      await fetch(`/api/weeks/${weekId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainGoal }),
      })
      await mutate()
    } catch (err) {
      console.error('Failed to save main goal:', err)
    } finally {
      setIsSavingGoal(false)
    }
  }

  const handleAddTask = async () => {
    const content = newTaskContent.trim()
    setIsAddingTask(false)
    setNewTaskContent('')
    if (!content) return
    try {
      const planId = await ensurePlanId()
      await fetch('/api/plan-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, content }),
      })
      await mutate()
    } catch (err) {
      console.error('Failed to add task:', err)
    }
  }

  const handleSaveEdit = async () => {
    const content = editingTaskContent.trim()
    const id = editingTaskId
    setEditingTaskId(null)
    setEditingTaskContent('')
    if (!content || !id) return
    try {
      await fetch(`/api/plan-tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      await mutate()
    } catch (err) {
      console.error('Failed to edit task:', err)
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`/api/plan-tasks/${id}`, { method: 'DELETE' })
      await mutate()
      // Refresh todos in case a linked todo was deleted
      await globalMutate(`/api/weeks/${weekId}/todos`)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const handleUnassign = async (id: string) => {
    try {
      await fetch(`/api/plan-tasks/${id}/assign`, { method: 'DELETE' })
      await mutate()
      await globalMutate(`/api/weeks/${weekId}/todos`)
    } catch (err) {
      console.error('Failed to unassign task:', err)
    }
  }

  const handleAssignDay = async (taskId: string, day: string) => {
    try {
      await fetch(`/api/plan-tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, weekId }),
      })
      await mutate()
      await globalMutate(`/api/weeks/${weekId}/todos`)
    } catch (err) {
      console.error('Failed to assign task:', err)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const overId = over.id as string

    if (overId.startsWith('day-')) {
      const dayDate = overId.replace('day-', '')
      await handleAssignDay(active.id as string, dayDate)
    } else if (active.id !== over.id) {
      const oldIndex = localTasks.findIndex((t) => t.id === active.id)
      const newIndex = localTasks.findIndex((t) => t.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localTasks, oldIndex, newIndex)
        setLocalTasks(reordered)
        try {
          await fetch('/api/plan-tasks/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              updates: reordered.map((t, i) => ({ id: t.id, order: i })),
            }),
          })
          await mutate()
        } catch (err) {
          console.error('Failed to reorder tasks:', err)
        }
      }
    }
  }

  // Build per-day task map
  const tasksByDay: Record<string, PlanTask[]> = {}
  weekDates.forEach((d) => {
    tasksByDay[formatDateForAPI(d)] = []
  })
  localTasks.forEach((t) => {
    if (t.assignedDay && tasksByDay[t.assignedDay]) {
      tasksByDay[t.assignedDay].push(t)
    }
  })

  if (!data) {
    return (
      <div className="px-4 sm:px-6 md:px-12 py-8 text-sm text-muted-foreground">
        Loading plan...
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => pointerWithin(args).length > 0 ? pointerWithin(args) : closestCenter(args)}
      onDragEnd={handleDragEnd}
    >
      <div className="px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-8 space-y-6">
        {/* Main Goal */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Weekly Main Goal
          </label>
          <textarea
            value={mainGoal}
            onChange={(e) => setMainGoal(e.target.value)}
            onBlur={handleGoalBlur}
            placeholder="What's the main goal for this week?"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            disabled={isSavingGoal}
            spellCheck
            autoCorrect="on"
            autoCapitalize="sentences"
          />
        </div>

        {/* Calendar row */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="flex divide-x divide-border overflow-x-auto">
            {weekDates.map((date, idx) => {
              const dayStr = formatDateForAPI(date)
              return (
                <DayColumn
                  key={dayStr}
                  dayDate={dayStr}
                  dayLabel={DAY_NAMES[idx]}
                  tasks={tasksByDay[dayStr] || []}
                />
              )
            })}
          </div>
        </div>

        {/* Task list */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tasks
            </span>
          </div>

          <div className="p-2 space-y-1">
            <SortableContext
              items={localTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {localTasks.map((task) => {
                if (editingTaskId === task.id) {
                  return (
                    <div
                      key={task.id}
                      className="p-2 rounded-md border border-primary bg-card"
                    >
                      <input
                        type="text"
                        value={editingTaskContent}
                        onChange={(e) => setEditingTaskContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSaveEdit()
                          }
                          if (e.key === 'Escape') setEditingTaskId(null)
                        }}
                        onBlur={handleSaveEdit}
                        autoFocus
                        className="w-full text-sm border-none bg-transparent text-foreground focus:outline-none"
                        spellCheck
                      />
                    </div>
                  )
                }
                return (
                  <SortablePlanTask
                    key={task.id}
                    task={task}
                    onEdit={(id, content) => {
                      setEditingTaskId(id)
                      setEditingTaskContent(content)
                    }}
                    onDelete={handleDeleteTask}
                    onUnassign={handleUnassign}
                    dayLabel={task.assignedDay ? getDayLabel(task.assignedDay) : undefined}
                  />
                )
              })}
            </SortableContext>

            {localTasks.length === 0 && !isAddingTask && (
              <p className="text-xs text-muted-foreground italic py-2 px-1">
                No tasks yet. Drag them onto day columns to schedule.
              </p>
            )}

            {isAddingTask && (
              <div className="p-2 rounded-md border border-primary bg-card">
                <input
                  type="text"
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTask()
                    }
                    if (e.key === 'Escape') {
                      setIsAddingTask(false)
                      setNewTaskContent('')
                    }
                  }}
                  onBlur={handleAddTask}
                  autoFocus
                  placeholder="Task description..."
                  className="w-full text-sm border-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                  spellCheck
                />
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-t border-border">
            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add task
            </button>
          </div>
        </div>
      </div>
    </DndContext>
  )
}
