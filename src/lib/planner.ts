import { ACTION_LIBRARY, type DowngradeAction } from '../data/actions'
import { round1 } from './utils'

export interface PlannedAction {
  id: string
  /** 分配到该动作的每日节省额 */
  save: number
}

export interface PlanCandidate {
  actions: PlannedAction[]
  total: number
  /** 是否能覆盖每日缺口 */
  feasible: boolean
}

const mid = (a: DowngradeAction) => (a.saveMin + a.saveMax) / 2

function combos<T>(arr: T[], k: number): T[][] {
  const out: T[][] = []
  const walk = (start: number, acc: T[]) => {
    if (acc.length === k) return void out.push([...acc])
    for (let i = start; i < arr.length; i++) {
      acc.push(arr[i])
      walk(i + 1, acc)
      acc.pop()
    }
  }
  walk(0, [])
  return out
}

/**
 * 在 [min,max] 区间内为每个动作分配节省额，使总和尽量等于每日缺口。
 * 先全部取下限，再按"可上浮空间"比例分配剩余缺口。
 */
function allocate(set: DowngradeAction[], gap: number): PlannedAction[] {
  const sumMin = set.reduce((s, a) => s + a.saveMin, 0)
  const room = set.reduce((s, a) => s + (a.saveMax - a.saveMin), 0)
  const need = Math.max(0, gap - sumMin)
  const ratio = room > 0 ? Math.min(1, need / room) : 0
  return set.map((a) => ({ id: a.id, save: round1(a.saveMin + (a.saveMax - a.saveMin) * ratio) }))
}

/**
 * 紧缩期清单动态拼单：
 *   每日需补差 = 超支总额 ÷ N
 *   从可用的「每日型」校园动作中枚举 2~3 个互不冲突的组合，
 *   优先：能覆盖缺口 → 中位节省最贴近缺口 → 动作更少 → 跨类别（更契合作息）。
 */
export function rankPlans(dailyGap: number, disabled: string[] = []): PlanCandidate[] {
  const pool = ACTION_LIBRARY.filter((a) => a.frequency === 'daily' && !disabled.includes(a.id))
  if (pool.length === 0 || dailyGap <= 0) return []

  const sets = [...combos(pool, 2), ...combos(pool, 3)].filter((set) => {
    const groups = new Set(set.map((a) => a.group))
    return groups.size === set.length
  })
  // 池子太小，只能出单个动作
  if (sets.length === 0) pool.forEach((a) => sets.push([a]))

  const scored = sets.map((set) => {
    const sumMin = set.reduce((s, a) => s + a.saveMin, 0)
    const sumMax = set.reduce((s, a) => s + a.saveMax, 0)
    const sumMid = set.reduce((s, a) => s + mid(a), 0)
    const feasible = sumMax >= dailyGap
    const cats = new Set(set.map((a) => a.category)).size
    let score: number
    if (feasible) {
      // 覆盖缺口时：下限超出越多越"浪费意志力"，中位偏离越小越好
      score = Math.abs(sumMid - dailyGap) + Math.max(0, sumMin - dailyGap) * 0.8 + (set.length - 2) * 4 - cats * 1.5
    } else {
      score = 1000 + (dailyGap - sumMax) * 10
    }
    return { set, score, feasible }
  })

  scored.sort((a, b) => a.score - b.score)

  // 去掉动作完全相同的重复（排序稳定，保留第一个）
  return scored.map(({ set, feasible }) => {
    const actions = allocate(set, dailyGap)
    return { actions, feasible, total: round1(actions.reduce((s, a) => s + a.save, 0)) }
  })
}

/** 在当前动作池下，单日最多能补多少（用于推荐补差天数） */
export function maxDailyCapacity(disabled: string[] = []) {
  const ranked = rankPlans(9999, disabled)
  return ranked.reduce((m, p) => Math.max(m, p.total), 0)
}

export function suggestDays(amount: number, disabled: string[] = []) {
  const cap = maxDailyCapacity(disabled)
  if (cap <= 0) return 4
  return Math.min(7, Math.max(2, Math.ceil(amount / (cap * 0.75))))
}
