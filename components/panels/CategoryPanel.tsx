'use client'

import React, { useState } from 'react'
import { useTodoContext } from '../providers/TodoProvider'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function CategoryPanel() {
  const { categories, selectedCategory, selectCategory, addCategory, isLoadingCategories } =
    useTodoContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      alert('Failed to add category. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingCategories) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-800">
        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-800 flex flex-col">
      {/* Category List - OneNote Style */}
      <div className="flex-1 overflow-y-auto py-2">
        {categories.map((category) => {
          const isSelected = selectedCategory?.id === category.id

          return (
            <button
              key={category.id}
              onClick={() => selectCategory(category.id)}
              className={`
                w-full px-4 py-3 text-left transition-colors relative
                flex items-center gap-3
                ${
                  isSelected
                    ? 'bg-white dark:bg-gray-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }
              `}
            >
              {/* Colored tab on the left - OneNote style */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${isSelected ? 'w-1.5' : 'w-1'}`}
                style={{ backgroundColor: category.color }}
              />

              {/* Category name */}
              <span className={`text-sm flex-1 ${isSelected ? 'font-medium' : ''} text-gray-900 dark:text-gray-100`}>
                {category.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Add Category Button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-left"
        >
          + Add Category
        </button>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Category"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
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
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category Name
            </label>
            <input
              id="categoryName"
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Work Daily - 2025"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="categoryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="categoryColor"
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{newCategoryColor}</span>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
