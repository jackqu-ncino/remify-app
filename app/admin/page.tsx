'use client'

import { useState, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type TierRow = {
  id: string
  email: string
  tier: string
  group_limit: number | null
  notes: string | null
  created_at: string
}

type AdminTab = 'groups' | 'tiers'

type GroupRow = {
  id: string
  name: string
  token: string
  status: 'active' | 'pending'
  owner_email: string
  created_by: string
  created_at: string
  date_count: number
  subscriber_count: number
}

type LookupResult = {
  owned: { name: string; token: string; status: string }[]
  subscribed: { group_name: string; token: string }[]
}

type SortKey = 'newest' | 'oldest' | 'most_dates' | 'most_subscribers' | 'name_az'
type StatusFilter = 'all' | 'active' | 'pending'

// ─── Admin Page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  // Auth
  const [secretInput, setSecretInput] = useState('')
  const [secret, setSecret]           = useState('')
  const [authed, setAuthed]           = useState(false)
  const [authError, setAuthError]     = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('groups')

  // Groups
  const [groups, setGroups]           = useState<GroupRow[]>([])
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey]         = useState<SortKey>('newest')

  // Email lookup
  const [lookupEmail, setLookupEmail]   = useState('')
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError]   = useState('')

  // Delete group
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)

  // Remove subscriber
  const [removingSubscriber, setRemovingSubscriber] = useState<{ email: string; token: string } | null>(null)

  // Tiers
  const [tiers, setTiers]               = useState<TierRow[]>([])
  const [tiersLoading, setTiersLoading] = useState(false)
  const [tiersError, setTiersError]     = useState('')
  const [newTierEmail, setNewTierEmail] = useState('')
  const [newTierTier, setNewTierTier]   = useState('beta')
  const [newTierLimit, setNewTierLimit] = useState<string>('')
  const [newTierNotes, setNewTierNotes] = useState('')
  const [addingTier, setAddingTier]     = useState(false)
  const [addTierError, setAddTierError] = useState('')
  const [deletingTierId, setDeletingTierId] = useState<string | null>(null)
  const [editingTier, setEditingTier]   = useState<TierRow | null>(null)
  const [savingTierId, setSavingTierId] = useState<string | null>(null)

  // ── Auth ────────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/admin/groups', {
        headers: { 'x-admin-secret': secretInput },
      })
      if (res.status === 401) {
        setAuthError('Wrong secret.')
        return
      }
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setGroups(data)
      setSecret(secretInput)
      setAuthed(true)
    } catch (err: any) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // ── Tiers ───────────────────────────────────────────────────────────────────
  async function loadTiers(s: string) {
    setTiersLoading(true)
    setTiersError('')
    try {
      const res = await fetch('/api/admin/tiers', { headers: { 'x-admin-secret': s } })
      if (!res.ok) throw new Error('Failed to load tiers')
      setTiers(await res.json())
    } catch (err: any) {
      setTiersError(err.message)
    } finally {
      setTiersLoading(false)
    }
  }

  async function handleTabChange(tab: AdminTab) {
    setActiveTab(tab)
    if (tab === 'tiers' && tiers.length === 0) await loadTiers(secret)
  }

  async function handleAddTier(e: React.FormEvent) {
    e.preventDefault()
    setAddingTier(true)
    setAddTierError('')
    try {
      const res = await fetch('/api/admin/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          email: newTierEmail.trim(),
          tier: newTierTier,
          group_limit: newTierLimit === '' ? null : parseInt(newTierLimit, 10),
          notes: newTierNotes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add tier')
      setTiers(prev => [data, ...prev])
      setNewTierEmail('')
      setNewTierTier('beta')
      setNewTierLimit('')
      setNewTierNotes('')
    } catch (err: any) {
      setAddTierError(err.message)
    } finally {
      setAddingTier(false)
    }
  }

  async function handleSaveTierEdit() {
    if (!editingTier) return
    setSavingTierId(editingTier.id)
    try {
      const res = await fetch(`/api/admin/tiers/${editingTier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          tier: editingTier.tier,
          group_limit: editingTier.group_limit,
          notes: editingTier.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setTiers(prev => prev.map(t => t.id === data.id ? data : t))
      setEditingTier(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSavingTierId(null)
    }
  }

  async function handleDeleteTier(id: string, email: string) {
    if (!confirm(`Remove tier for ${email}? They'll revert to the free tier limit.`)) return
    setDeletingTierId(id)
    try {
      const res = await fetch(`/api/admin/tiers/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      })
      if (!res.ok) throw new Error('Delete failed')
      setTiers(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeletingTierId(null)
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:       groups.length,
    active:      groups.filter(g => g.status === 'active').length,
    pending:     groups.filter(g => g.status === 'pending').length,
    subscribers: groups.reduce((sum, g) => sum + g.subscriber_count, 0),
  }), [groups])

  const filtered = useMemo(() => {
    let list = [...groups]
    if (statusFilter !== 'all') list = list.filter(g => g.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.owner_email.toLowerCase().includes(q)
      )
    }
    switch (sortKey) {
      case 'newest':           list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
      case 'oldest':           list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
      case 'most_dates':       list.sort((a, b) => b.date_count - a.date_count); break
      case 'most_subscribers': list.sort((a, b) => b.subscriber_count - a.subscriber_count); break
      case 'name_az':          list.sort((a, b) => a.name.localeCompare(b.name)); break
    }
    return list
  }, [groups, search, statusFilter, sortKey])

  // ── Delete group ────────────────────────────────────────────────────────────
  async function handleDeleteGroup(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its dates and subscribers? This cannot be undone.`)) return
    setDeletingGroupId(id)
    try {
      const res = await fetch(`/api/admin/groups/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      })
      if (!res.ok) throw new Error('Delete failed')
      setGroups(prev => prev.filter(g => g.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeletingGroupId(null)
    }
  }

  // ── Remove subscriber ────────────────────────────────────────────────────────
  async function handleRemoveSubscriber(email: string, groupToken: string, groupName: string) {
    if (!confirm(`Remove ${email} from "${groupName}"?`)) return
    setRemovingSubscriber({ email, token: groupToken })
    try {
      const res = await fetch(
        `/api/admin/subscribers?email=${encodeURIComponent(email)}&group_token=${groupToken}`,
        { method: 'DELETE', headers: { 'x-admin-secret': secret } }
      )
      if (!res.ok) throw new Error('Remove failed')
      // Update lookup results in place
      setLookupResult(prev => prev
        ? { ...prev, subscribed: prev.subscribed.filter(s => s.token !== groupToken) }
        : prev
      )
      // Update subscriber count in the groups list
      setGroups(prev => prev.map(g =>
        g.token === groupToken
          ? { ...g, subscriber_count: Math.max(0, g.subscriber_count - 1) }
          : g
      ))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRemovingSubscriber(null)
    }
  }

  // ── Email lookup ────────────────────────────────────────────────────────────
  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!lookupEmail.trim()) return
    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)
    try {
      const res = await fetch(`/api/admin/lookup?email=${encodeURIComponent(lookupEmail.trim())}`, {
        headers: { 'x-admin-secret': secret },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lookup failed')
      setLookupResult(data)
    } catch (err: any) {
      setLookupError(err.message)
    } finally {
      setLookupLoading(false)
    }
  }

  // ── Password gate ───────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand-800 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h1 className="font-semibold text-gray-900">Remify Admin</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={secretInput}
              onChange={e => setSecretInput(e.target.value)}
              placeholder="Admin secret"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              autoFocus
              required
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              {authLoading ? 'Checking…' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-brand-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <span className="text-white font-medium text-[15px]">Admin</span>
          </div>
          <span className="text-white/50 text-xs">remify.app</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

        {/* Tab switcher */}
        <div className="flex gap-2">
          {(['groups', 'tiers'] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-brand-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats — always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total groups',  value: stats.total,       color: 'text-gray-900' },
            { label: 'Active',        value: stats.active,      color: 'text-green-700' },
            { label: 'Pending',       value: stats.pending,     color: 'text-amber-600' },
            { label: 'Subscribers',   value: stats.subscribers, color: 'text-brand-800' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {activeTab === 'groups' && (<>

        {/* Groups section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 space-y-3">
            <h2 className="font-medium text-gray-900">Groups</h2>

            {/* Search + Sort */}
            <div className="flex gap-2">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              />
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="most_dates">Most dates</option>
                <option value="most_subscribers">Most subscribers</option>
                <option value="name_az">Name A→Z</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'pending'] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-brand-800 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {s === 'all'     ? ` (${stats.total})`   :
                   s === 'active'  ? ` (${stats.active})`  :
                                    ` (${stats.pending})`}
                </button>
              ))}
            </div>
          </div>

          {/* Group rows */}
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No groups match your search.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(g => (
                <div key={g.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/group/${g.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sm text-gray-900 hover:text-brand-800 transition-colors"
                        >
                          {g.name}
                        </a>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          g.status === 'active'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {g.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{g.owner_email}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        📅 {g.date_count} date{g.date_count !== 1 ? 's' : ''}
                        &nbsp;·&nbsp;
                        👥 {g.subscriber_count} subscriber{g.subscriber_count !== 1 ? 's' : ''}
                        &nbsp;·&nbsp;
                        {new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(g.id, g.name)}
                      disabled={deletingGroupId === g.id}
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5 disabled:opacity-40"
                      title="Delete group"
                    >
                      {deletingGroupId === g.id
                        ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email lookup */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-medium text-gray-900 mb-3">Email lookup</h2>

          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="email"
              value={lookupEmail}
              onChange={e => setLookupEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
              required
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              {lookupLoading ? '…' : 'Look up'}
            </button>
          </form>

          {lookupError && <p className="text-red-500 text-sm mt-3">{lookupError}</p>}

          {lookupResult && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Owned groups ({lookupResult.owned.length})
                </p>
                {lookupResult.owned.length === 0 ? (
                  <p className="text-xs text-gray-300">None</p>
                ) : (
                  <div className="space-y-1.5">
                    {lookupResult.owned.map(g => (
                      <div key={g.token} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-800 font-medium">{g.name}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            g.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}>{g.status}</span>
                        </div>
                        <a
                          href={`/group/${g.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-800 hover:underline"
                        >
                          View →
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Subscribed to ({lookupResult.subscribed.length})
                </p>
                {lookupResult.subscribed.length === 0 ? (
                  <p className="text-xs text-gray-300">None</p>
                ) : (
                  <div className="space-y-1.5">
                    {lookupResult.subscribed.map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-800">{s.group_name}</span>
                        <div className="flex items-center gap-3">
                          <a
                            href={`/group/${s.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-800 hover:underline"
                          >
                            View →
                          </a>
                          <button
                            onClick={() => handleRemoveSubscriber(lookupEmail.trim(), s.token, s.group_name)}
                            disabled={removingSubscriber?.token === s.token}
                            className="text-xs text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                            title="Remove subscriber"
                          >
                            {removingSubscriber?.token === s.token ? '…' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        </>)}

        {/* ── Tiers tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'tiers' && (
          <div className="space-y-5">

            {/* Add tier form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-medium text-gray-900 mb-4">Add email override</h2>
              <form onSubmit={handleAddTier} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newTierEmail}
                    onChange={e => setNewTierEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
                    required
                  />
                  <select
                    value={newTierTier}
                    onChange={e => setNewTierTier(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
                  >
                    <option value="beta">Beta</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={newTierLimit}
                    onChange={e => setNewTierLimit(e.target.value)}
                    placeholder="Group limit (blank = unlimited)"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
                  />
                </div>
                <input
                  type="text"
                  value={newTierNotes}
                  onChange={e => setNewTierNotes(e.target.value)}
                  placeholder="Notes (optional — e.g. pickleball buddy, beta tester)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
                />
                {addTierError && <p className="text-red-500 text-sm">{addTierError}</p>}
                <button
                  type="submit"
                  disabled={addingTier}
                  className="bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {addingTier ? 'Adding…' : 'Add override'}
                </button>
              </form>
            </div>

            {/* Tiers list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-medium text-gray-900">Email overrides</h2>
                <span className="text-xs text-gray-400">{tiers.length} entr{tiers.length !== 1 ? 'ies' : 'y'}</span>
              </div>

              {tiersLoading ? (
                <p className="text-gray-400 text-sm text-center py-10">Loading…</p>
              ) : tiersError ? (
                <p className="text-red-400 text-sm text-center py-10">{tiersError}</p>
              ) : tiers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">No overrides yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tiers.map(t => (
                    <div key={t.id} className="px-5 py-3.5">
                      {editingTier?.id === t.id ? (
                        /* Inline edit row */
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-800">{t.email}</p>
                          <div className="flex gap-2">
                            <select
                              value={editingTier.tier}
                              onChange={e => setEditingTier({ ...editingTier, tier: e.target.value })}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-800/30"
                            >
                              <option value="beta">Beta</option>
                              <option value="basic">Basic</option>
                              <option value="premium">Premium</option>
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={editingTier.group_limit ?? ''}
                              onChange={e => setEditingTier({ ...editingTier, group_limit: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                              placeholder="Limit (blank = unlimited)"
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800/30"
                            />
                          </div>
                          <input
                            type="text"
                            value={editingTier.notes ?? ''}
                            onChange={e => setEditingTier({ ...editingTier, notes: e.target.value })}
                            placeholder="Notes"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800/30"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveTierEdit}
                              disabled={savingTierId === t.id}
                              className="bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {savingTierId === t.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingTier(null)}
                              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Read row */
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900">{t.email}</span>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                t.tier === 'beta'    ? 'bg-purple-50 text-purple-700' :
                                t.tier === 'basic'   ? 'bg-blue-50 text-blue-700' :
                                                       'bg-amber-50 text-amber-700'
                              }`}>
                                {t.tier}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {t.group_limit === null ? 'unlimited groups' : `${t.group_limit} group${t.group_limit !== 1 ? 's' : ''}`}
                              </span>
                            </div>
                            {t.notes && <p className="text-xs text-gray-400 mt-0.5">{t.notes}</p>}
                            <p className="text-xs text-gray-300 mt-0.5">
                              Added {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                            <button
                              onClick={() => setEditingTier(t)}
                              className="text-gray-300 hover:text-brand-800 transition-colors"
                              title="Edit"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTier(t.id, t.email)}
                              disabled={deletingTierId === t.id}
                              className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                              title="Remove"
                            >
                              {deletingTierId === t.id
                                ? <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                              }
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
