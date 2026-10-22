import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** ¥ 金额格式化：整数不带小数，否则保留 1 位 */
export function yuan(n: number) {
  if (!Number.isFinite(n)) return '¥—'
  const r = Math.round(n * 10) / 10
  return `¥${Number.isInteger(r) ? r : r.toFixed(1)}`
}

export function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/* ---------- 本地日期（YYYY-MM-DD，基于用户时区） ---------- */
export function toDateKey(d: Date = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number) {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + n)
  return toDateKey(d)
}

/** b - a 的自然日差 */
export function diffDays(a: string, b: string) {
  const ms = parseDateKey(b).getTime() - parseDateKey(a).getTime()
  return Math.round(ms / 86_400_000)
}

export function formatDateCN(key: string) {
  const d = parseDateKey(key)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatShort(key: string) {
  const d = parseDateKey(key)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function vibrate(ms = 12) {
  if ('vibrate' in navigator) navigator.vibrate?.(ms)
}
