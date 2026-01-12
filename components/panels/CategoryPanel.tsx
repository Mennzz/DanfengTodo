'use client'

import React, { useState } from 'react'
import { useTodoContext } from '../providers/TodoProvider'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { cn } from '@/lib/utils'
import { Edit2, ChevronLeft, ChevronRight } from 'lucide-react'
import { EditCategoryModal } from '../modals/EditCategoryModal'
import type { Category } from '@/types'

export function CategoryPanel() {
  const {
    categories,
    selectedCategory,
    selectedYear,
    selectCategory,
    selectYear,
    addCategory,
    updateCategory,
    isLoadingCategories,
  } = useTodoContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setIsSubmitting(true)
    try {
      await addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      })
      setNewCategoryName('')
      setNewCategoryColor('#3B82F6')
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to add category:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCategory(category)
    setIsEditModalOpen(true)
  }

  const handlePrevYear = () => {
    selectYear(selectedYear - 1)
  }

  const handleNextYear = () => {
    selectYear(selectedYear + 1)
  }

  if (isLoadingCategories) {
    return (
      <div className="h-full bg-card">
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-card flex flex-col">
      {/* Year Selector */}
      {selectedCategory && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevYear}
              className="p-1 rounded hover:bg-accent transition-colors"
              title="Previous year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {selectedYear}
            </span>
            <button
              onClick={handleNextYear}
              className="p-1 rounded hover:bg-accent transition-colors"
              title="Next year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {categories.map((category) => {
          const isSelected = selectedCategory?.id === category.id

          return (
            <button
              key={category.id}
              onClick={() => selectCategory(category.id)}
              className={cn(
                "w-full px-4 py-3 mb-1 text-left transition-all rounded-md",
                "flex items-center gap-3 relative group",
                isSelected
                  ? 'bg-accent'
                  : 'hover:bg-accent/50'
              )}
            >
              {/* Colored indicator */}
              <div
                className="w-1 h-8 rounded-full absolute left-0"
                style={{ backgroundColor: category.color }}
              />

              {/* Category name */}
              <span className="text-sm text-foreground ml-3 flex-1">
                {category.name}
              </span>

              {/* Edit icon - visible on hover */}
              <Edit2
                className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleEditCategory(category, e)}
              />
            </button>
          )
        })}
      </div>

      {/* Add Category Button */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Category
        </Button>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Category"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={isSubmitting || !newCategoryName.trim()}>
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium mb-1">
              Category Name
            </label>
            <input
              id="categoryName"
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
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
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border"
              />
              <span className="text-sm text-muted-foreground">{newCategoryColor}</span>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={editingCategory}
        onSave={updateCategory}
      />
    </div>
  )
}
