'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { Category } from '@/types'

const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type ShareUser = {
  id: string
  email: string
  name: string | null
}

type Share = {
  id: string
  user: ShareUser
}

interface ShareCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
}

export function ShareCategoryModal({ isOpen, onClose, category }: ShareCategoryModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const sharesKey = isOpen && category ? `/api/categories/${category.id}/shares` : null
  const { data, mutate } = useSWR<{ shares: Share[] }>(sharesKey, fetcher)
  const shares = data?.shares ?? []

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !category) return
    setError('')
    setIsAdding(true)

    try {
      const res = await fetch(`/api/categories/${category.id}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const result = await res.json()

      if (!res.ok) {
        setError(result.error ?? 'Something went wrong')
        return
      }

      setEmail('')
      await mutate()
    } catch {
      setError('Something went wrong')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleRemove(userId: string) {
    if (!category) return
    setRemovingId(userId)

    try {
      await fetch(`/api/categories/${category.id}/shares`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      await mutate()
    } catch {
      console.error('Failed to remove share')
    } finally {
      setRemovingId(null)
    }
  }

  function handleClose() {
    setEmail('')
    setError('')
    onClose()
  }

  if (!category) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Share "${category.name}"`}
      footer={
        <Button variant="outline" onClick={handleClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Add by email */}
        <form onSubmit={handleAdd} className="space-y-2">
          <label className="block text-sm font-medium">Invite by email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="friend@example.com"
              className={inputClass}
              autoFocus
            />
            <Button type="submit" disabled={isAdding || !email.trim()}>
              {isAdding ? 'Adding…' : 'Add'}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        {/* Current shares */}
        <div>
          <p className="text-sm font-medium mb-2">
            Shared with
            {shares.length > 0 && (
              <span className="ml-1 text-muted-foreground font-normal">({shares.length})</span>
            )}
          </p>

          {!data ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not shared with anyone yet.</p>
          ) : (
            <ul className="space-y-1">
              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 bg-muted"
                >
                  <div className="min-w-0">
                    {share.user.name && (
                      <p className="text-sm font-medium truncate">{share.user.name}</p>
                    )}
                    <p className="text-sm text-muted-foreground truncate">{share.user.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(share.user.id)}
                    disabled={removingId === share.user.id}
                    className="ml-3 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
