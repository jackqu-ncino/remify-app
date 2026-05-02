'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Calendar, Bell, Plus, Trash2, Share2, Users,
  ChevronDown, CheckCircle, X, Loader2, ShieldCheck,
} from 'lucide-react'
import { differenceInDays, addYears, isBefore, startOfDay } from 'date-fns'

// ─── Types ──────────────────────────────────────────────────────────────────
type DateEvent = {
  id: string
  label: string
  month: number    // 1-12
  day: number      // 1-31
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function daysUntilNext(month: number, day: number): number {
  const today = startOfDay(new Date())
  let next = new Date(today.getFullYear(), month - 1, day)
  if (isBefore(next, today)) next = addYears(next, 1)
  return differenceInDays(next, today)
}

function typeEmoji(type: string): string {
  return EVENT_TYPES.find(t => t.value === type)?.label.split(' ')[0] ?? '⭐'
}

// ─── Add Date Modal ───────────────────────────────────────────────────────────
function AddDateModal({ token, onClose, onAdded }: {
  token: string
  onClose: () => void
  onAdded: (newDate: DateEvent) => void
}) {
  const [label, setLabel]       = useState('')
  const [type, setType]         = useState('birthday')
  const [month, setMonth]       = useState(1)
  const [day, setDay]           = useState(1)
  const [year, setYear]         = useState('')
  const [note, setNote]         = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const daysInMonth = new Date(2024, month, 0).getDate() // 2024 is leap year

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !createdBy.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/groups/${token}/dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          type,
          month,
          day,
          year: year ? parseInt(year) : null,
          note: note.trim() || null,
          createdBy: createdBy.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add date')
      onAdded(data as DateEvent)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Add important date</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What's the occasion?</label>
            <input
              value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Mom's Birthday"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="relative">
              <select
                value={type} onChange={e => setType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 appearance-none bg-white"
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <div className="relative">
                <select
                  value={month} onChange={e => { setMonth(Number(e.target.value)); setDay(1) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 appearance-none bg-white"
                >
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m.slice(0,3)}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <div className="relative">
                <select
                  value={day} onChange={e => setDay(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 appearance-none bg-white"
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d =>
                    <option key={d} value={d}>{d}</option>
                  )}
                </select>
                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Year <span className="text-gray-400 font-normal">(opt)</span></label>
              <input
                type="number" value={year} onChange={e => setYear(e.target.value)}
                placeholder="2024"
                min="1900" max="2100"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. She loves sunflowers"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              value={createdBy} onChange={e => setCreatedBy(e.target.value)}
              placeholder="e.g. Jack"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Saving…' : 'Add date'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Subscribe Modal ──────────────────────────────────────────────────────────
function SubscribeModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]   = useState(false)
  const [error, setError] = useState('')

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
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Get email reminders</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-800 mb-1">You're subscribed!</p>
            <p className="text-gray-500 text-sm mb-5">We'll email you 1 month, 10 days, and 1 day before each date.</p>
            <button onClick={onClose} className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <p className="text-gray-500 text-sm">Get reminded 1 month, 10 days, and 1 day before every date in this group.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Jack"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
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
function DateCard({ event, token, onDeleted }: {
  event: DateEvent
  token: string
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const days = daysUntilNext(event.month, event.day)
  const monthName = MONTHS[event.month - 1]

  let urgency = 'bg-gray-100 text-gray-600'
  if (days <= 1)  urgency = 'bg-red-100 text-red-700'
  else if (days <= 10) urgency = 'bg-orange-100 text-orange-700'
  else if (days <= 31) urgency = 'bg-yellow-100 text-yellow-700'

  async function handleDelete() {
    if (!confirm(`Remove "${event.label}"?`)) return
    setDeleting(true)
    await fetch(`/api/dates/${event.id}?token=${token}`, { method: 'DELETE' })
    onDeleted()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 animate-fade-in">
      <div className="text-3xl flex-shrink-0">{typeEmoji(event.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{event.label}</p>
        <p className="text-gray-500 text-sm">
          {monthName} {event.day}{event.year ? `, ${event.year}` : ''}
        </p>
        {event.note && <p className="text-gray-400 text-xs mt-0.5 truncate">{event.note}</p>}
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${urgency}`}>
          {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow!' : `${days}d`}
        </span>
        <button
          onClick={handleDelete} disabled={deleting}
          className="text-gray-300 hover:text-red-400 transition-colors"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ─── Main Group Page ──────────────────────────────────────────────────────────
export default function GroupPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  const [group, setGroup]   = useState<Group | null>(null)
  const [dates, setDates]   = useState<DateEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [showSub, setShowSub]   = useState(false)
  const [copied, setCopied]     = useState(false)
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(
    searchParams.get('verified') === 'true'
  )

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${token}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Group not found')
      setGroup(data.group)
      // Sort by days until next occurrence
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
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <Calendar className="w-12 h-12 text-gray-300" />
      <h1 className="text-xl font-semibold text-gray-700">Group not found</h1>
      <p className="text-gray-400 text-sm">{error}</p>
      <a href="/" className="text-brand-600 text-sm hover:underline">← Create a new group</a>
    </div>
  )

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            <h1 className="font-semibold text-gray-800 truncate">{group?.name}</h1>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:text-brand-700 flex-shrink-0"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </header>

      {/* Verified banner */}
      {showVerifiedBanner && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm font-medium flex-1">Your group is verified and active!</p>
            <button onClick={() => setShowVerifiedBanner(false)} className="text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pending banner */}
      {group?.status === 'pending' && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
            <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-800 text-sm font-medium">
              This group is awaiting email verification. Check your inbox to activate it.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Action row */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowSub(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Bell className="w-4 h-4 text-brand-500" />
            Get reminders
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add date
          </button>
        </div>

        {/* Dates list */}
        {dates.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📅</div>
            <p className="font-medium text-gray-600 mb-1">No dates yet</p>
            <p className="text-gray-400 text-sm">Add the first important date to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {dates.length} date{dates.length !== 1 ? 's' : ''} · sorted by next occurrence
            </p>
            {dates.map(event => (
              <DateCard key={event.id} event={event} token={token} onDeleted={fetchData} />
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
    </main>
  )
}
