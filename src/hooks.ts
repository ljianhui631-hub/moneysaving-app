import { useMemo } from 'react'
import { getActiveGoal, getDailyBudget, getDailySaving, getEssentialTotal, projectGoal, useStore } from './store'
import { toDateKey } from './lib/utils'

/** 首页/弹窗共用的派生数据 */
export function useDerived() {
  const s = useStore()
  return useMemo(() => {
    const dailyBudget = getDailyBudget(s)
    const essentialTotal = getEssentialTotal(s)
    const dailySaving = getDailySaving(s)
    const goal = getActiveGoal(s)
    const projection = projectGoal(goal, dailySaving)
    const today = toDateKey()
    const todaySpent = s.records
      .filter((r) => r.date.startsWith(today) && r.decision !== 'resist')
      .reduce((a, r) => a + r.amount, 0)
    return { dailyBudget, essentialTotal, dailySaving, goal, projection, today, todaySpent }
  }, [s])
}
