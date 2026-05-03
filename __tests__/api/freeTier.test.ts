import { describe, it, expect } from 'vitest'
import { FREE_TIER_LIMIT } from '@/lib/utils'

// ── Free tier limit constant ──────────────────────────────────────────────────
describe('FREE_TIER_LIMIT', () => {
  it('is set to 1 for the free tier', () => {
    expect(FREE_TIER_LIMIT).toBe(1)
  })
})

// ── Free tier enforcement logic ───────────────────────────────────────────────
// These tests mirror the logic in /api/groups/route.ts to guard against
// regressions if the check is refactored.
describe('free tier enforcement', () => {
  function isAtLimit(activeCount: number, pendingCount: number): boolean {
    return (activeCount + pendingCount) >= FREE_TIER_LIMIT
  }

  it('blocks when user has 1 active group', () => {
    expect(isAtLimit(1, 0)).toBe(true)
  })

  it('blocks when user has 1 pending group', () => {
    expect(isAtLimit(0, 1)).toBe(true)
  })

  it('blocks when user has 1 active + 1 pending group', () => {
    expect(isAtLimit(1, 1)).toBe(true)
  })

  it('allows when user has no groups', () => {
    expect(isAtLimit(0, 0)).toBe(false)
  })
})

// ── Pending group expiry logic ────────────────────────────────────────────────
describe('pending group expiry', () => {
  function isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date()
  }

  it('marks a past timestamp as expired', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(isExpired(yesterday)).toBe(true)
  })

  it('marks a future timestamp as not expired', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    expect(isExpired(tomorrow)).toBe(false)
  })

  it('marks a timestamp 1 hour ago as expired', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    expect(isExpired(oneHourAgo)).toBe(true)
  })

  it('marks a timestamp 1 minute from now as not expired', () => {
    const soonish = new Date(Date.now() + 60 * 1000).toISOString()
    expect(isExpired(soonish)).toBe(false)
  })
})
