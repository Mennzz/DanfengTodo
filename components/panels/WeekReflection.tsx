'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import useSWR, { mutate } from 'swr'

interface WeekReflectionProps {
  weekId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function WeekReflection({ weekId }: WeekReflectionProps) {
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Fetch existing reflection
  const { data, isLoading } = useSWR(
    weekId ? `/api/weeks/${weekId}/reflection` : null,
    fetcher
  )

  // Update local state when data is loaded
  useEffect(() => {
    if (data?.reflection) {
      setContent(data.reflection.content || '')
    } else {
      setContent('')
    }
  }, [data])

  const handleSave = async () => {
    if (!weekId) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/weeks/${weekId}/reflection`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) throw new Error('Failed to save reflection')

      setLastSaved(new Date())
      await mutate(`/api/weeks/${weekId}/reflection`)
    } catch (error) {
      console.error('Error saving reflection:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save on blur
  const handleBlur = () => {
    if (content !== (data?.reflection?.content || '')) {
      handleSave()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-normal">Weekly Reflection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg md:text-xl font-normal">Weekly Reflection</CardTitle>
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved at {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          placeholder="Reflect on your week... What went well? What could be improved? Any lessons learned?"
          className="w-full min-h-[150px] sm:min-h-[200px] px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          disabled={isSaving}
          spellCheck={true}
          autoCorrect="on"
          autoCapitalize="sentences"
          autoComplete="off"
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {content.length} characters
          </p>
          <button
            onClick={handleSave}
            disabled={isSaving || content === (data?.reflection?.content || '')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 active:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
