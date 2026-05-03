'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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

export default function UnsubscribePage() {
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [groupName, setGroupName] = useState('')
  const [groupToken, setGroupToken] = useState<string | null>(null)

  useEffect(() => {
    async function unsubscribe() {
      try {
        const res = await fetch(`/api/unsubscribe/${token}`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setGroupName(data.groupName)
        setGroupToken(data.groupToken)
        setStatus('done')
      } catch {
        setStatus('error')
      }
    }
    unsubscribe()
  }, [token])

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-brand-800 px-5 py-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
          <RemifyIcon size={16} color="#fff" />
        </div>
        <span className="font-medium text-white text-[15px]">Remify</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {status === 'loading' && (
          <>
            <svg className="animate-spin w-8 h-8 text-brand-800 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            <p className="text-gray-400 text-sm">Processing your request…</p>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <h1 className="text-xl font-medium text-gray-900 mb-2">You've been unsubscribed</h1>
            <p className="text-gray-500 text-sm max-w-xs mb-6">
              You'll no longer receive reminder emails from <span className="font-medium text-gray-700">{groupName}</span>.
            </p>
            {groupToken && (
              <a
                href={`/group/${groupToken}`}
                className="text-brand-800 text-sm hover:underline"
              >
                ← Go back to {groupName}
              </a>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mb-5">
              <RemifyIcon size={28} color="#3B0764" />
            </div>
            <h1 className="text-xl font-medium text-gray-900 mb-2">Link not found</h1>
            <p className="text-gray-400 text-sm max-w-xs">
              This unsubscribe link has already been used or is invalid.
            </p>
            <a href="/" className="mt-6 text-brand-800 text-sm hover:underline">
              ← Back to Remify
            </a>
          </>
        )}
      </div>
    </main>
  )
}
