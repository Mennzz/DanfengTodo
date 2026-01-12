'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import { Checkbox } from './Checkbox'
import { DraggableTodoItem } from './DraggableTodoItem'
import type { TodoWithSubtasks } from '@/types'

interface TodoItemProps {
  todo: TodoWithSubtasks
  level: number
  editingTodoId: string | null
  editingContent: string
  isCombinedView: boolean
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onStartEdit: (id: string, content: string) => void
  onSaveEdit: (id: string) => void
  onEditKeyDown: (id: string, e: React.KeyboardEvent<HTMLInputElement>) => void
  onContextMenu: (e: React.MouseEvent, todo: TodoWithSubtasks) => void
  setEditingContent: (content: string) => void
}

export function TodoItem({
  todo,
  level,
  editingTodoId,
  editingContent,
  isCombinedView,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onEditKeyDown,
  onContextMenu,
  setEditingContent,
}: TodoItemProps) {
  const indentClass = level > 0 ? `ml-${level * 8}` : ''
  const indentStyle = level > 0 ? { marginLeft: `${level * 32}px` } : {}

  return (
    <>
      <div style={indentStyle}>
        <DraggableTodoItem
          todo={todo}
          disabled={isCombinedView}
          onContextMenu={(e) => onContextMenu(e, todo)}
        >
          <div className="pt-1">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => onToggle(todo.id, todo.completed)}
              disabled={isCombinedView}
            />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {editingTodoId === todo.id ? (
              <input
                type="text"
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={(e) => onEditKeyDown(todo.id, e)}
                onBlur={() => onSaveEdit(todo.id)}
                autoFocus
                className="flex-1 px-3 py-2 sm:px-2 sm:py-1 text-base border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="sentences"
                autoComplete="off"
              />
            ) : (
              <>
                <span
                  onClick={() => !isCombinedView && onStartEdit(todo.id, todo.content)}
                  className={`text-sm sm:text-base ${
                    todo.completed
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  } ${!isCombinedView ? 'cursor-text hover:bg-muted/50 px-2 py-1 rounded transition-colors' : ''}`}
                >
                  {todo.content}
                </span>
                {isCombinedView && 'categoryName' in todo && (
                  <span
                    className="text-xs px-2 py-0.5 rounded text-white whitespace-nowrap"
                    style={{ backgroundColor: (todo as any).categoryColor }}
                  >
                    {(todo as any).categoryName}
                  </span>
                )}
              </>
            )}
          </div>
          {!isCombinedView && (
            <button
              onClick={() => onDelete(todo.id)}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-destructive active:text-destructive transition-opacity p-2 sm:p-1"
              title="Delete"
            >
              <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          )}
        </DraggableTodoItem>
      </div>

      {/* Render subtasks recursively */}
      {todo.subtasks && todo.subtasks.length > 0 && (
        <>
          {todo.subtasks.map((subtask) => (
            <TodoItem
              key={subtask.id}
              todo={subtask as TodoWithSubtasks}
              level={level + 1}
              editingTodoId={editingTodoId}
              editingContent={editingContent}
              isCombinedView={isCombinedView}
              onToggle={onToggle}
              onDelete={onDelete}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onEditKeyDown={onEditKeyDown}
              onContextMenu={onContextMenu}
              setEditingContent={setEditingContent}
            />
          ))}
        </>
      )}
    </>
  )
}
