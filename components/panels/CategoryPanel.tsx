'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTodoContext } from '../providers/TodoProvider'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { cn } from '@/lib/utils'
import { Edit2, ChevronLeft, ChevronRight, Users, Share2, GripVertical } from 'lucide-react'
import { EditCategoryModal } from '../modals/EditCategoryModal'
import { ShareCategoryModal } from '../modals/ShareCategoryModal'
import type { Category } from '@/types'

function SortableCategoryItem({
  category,
  isSelected,
  isAdmin,
  userId,
  onSelect,
  onEdit,
  onShare,
}: {
  category: Category
  isSelected: boolean
  isAdmin: boolean
  userId?: string
  onSelect: () => void
  onEdit: (e: React.MouseEvent) => void
  onShare: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <button
        onClick={onSelect}
        className={cn(
          'w-full px-4 py-3 mb-1 text-left transition-all rounded-md',
          'flex items-center gap-3 relative group',
          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
        )}
      >
        {/* Colored indicator */}
        <div
          className="w-1 h-8 rounded-full absolute left-0"
          style={{ backgroundColor: category.color }}
        />

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="ml-3 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>

        {/* Category name */}
        <span className="text-sm text-foreground flex-1">{category.name}</span>

        {/* Share icon */}
        {(isAdmin || userId === category.ownerId) && (
          <Share2
            className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onShare}
          />
        )}

        {/* Edit icon */}
        <Edit2
          className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onEdit}
        />
      </button>
    </div>
  )
}

export function CategoryPanel() {
  const {
    categories,
    selectedCategory,
    selectedYear,
    selectCategory,
    selectYear,
    addCategory,
    updateCategory,
    reorderCategories,
    isLoadingCategories,
  } = useTodoContext()
  const { data: session } = useSession()
  const router = useRouter()
  const isAdmin = session?.user.role === 'ADMIN'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(categories, oldIndex, newIndex)
    reorderCategories(reordered.map((c) => c.id))
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [sharingCategory, setSharingCategory] = useState<Category | null>(null)

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

  const handleShareCategory = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation()
    setSharingCategory(category)
    setIsShareModalOpen(true)
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map((category) => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                isSelected={selectedCategory?.id === category.id}
                isAdmin={isAdmin}
                userId={session?.user.id}
                onSelect={() => selectCategory(category.id)}
                onEdit={(e) => handleEditCategory(category, e)}
                onShare={(e) => handleShareCategory(category, e)}
              />
            ))}
          </SortableContext>
        </DndContext>
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

      {/* Admin Section */}
      {isAdmin && (
        <div className="px-4 pb-4 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Admin
          </p>
          <button
            onClick={() => router.push('/admin/users')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        </div>
      )}


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

      {/* Share Category Modal */}
      <ShareCategoryModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        category={sharingCategory}
      />
    </div>
  )
}
