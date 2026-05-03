import { differenceInDays, addYears, isBefore, startOfDay } from 'date-fns'

export const EVENT_TYPES = [
  { value: 'birthday',    label: '🎂 Birthday' },
  { value: 'anniversary', label: '💍 Anniversary' },
  { value: 'graduation',  label: '🎓 Graduation' },
  { value: 'wedding',     label: '💒 Wedding' },
  { value: 'passing',     label: '🕯️ Remembrance' },
  { value: 'other',       label: '⭐ Other' },
]

export function daysUntilNext(month: number, day: number, today = startOfDay(new Date())): number {
  let next = new Date(today.getFullYear(), month - 1, day)
  if (isBefore(next, today)) next = addYears(next, 1)
  return differenceInDays(next, today)
}

export function typeEmoji(type: string): string {
  return EVENT_TYPES.find(t => t.value === type)?.label.split(' ')[0] ?? '⭐'
}

export function urgencyStyle(days: number): { badge: string; num: string; unit: string } {
  if (days <= 1)  return { badge: 'bg-red-50',    num: 'text-red-800',    unit: 'text-red-600' }
  if (days <= 10) return { badge: 'bg-amber-50',  num: 'text-amber-800',  unit: 'text-amber-600' }
  if (days <= 31) return { badge: 'bg-brand-50',  num: 'text-brand-800',  unit: 'text-brand-700' }
  return              { badge: 'bg-gray-100',  num: 'text-gray-600',   unit: 'text-gray-400' }
}

export const FREE_TIER_LIMIT = 1
