'use client'

import { useState } from 'react'

// Heart-clock icon — heart outline with clock hands inside
function RemifyIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 13.5S2 9.5 2 5.5C2 3.6 3.6 2 5.5 2c1.1 0 2 .6 2.5 1.4C8.5 2.6 9.4 2 10.5 2 12.4 2 14 3.6 14 5.5c0 4-6 8-6 8z"
        stroke={color} strokeWidth="1.2" strokeLinejoin="round"
      />
      <path
        d="M8 6v2l1.2 1.2"
        stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Home() {
  const [groupName, setGroupName]   = useState('')
  const [yourName, setYourName]     = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
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
      setPendingEmail(ownerEmail.trim())
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  // ── Check-your-inbox screen ───────────────────────────────────────────────
  if (pendingEmail) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-brand-800 px-5 py-4 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
            <RemifyIcon size={16} color="#fff" />
          </div>
          <span className="font-medium text-white text-[15px]">Remify</span>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mb-5">
            <RemifyIcon size={28} color="#3B0764" />
          </div>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-gray-500 text-sm mb-1">We sent a confirmation link to</p>
          <p className="font-medium text-gray-800 text-sm mb-5">{pendingEmail}</p>
          <p className="text-gray-400 text-sm max-w-xs">
            Click the link in the email to activate your group. It expires in 24 hours.
          </p>
          <button
            onClick={() => { setPendingEmail(null); setLoading(false) }}
            className="mt-10 text-brand-800 text-sm hover:underline"
          >
            ← Use a different email
          </button>
        </div>
      </main>
    )
  }

  // ── Create group form ─────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header / Hero */}
      <div className="bg-brand-800 px-5 pt-5 pb-7">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
            <RemifyIcon size={16} color="#fff" />
          </div>
          <span className="font-medium text-white text-[15px]">Remify</span>
        </div>
        <h1 className="text-[30px] font-medium text-white leading-[1.2] mb-2">
          Never miss what matters most
        </h1>
        <p className="text-white/60 text-[13px]">
          Shared reminders for your family and friends
        </p>
      </div>

      {/* Form */}
      <div className="px-4 py-4 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-medium text-gray-900 text-[15px] mb-4">Create your group</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Group name</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. The Quinn Family"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30 focus:border-brand-800/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Your name</label>
              <input
                type="text"
                value={yourName}
                onChange={e => setYourName(e.target.value)}
                placeholder="e.g. Jack"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30 focus:border-brand-800/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Your email</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30 focus:border-brand-800/50"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">Used to verify and manage your group</p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors text-sm mt-1"
            >
              {loading ? 'Sending confirmation…' : 'Create group →'}
            </button>
          </form>
          <p className="text-center text-[11px] text-gray-400 mt-3">
            We'll send you a confirmation link
          </p>
        </div>
      </div>
    </main>
  )
}
