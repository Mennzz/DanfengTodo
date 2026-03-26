'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50'

type Tab = 'profile' | 'password'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { data: session, update: updateSession } = useSession()
  const [tab, setTab] = useState<Tab>('profile')

  // Profile tab state
  const [name, setName] = useState(session?.user.name ?? '')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  function handleClose() {
    setTab('profile')
    setName(session?.user.name ?? '')
    setProfileError('')
    setProfileSuccess(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess(false)
    onClose()
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess(false)
    setSavingProfile(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setProfileError(data.error ?? 'Something went wrong')
        return
      }

      // Update the NextAuth session so the header reflects the new name immediately
      await updateSession({ name: data.user.name })
      setProfileSuccess(true)
    } catch {
      setProfileError('Something went wrong')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    setSavingPassword(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setPasswordError(data.error ?? 'Something went wrong')
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
    } catch {
      setPasswordError('Something went wrong')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Account settings">
      {/* Tabs */}
      <div className="flex border-b mb-5 -mt-1">
        {(['profile', 'password'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={session?.user.email ?? ''}
              disabled
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setProfileSuccess(false); setProfileError('') }}
              placeholder="Your name"
              className={inputClass}
              autoFocus
            />
          </div>
          {profileError && <p className="text-sm text-destructive">{profileError}</p>}
          {profileSuccess && <p className="text-sm text-green-600">Name updated.</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
              placeholder="••••••••"
              className={inputClass}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
              placeholder="Min. 8 characters"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-green-600">Password updated successfully.</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {savingPassword ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
