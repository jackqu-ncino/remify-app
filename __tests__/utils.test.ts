import { describe, it, expect } from 'vitest'
import { startOfDay } from 'date-fns'
import { daysUntilNext, typeEmoji, urgencyStyle } from '@/lib/utils'

// ── daysUntilNext ─────────────────────────────────────────────────────────────
describe('daysUntilNext', () => {
  it('returns 0 when the date is today', () => {
    const today = startOfDay(new Date())
    expect(daysUntilNext(today.getMonth() + 1, today.getDate(), today)).toBe(0)
  })

  it('returns 1 when the date is tomorrow', () => {
    const today = new Date(2026, 0, 14) // Jan 14
    expect(daysUntilNext(1, 15, today)).toBe(1)
  })

  it('rolls over to next year when date has passed this year', () => {
    const today = new Date(2026, 5, 20) // Jun 20
    const days = daysUntilNext(6, 15, today) // Jun 15 — already passed
    expect(days).toBeGreaterThan(300) // should be ~360 days away
  })

  it('returns correct days for a future date same year', () => {
    const today = new Date(2026, 0, 1) // Jan 1
    expect(daysUntilNext(1, 11, today)).toBe(10) // Jan 11 is 10 days away
  })

  it('handles leap year dates correctly', () => {
    const today = new Date(2026, 1, 27) // Feb 27
    expect(daysUntilNext(2, 28, today)).toBe(1)
  })
})

// ── typeEmoji ────────────────────────────────────────────────────────────────
describe('typeEmoji', () => {
  it('returns correct emoji for known types', () => {
    expect(typeEmoji('birthday')).toBe('🎂')
    expect(typeEmoji('anniversary')).toBe('💍')
    expect(typeEmoji('graduation')).toBe('🎓')
    expect(typeEmoji('wedding')).toBe('💒')
    expect(typeEmoji('passing')).toBe('🕯️')
    expect(typeEmoji('other')).toBe('⭐')
  })

  it('falls back to ⭐ for unknown types', () => {
    expect(typeEmoji('unknown')).toBe('⭐')
    expect(typeEmoji('')).toBe('⭐')
  })
})

// ── urgencyStyle ─────────────────────────────────────────────────────────────
describe('urgencyStyle', () => {
  it('returns red styles for 0 days (today)', () => {
    const { badge } = urgencyStyle(0)
    expect(badge).toBe('bg-red-50')
  })

  it('returns red styles for 1 day', () => {
    const { badge, num } = urgencyStyle(1)
    expect(badge).toBe('bg-red-50')
    expect(num).toBe('text-red-800')
  })

  it('returns amber styles for 10 days', () => {
    const { badge } = urgencyStyle(10)
    expect(badge).toBe('bg-amber-50')
  })

  it('returns amber styles for anything 2–10 days', () => {
    for (let d = 2; d <= 10; d++) {
      expect(urgencyStyle(d).badge).toBe('bg-amber-50')
    }
  })

  it('returns brand styles for 11–31 days', () => {
    for (let d = 11; d <= 31; d++) {
      expect(urgencyStyle(d).badge).toBe('bg-brand-50')
    }
  })

  it('returns gray styles for 32+ days', () => {
    expect(urgencyStyle(32).badge).toBe('bg-gray-100')
    expect(urgencyStyle(365).badge).toBe('bg-gray-100')
  })
})
