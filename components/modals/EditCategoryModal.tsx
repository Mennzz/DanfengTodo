'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { Category, UpdateCategoryInput } from '@/types'

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  onSave: (id: string, data: UpdateCategoryInput) => Promise<void>
}

export function EditCategoryModal({ isOpen, onClose, category, onSave }: EditCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState('#3B82F6')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      setCategoryName(category.name)
      setCategoryColor(category.color)
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !categoryName.trim()) return

    setIsSubmitting(true)
    try {
      await onSave(category.id, {
        name: categoryName.trim(),
        color: categoryColor,
      })
      onClose()
    } catch (error) {
      console.error('Failed to update category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!category) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Category"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !categoryName.trim()}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="categoryName" className="block text-sm font-medium mb-1">
            Category Name
          </label>
          <input
            id="categoryName"
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="e.g., Work Daily - 2025"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="categoryColor" className="block text-sm font-medium mb-1">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="categoryColor"
              type="color"
              value={categoryColor}
              onChange={(e) => setCategoryColor(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer border"
            />
            <span className="text-sm text-muted-foreground">{categoryColor}</span>
          </div>
        </div>
      </form>
    </Modal>
  )
}
