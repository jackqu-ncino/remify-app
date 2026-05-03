'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { differenceInDays, addYears, isBefore, startOfDay } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────────────
type DateEvent = {
  id: string
  label: string
  month: number
  day: number
  year: number | null
  type: string
  note: string | null
  created_by: string
}

type Group = {
  id: string
  name: string
  token: string
  created_at: string
  status: string
}

// ─── Constants ───────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { value: 'birthday',    label: '🎂 Birthday' },
  { value: 'anniversary', label: '💍 Anniversary' },
  { value: 'graduation',  label: '🎓 Graduation' },
  { value: 'wedding',     label: '💒 Wedding' },
  { value: 'passing',     label: '🕯️ Remembrance' },
  { value: 'other',       label: '⭐ Other' },
]

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function daysUntilNext(month: number, day: number): number {
  const today = startOfDay(new Date())
  let next = new Date(today.getFullYear(), month - 1, day)
  if (isBefore(next, today)) next = addYears(next, 1)
  return differenceInDays(next, today)
}

function typeEmoji(type: string): string {
  return EVENT_TYPES.find(t => t.value === type)?.label.split(' ')[0] ?? '⭐'
}

function urgencyStyle(days: number): { badge: string; num: string; unit: string } {
  if (days <= 1)  return { badge: 'bg-red-50',    num: 'text-red-800',    unit: 'text-red-600' }
  if (days <= 10) return { badge: 'bg-amber-50',  num: 'text-amber-800',  unit: 'text-amber-600' }
  if (days <= 31) return { badge: 'bg-brand-50',  num: 'text-brand-800',  unit: 'text-brand-700' }
  return              { badge: 'bg-gray-100',  num: 'text-gray-600',   unit: 'text-gray-400' }
}

// ─── PWA Install Banner ───────────────────────────────────────────────────────
function InstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Already installed as standalone PWA — don't show
    const isStandalone =
      ('standalone' in navigator && (navigator as any).standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches

    if (isStandalone) return

    // Only show on iOS Safari (Android can use beforeinstallprompt natively)
    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/.test(ua)
    const isSafari = isIOS && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
    if (!isSafari) return

    // Only show once — respect prior dismissal
    if (localStorage.getItem('remify-install-dismissed')) return

    setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem('remify-install-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-purple-50 border-b border-purple-100">
      <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-800 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 13.5S2 9.5 2 5.5C2 3.6 3.6 2 5.5 2c1.1 0 2 .6 2.5 1.4C8.5 2.6 9.4 2 10.5 2 12.4 2 14 3.6 14 5.5c0 4-6 8-6 8z"
              stroke="white" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
            <path d="M8 6v2l1.2 1.2" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-brand-900 leading-tight">Add Remify to your home screen</p>
          <p className="text-[11px] text-purple-500 mt-0.5 flex items-center gap-0.5">
            Tap
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mx-0.5 text-purple-400"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share → Add to Home Screen
          </p>
        </div>
        <button onClick={dismiss} className="text-purple-300 hover:text-purple-500 flex-shrink-0 p-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  )
}

// ─── Heart-clock icon ────────────────────────────────────────────────────────
function RemifyIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
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

// ─── Add Date Modal ───────────────────────────────────────────────────────────
function AddDateModal({ token, onClose, onAdded }: {
  token: string
  onClose: () => void
  onAdded: (newDate: DateEvent) => void
}) {
  const [label, setLabel]     = useState('')
  const [type, setType]       = useState('birthday')
  const [month, setMonth]     = useState(1)
  const [day, setDay]         = useState(1)
  const [year, setYear]       = useState('')
  const [note, setNote]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const daysInMonth = new Date(2024, month, 0).getDate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/groups/${token}/dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(), type, month, day,
          year: year ? parseInt(year) : null,
          note: note.trim() || null,
          createdBy: 'group member',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add date')
      onAdded(data as DateEvent)
    } catch (err: any) {
      setError(err.message); setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Add important date</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">What's the occasion?</label>
            <input
              value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Mom's Birthday"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={type} onChange={e => setType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
            >
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Month</label>
              <select
                value={month} onChange={e => { setMonth(Number(e.target.value)); setDay(1) }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m.slice(0,3)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Day</label>
              <select
                value={day} onChange={e => setDay(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d =>
                  <option key={d} value={d}>{d}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year <span className="text-gray-300">(opt)</span></label>
              <input
                type="number" value={year} onChange={e => setYear(e.target.value)}
                placeholder="2024" min="1900" max="2100"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Note <span className="text-gray-300">(optional)</span></label>
            <input
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. She loves sunflowers"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Saving…' : 'Add date'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Edit Date Modal ──────────────────────────────────────────────────────────
function EditDateModal({ token, date, onClose, onSaved }: {
  token: string
  date: DateEvent
  onClose: () => void
  onSaved: (updated: DateEvent) => void
}) {
  const [label, setLabel]     = useState(date.label)
  const [type, setType]       = useState(date.type)
  const [month, setMonth]     = useState(date.month)
  const [day, setDay]         = useState(date.day)
  const [year, setYear]       = useState(date.year ? String(date.year) : '')
  const [note, setNote]       = useState(date.note ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const daysInMonth = new Date(2024, month, 0).getDate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/dates/${date.id}?token=${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(), type, month, day,
          year: year ? parseInt(year) : null,
          note: note.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onSaved(data as DateEvent)
    } catch (err: any) {
      setError(err.message); setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Edit date</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">What's the occasion?</label>
            <input
              value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Mom's Birthday"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={type} onChange={e => setType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
            >
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Month</label>
              <select
                value={month} onChange={e => { setMonth(Number(e.target.value)); setDay(1) }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m.slice(0,3)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Day</label>
              <select
                value={day} onChange={e => setDay(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d =>
                  <option key={d} value={d}>{d}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year <span className="text-gray-300">(opt)</span></label>
              <input
                type="number" value={year} onChange={e => setYear(e.target.value)}
                placeholder="2024" min="1900" max="2100"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Note <span className="text-gray-300">(optional)</span></label>
            <input
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. She loves sunflowers"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Subscribe Modal ──────────────────────────────────────────────────────────
function SubscribeModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/groups/${token}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')
      setDone(true)
    } catch (err: any) {
      setError(err.message); setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Get email reminders</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <p className="font-medium text-gray-900 mb-1">You're subscribed!</p>
            <p className="text-gray-500 text-sm mb-5">We'll email you 1 month, 10 days, and 1 day before each date.</p>
            <button onClick={onClose} className="bg-brand-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-900 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <p className="text-gray-500 text-sm">Get reminded 1 month, 10 days, and 1 day before every date in this group.</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Your name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Jack"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Subscribing…' : 'Subscribe to reminders'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Date Card ────────────────────────────────────────────────────────────────
function DateCard({ event, token, onDeleted, onEdit }: {
  event: DateEvent
  token: string
  onDeleted: () => void
  onEdit: () => void
}) {
  const [deleting, setDeleting]           = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const days = daysUntilNext(event.month, event.day)
  const monthName = MONTHS[event.month - 1]
  const { badge, num, unit } = urgencyStyle(days)

  async function handleDelete() {
    setConfirmingDelete(false)
    setDeleting(true)
    await fetch(`/api/dates/${event.id}?token=${token}`, { method: 'DELETE' })
    onDeleted()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 animate-fade-in">
      {/* Countdown badge */}
      <div className={`${badge} rounded-xl flex flex-col items-center justify-center flex-shrink-0`} style={{ width: 52, height: 52 }}>
        <span className="text-base leading-none">{typeEmoji(event.type)}</span>
        <span className={`text-base font-medium leading-tight ${num}`}>
          {days === 0 ? '🎉' : days}
        </span>
        {days > 0 && (
          <span className={`text-[9px] uppercase tracking-wide ${unit}`}>
            {days === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{event.label}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          {monthName} {event.day}{event.year ? `, ${event.year}` : ''}
        </p>
        {event.note && <p className="text-gray-400 text-xs mt-0.5 truncate">{event.note}</p>}
      </div>

      {/* Edit & Delete */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {confirmingDelete ? (
          // Inline confirmation
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Remove?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-medium text-white bg-red-400 hover:bg-red-500 px-2 py-0.5 rounded-lg transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-brand-700 transition-colors"
              title="Edit"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={deleting}
              className="text-gray-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              {deleting
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
              }
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Group Page ──────────────────────────────────────────────────────────
export default function GroupPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = params.token as string

  const [group, setGroup]   = useState<Group | null>(null)
  const [dates, setDates]   = useState<DateEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [showSub, setShowSub]       = useState(false)
  const [editingDate, setEditingDate] = useState<DateEvent | null>(null)
  const [copied, setCopied]   = useState(false)
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(
    searchParams.get('verified') === 'true'
  )

  // Strip ?verified=true from URL so refresh doesn't re-show the banner
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      router.replace(`/group/${token}`, { scroll: false })
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${token}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Group not found')
      setGroup(data.group)
      const sorted = [...data.dates].sort(
        (a: DateEvent, b: DateEvent) => daysUntilNext(a.month, a.day) - daysUntilNext(b.month, b.day)
      )
      setDates(sorted)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleShare() {
    const url = window.location.href
    try {
      await navigator.share({ title: group?.name, url })
    } catch {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <svg className="animate-spin w-8 h-8 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      </svg>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-gray-50">
      <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
        <RemifyIcon size={28} color="#3B0764" />
      </div>
      <h1 className="text-xl font-medium text-gray-700">Group not found</h1>
      <p className="text-gray-400 text-sm">{error}</p>
      <a href="/" className="text-brand-800 text-sm hover:underline">← Create a new group</a>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-brand-800 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <RemifyIcon size={16} color="#fff" />
            </div>
            <div className="min-w-0">
              <h1 className="font-medium text-white text-[15px] truncate">{group?.name}</h1>
              <p className="text-white/50 text-[11px]">
                {dates.length} date{dates.length !== 1 ? 's' : ''} · sorted by next occurrence
              </p>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-white/80 font-medium hover:text-white flex-shrink-0 bg-white/10 rounded-lg px-3 py-1.5 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </header>

      <InstallBanner />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">

        {/* Verified banner */}
        {showVerifiedBanner && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p className="text-green-800 text-sm font-medium flex-1">Your group is verified and active!</p>
            <button onClick={() => setShowVerifiedBanner(false)} className="text-green-500 hover:text-green-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        {/* Pending banner */}
        {group?.status === 'pending' && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <p className="text-amber-800 text-sm font-medium">Awaiting email verification — check your inbox to activate.</p>
          </div>
        )}

        {/* Action row */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-800 hover:bg-brand-900 rounded-xl py-3 text-sm font-medium text-white shadow-sm transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4"/></svg>
            Add date
          </button>
          <button
            onClick={() => setShowSub(true)}
            className="flex items-center justify-center gap-1.5 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-100 shadow-sm transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4e108a" strokeWidth="1.5"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            Email me
          </button>
        </div>

        {/* Dates list */}
        {dates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
              <RemifyIcon size={28} color="#3B0764" />
            </div>
            <p className="font-medium text-gray-600 mb-1">No dates yet</p>
            <p className="text-gray-400 text-sm">Add the first important date to get started</p>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {dates.map(event => (
              <DateCard
                key={event.id}
                event={event}
                token={token}
                onDeleted={fetchData}
                onEdit={() => setEditingDate(event)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddDateModal
          token={token}
          onClose={() => setShowAdd(false)}
          onAdded={(newDate) => {
            setShowAdd(false)
            setDates(prev => {
              const updated = [...prev, newDate]
              return updated.sort((a, b) => daysUntilNext(a.month, a.day) - daysUntilNext(b.month, b.day))
            })
          }}
        />
      )}
      {showSub && <SubscribeModal token={token} onClose={() => setShowSub(false)} />}
      {editingDate && (
        <EditDateModal
          token={token}
          date={editingDate}
          onClose={() => setEditingDate(null)}
          onSaved={(updated) => {
            setEditingDate(null)
            setDates(prev => {
              const updated_list = prev.map(d => d.id === updated.id ? updated : d)
              return updated_list.sort((a, b) => daysUntilNext(a.month, a.day) - daysUntilNext(b.month, b.day))
            })
          }}
        />
      )}
    </main>
  )
}
