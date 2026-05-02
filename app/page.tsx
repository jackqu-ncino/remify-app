'use client'

import { useState } from 'react'
import { Calendar, Bell, Users, Heart, Mail } from 'lucide-react'

export default function Home() {
  const [groupName, setGroupName]     = useState('')
  const [yourName, setYourName]       = useState('')
  const [ownerEmail, setOwnerEmail]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!groupName.trim() || !yourName.trim() || !ownerEmail.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          creatorName: yourName.trim(),
          ownerEmail: ownerEmail.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create group')
      // Show "check your inbox" screen
      setPendingEmail(ownerEmail.trim())
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  // ── Check-your-inbox screen ───────────────────────────────────────────────
  if (pendingEmail) {
    return (
      <main className="min-h-screen flex flex-col">
        <header className="px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-800 text-lg">Remify</span>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-brand-100 flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Check your inbox</h1>
          <p className="text-gray-500 text-base max-w-sm mb-2">
            We sent a confirmation link to
          </p>
          <p className="font-semibold text-gray-800 text-base mb-6">{pendingEmail}</p>
          <p className="text-gray-400 text-sm max-w-xs">
            Click the link in the email to activate your group. It expires in 24 hours.
          </p>

          <button
            onClick={() => {
              setPendingEmail(null)
              setLoading(false)
            }}
            className="mt-10 text-brand-600 text-sm hover:underline"
          >
            ← Use a different email
          </button>
        </div>
      </main>
    )
  }

  // ── Create group form ─────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-gray-800 text-lg">Remify</span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-brand-100 flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
          Never miss what<br />matters most
        </h1>
        <p className="text-gray-500 text-lg max-w-sm mb-10">
          Create a shared space for your family or friends to track birthdays, anniversaries, and every special occasion.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: Bell, text: 'Reminders 1 month, 10 days & 1 day before' },
            { icon: Users, text: 'Shared with your whole group' },
            { icon: Calendar, text: 'Works on phone & laptop' },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded-full shadow-sm">
              <Icon className="w-3.5 h-3.5 text-brand-500" />
              {text}
            </span>
          ))}
        </div>

        {/* Create group form */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in">
          <h2 className="font-semibold text-gray-800 text-lg mb-4">Create your group</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group name</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. The Quinn Family"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                type="text"
                value={yourName}
                onChange={e => setYourName(e.target.value)}
                placeholder="e.g. Jack"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your email</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Used to verify and manage your group</p>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Sending confirmation…' : 'Create group →'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-gray-400 text-sm">
          No password needed — we'll send you a confirmation link
        </p>
      </div>
    </main>
  )
}
