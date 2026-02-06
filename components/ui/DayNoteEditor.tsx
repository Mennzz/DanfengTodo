'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FileText } from 'lucide-react'

interface DayNoteEditorProps {
  date: string
  categoryId: string
  initialContent?: string
  disabled?: boolean
}

export function DayNoteEditor({ date, categoryId, initialContent = '', disabled = false }: DayNoteEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(initialContent)
    setIsExpanded(!!initialContent)
  }, [initialContent])

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`
    }
  }, [content, isExpanded])

  const handleSave = async () => {
    if (disabled) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/categories/${categoryId}/day-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, content }),
      })

      if (!res.ok) throw new Error('Failed to save day note')
    } catch (error) {
      console.error('Error saving day note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBlur = () => {
    if (content !== initialContent) {
      handleSave()
    }
  }

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-2 pt-4 border-t">
        <FileText className="w-5 h-5 text-muted-foreground" />
        <button
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className="flex-1 text-left text-sm text-muted-foreground hover:text-foreground transition-colors disabled:cursor-not-allowed"
        >
          {content ? 'View note...' : 'Add a note...'}
        </button>
      </div>
    )
  }

  return (
    <div className="pt-4 border-t space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Day Note</span>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add notes for this day..."
        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none overflow-hidden"
        disabled={disabled || isSaving}
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="sentences"
        autoComplete="off"
      />
      {isSaving && (
        <p className="text-xs text-muted-foreground">Saving...</p>
      )}
    </div>
  )
}
