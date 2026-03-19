'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FileText, Bold, Italic, Strikethrough, List } from 'lucide-react'

interface DayNoteEditorProps {
  date: string
  categoryId: string
  initialContent?: string
  disabled?: boolean
}

export function DayNoteEditor({ date, categoryId, initialContent = '', disabled = false }: DayNoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const lastSavedRef = useRef(initialContent)

  // Initialize innerHTML via ref to avoid React/contentEditable conflicts
  useEffect(() => {
    lastSavedRef.current = initialContent
    setIsExpanded(!!initialContent)
  }, [initialContent])

  useEffect(() => {
    if (editorRef.current && isExpanded) {
      editorRef.current.innerHTML = initialContent
    }
  }, [isExpanded]) // only on expand, not on every initialContent change to avoid cursor reset

  const handleSave = async () => {
    if (disabled || !editorRef.current) return
    const html = editorRef.current.innerHTML
    if (html === lastSavedRef.current) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/categories/${categoryId}/day-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, content: html }),
      })
      if (!res.ok) throw new Error('Failed to save day note')
      lastSavedRef.current = html
    } catch (error) {
      console.error('Error saving day note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFormat = (command: string) => {
    if (disabled) return
    document.execCommand(command, false)
    editorRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      document.execCommand(e.shiftKey ? 'outdent' : 'indent', false)
    }
  }

  const hasContent = !!initialContent && initialContent !== '<br>'

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-2 pt-4 border-t">
        <FileText className="w-5 h-5 text-muted-foreground" />
        <button
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className="flex-1 text-left text-sm text-muted-foreground hover:text-foreground transition-colors disabled:cursor-not-allowed"
        >
          {hasContent ? 'View note...' : 'Add a note...'}
        </button>
      </div>
    )
  }

  return (
    <div className="pt-4 border-t space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Day Note</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('bold') }}
            disabled={disabled}
            title="Bold"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('italic') }}
            disabled={disabled}
            title="Italic"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('strikeThrough') }}
            disabled={disabled}
            title="Strikethrough"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFormat('insertUnorderedList') }}
            disabled={disabled}
            title="Bullet list"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        data-placeholder="Add notes for this day..."
        className="day-note-editor w-full min-h-[80px] px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
      />
      {isSaving && (
        <p className="text-xs text-muted-foreground">Saving...</p>
      )}
    </div>
  )
}
