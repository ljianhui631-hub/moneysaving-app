import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ACTION_MAP, BADGES, type BadgeStats } from './data/actions'
import type { PlannedAction } from './lib/planner'
import { addDays, diffDays, round1, toDateKey, uid } from './lib/utils'

/* ======================= 类型 ======================= */

export type BudgetMode = 'monthly' | 'daily'

export interface Essential {
  id: string
  name: string
  amount: number
  kind: 'food' | 'other'
}

export interface Goal {
  id: string
  name: string
  emoji: string
  target: number
  saved: number
  deadline: string
  createdAt: string
  /** 因冲动消费/补差失败累计的延期天数 */
  delayDays: number
}

export type Decision = 'resist' | 'accept' | 'austerity'

export interface SpendRecord {
  id: string
  date: string
  label: string
  amount: number
  decision: Decision
  goalId: string
  delayDays: number
}

export interface DayLog {
  checked: string[]
  spent: number
  done: boolean
}

export interface AusterityPlan {
  id: string
  goalId: string
  label: string
  amount: number
  days: number
  dailyTarget: number
  startDate: string
  actions: PlannedAction[]
  logs: Record<number, DayLog>
  recovered: number
  status: 'active' | 'completed' | 'failed'
  endedAt?: string
  failReason?: string
}

export interface Notice {
  kind: 'fail' | 'success' | 'badge' | 'info'
  title: string
  message: string
  badgeIds?: string[]
}

interface State {
  budgetMode: BudgetMode
  monthly: number
  daysInMonth: number
  dailyCustom: number
  essentials: Essential[]

  goals: Goal[]
  activeGoalId: string

  records: SpendRecord[]
  achievementFund: number
  resistTotal: number
  resistCount: number

  plan: AusterityPlan | null
  planHistory: AusterityPlan[]
  disabledActions: string[]

  actionDays: Record<string, number>
  streak: number
  lastStreakDate: string | null
  badges: string[]
  lastDepositDate: string | null

  notices: Notice[]
}

interface Actions {
  setBudget: (p: Partial<Pick<State, 'budgetMode' | 'monthly' | 'daysInMonth' | 'dailyCustom'>>) => void
  updateEssential: (id: string, p: Partial<Essential>) => void
  addEssential: () => void
  removeEssential: (id: string) => void

  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'delayDays'>) => void
  updateGoal: (id: string, p: Partial<Goal>) => void
  removeGoal: (id: string) => void
  setActiveGoal: (id: string) => void
  depositToday: () => void
  deposit: (amount: number) => void
  moveFundToGoal: () => void

  recordImpulse: (
    label: string,
    amount: number,
    decision: Decision,
    plan?: { days: number; actions: PlannedAction[] },
  ) => void
  toggleCheck: (actionId: string) => void
  logSpendToday: (amount: number) => void
  abandonPlan: () => void
  syncPlan: () => void

  toggleDisabledAction: (id: string) => void
  dismissNotice: () => void
  pushNotice: (n: Notice) => void
  replaceState: (data: Partial<State>) => void
  resetAll: () => void
}

export type Store = State & Actions

/* ======================= 派生计算 ======================= */

export function getDailyBudget(s: Pick<State, 'budgetMode' | 'monthly' | 'daysInMonth' | 'dailyCustom'>) {
  return s.budgetMode === 'monthly' ? s.monthly / Math.max(1, s.daysInMonth) : s.dailyCustom
}

export function getEssentialTotal(s: Pick<State, 'essentials'>) {
  return s.essentials.reduce((acc, e) => acc + (Number(e.amount) || 0), 0)
}

export function getDailySaving(s: State) {
  return getDailyBudget(s) - getEssentialTotal(s)
}

export function getActiveGoal(s: State) {
  return s.goals.find((g) => g.id === s.activeGoalId) ?? s.goals[0]
}

export interface GoalProjection {
  remaining: number
  progress: number
  baseDays: number
  totalDays: number
  projectedDate: string | null
  daysToDeadline: number
  requiredDaily: number
  onTrack: boolean
}

export function projectGoal(goal: Goal, dailySaving: number, today = toDateKey()): GoalProjection {
  const remaining = Math.max(0, goal.target - goal.saved)
  const progress = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0
  const daysToDeadline = diffDays(today, goal.deadline)
  if (remaining === 0) {
    return { remaining, progress, baseDays: 0, totalDays: 0, projectedDate: today, daysToDeadline, requiredDaily: 0, onTrack: true }
  }
  if (dailySaving <= 0) {
    return {
      remaining,
      progress,
      baseDays: Infinity,
      totalDays: Infinity,
      projectedDate: null,
      daysToDeadline,
      requiredDaily: daysToDeadline > 0 ? remaining / daysToDeadline : remaining,
      onTrack: false,
    }
  }
  const baseDays = remaining / dailySaving
  const totalDays = Math.ceil(baseDays + goal.delayDays)
  const projectedDate = addDays(today, totalDays)
  return {
    remaining,
    progress,
    baseDays,
    totalDays,
    projectedDate,
    daysToDeadline,
    requiredDaily: daysToDeadline > 0 ? remaining / daysToDeadline : remaining,
    onTrack: diffDays(projectedDate, goal.deadline) >= 0,
  }
}

/** 今天是紧缩期第几天（1-based） */
export function planDayIndex(plan: AusterityPlan, today = toDateKey()) {
  return diffDays(plan.startDate, today) + 1
}

/** 今日校园开销上限：日支配额度 - 今日需补差金额 */
export function planDailyCap(s: State, plan: AusterityPlan) {
  return Math.max(0, getDailyBudget(s) - plan.dailyTarget)
}

export function todayImpulseSpent(s: State, today = toDateKey()) {
  return s.records
    .filter((r) => r.date.startsWith(today) && r.decision !== 'resist')
    .reduce((acc, r) => acc + r.amount, 0)
}

/* ======================= 默认值 ======================= */

const today0 = toDateKey()

const defaultEssentials: Essential[] = [
  { id: 'e-breakfast', name: '食堂早餐', amount: 5, kind: 'food' },
  { id: 'e-lunch', name: '食堂午餐', amount: 15, kind: 'food' },
  { id: 'e-dinner', name: '食堂晚餐', amount: 15, kind: 'food' },
  { id: 'e-utility', name: '校园网/水电均摊', amount: 3, kind: 'other' },
  { id: 'e-commute', name: '校巴/公交通勤', amount: 2, kind: 'other' },
]

const defaultGoal: Goal = {
  id: 'g-ipad',
  name: 'iPad Air + 笔',
  emoji: '📱',
  target: 4999,
  saved: 1200,
  deadline: addDays(today0, 150),
  createdAt: today0,
  delayDays: 0,
}

const initialState: State = {
  budgetMode: 'monthly',
  monthly: 1800,
  daysInMonth: 30,
  dailyCustom: 60,
  essentials: defaultEssentials,
  goals: [defaultGoal],
  activeGoalId: defaultGoal.id,
  records: [],
  achievementFund: 0,
  resistTotal: 0,
  resistCount: 0,
  plan: null,
  planHistory: [],
  disabledActions: [],
  actionDays: {},
  streak: 0,
  lastStreakDate: null,
  badges: [],
  lastDepositDate: null,
  notices: [],
}

/* ======================= 内部工具 ======================= */

function badgeStats(s: State): BadgeStats {
  return {
    actionDays: s.actionDays,
    streak: s.streak,
    resistCount: s.resistCount,
    resistTotal: s.resistTotal,
    plansCompleted: s.planHistory.filter((p) => p.status === 'completed').length,
  }
}

/** 计算新解锁的徽章，返回需要合并的 state 片段 */
function withBadges(s: State): Partial<State> {
  const stats = badgeStats(s)
  const fresh = BADGES.filter((b) => !s.badges.includes(b.id) && b.test(stats)).map((b) => b.id)
  if (fresh.length === 0) return {}
  const names = fresh.map((id) => BADGES.find((b) => b.id === id)!.name).join('、')
  return {
    badges: [...s.badges, ...fresh],
    notices: [...s.notices, { kind: 'badge', title: '解锁新徽章！', message: `恭喜获得「${names}」`, badgeIds: fresh }],
  }
}

function delayFor(amount: number, dailySaving: number) {
  return dailySaving > 0 ? round1(amount / dailySaving) : 0
}

/** 补差失败：未补回的金额折算为目标延期 */
function failPlan(s: State, reason: string, extraMsg = ''): Partial<State> {
  const plan = s.plan
  if (!plan) return {}
  const remaining = Math.max(0, plan.amount - plan.recovered)
  const delay = delayFor(remaining, getDailySaving(s))
  const ended: AusterityPlan = { ...plan, status: 'failed', endedAt: toDateKey(), failReason: reason }
  return {
    plan: null,
    planHistory: [ended, ...s.planHistory].slice(0, 30),
    goals: s.goals.map((g) => (g.id === plan.goalId ? { ...g, delayDays: round1(g.delayDays + delay) } : g)),
    streak: 0,
    notices: [
      ...s.notices,
      {
        kind: 'fail',
        title: '补差失败',
        message: `${reason}。还差 ${remaining.toFixed(remaining % 1 ? 1 : 0)} 元未补回，已自动为你顺延目标达成时间 ${delay} 天。${extraMsg}`,
      },
    ],
  }
}

/* ======================= Store ======================= */

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      setBudget: (p) => set(p),

      updateEssential: (id, p) =>
        set((s) => ({ essentials: s.essentials.map((e) => (e.id === id ? { ...e, ...p } : e)) })),
      addEssential: () =>
        set((s) => ({ essentials: [...s.essentials, { id: uid(), name: '新刚需项', amount: 0, kind: 'other' }] })),
      removeEssential: (id) => set((s) => ({ essentials: s.essentials.filter((e) => e.id !== id) })),

      addGoal: (g) =>
        set((s) => {
          const goal: Goal = { ...g, id: uid(), createdAt: toDateKey(), delayDays: 0 }
          return { goals: [...s.goals, goal], activeGoalId: goal.id }
        }),
      updateGoal: (id, p) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...p } : g)) })),
      removeGoal: (id) =>
        set((s) => {
          const goals = s.goals.filter((g) => g.id !== id)
          if (goals.length === 0) return {}
          return { goals, activeGoalId: s.activeGoalId === id ? goals[0].id : s.activeGoalId }
        }),
      setActiveGoal: (id) => set({ activeGoalId: id }),

      depositToday: () => {
        const s = get()
        const today = toDateKey()
        if (s.lastDepositDate === today) return
        const amt = Math.max(0, round1(getDailySaving(s)))
        set({
          lastDepositDate: today,
          goals: s.goals.map((g) => (g.id === s.activeGoalId ? { ...g, saved: round1(g.saved + amt) } : g)),
        })
      },
      deposit: (amount) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === s.activeGoalId ? { ...g, saved: round1(Math.max(0, g.saved + amount)) } : g)),
        })),
      moveFundToGoal: () =>
        set((s) => ({
          achievementFund: 0,
          goals: s.goals.map((g) =>
            g.id === s.activeGoalId ? { ...g, saved: round1(g.saved + s.achievementFund) } : g,
          ),
          notices: [
            ...s.notices,
            { kind: 'success', title: '成就金已入账', message: `${s.achievementFund} 元抵制诱惑成就金已存入心愿基金 💪` },
          ],
        })),

      recordImpulse: (label, amount, decision, planOpts) => {
        const s0 = get()
        const goal = getActiveGoal(s0)
        const dailySaving = getDailySaving(s0)
        const now = new Date()
        const dateStamp = `${toDateKey(now)}T${now.toTimeString().slice(0, 5)}`
        const rec: SpendRecord = {
          id: uid(),
          date: dateStamp,
          label,
          amount,
          decision,
          goalId: goal.id,
          delayDays: decision === 'accept' ? delayFor(amount, dailySaving) : 0,
        }
        let next: State = { ...s0, records: [rec, ...s0.records].slice(0, 200) }

        if (decision === 'resist') {
          next = {
            ...next,
            achievementFund: round1(next.achievementFund + amount),
            resistTotal: round1(next.resistTotal + amount),
            resistCount: next.resistCount + 1,
          }
        }

        if (decision === 'accept') {
          // 紧缩期内再度超支 → 违约兜底
          if (next.plan) {
            next = { ...next, ...failPlan(next, `紧缩期内再次发生「${label}」消费`) }
          }
          next = {
            ...next,
            goals: next.goals.map((g) => (g.id === goal.id ? { ...g, delayDays: round1(g.delayDays + rec.delayDays) } : g)),
          }
        }

        if (decision === 'austerity' && planOpts) {
          const today = toDateKey()
          next = {
            ...next,
            plan: {
              id: uid(),
              goalId: goal.id,
              label,
              amount,
              days: planOpts.days,
              dailyTarget: round1(amount / planOpts.days),
              startDate: today,
              actions: planOpts.actions,
              logs: {},
              recovered: 0,
              status: 'active',
            },
          }
        }

        set({ ...next, ...withBadges(next) })
      },

      toggleCheck: (actionId) => {
        const s = get()
        const plan = s.plan
        if (!plan) return
        const idx = planDayIndex(plan)
        if (idx < 1 || idx > plan.days) return
        const log: DayLog = plan.logs[idx] ?? { checked: [], spent: 0, done: false }
        if (log.done) return // 达标后锁定
        const checked = log.checked.includes(actionId)
          ? log.checked.filter((id) => id !== actionId)
          : [...log.checked, actionId]
        const allDone = plan.actions.every((a) => checked.includes(a.id))
        let next: State = {
          ...s,
          plan: { ...plan, logs: { ...plan.logs, [idx]: { ...log, checked, done: allDone } } },
        }

        if (allDone) {
          const today = toDateKey()
          const yesterday = addDays(today, -1)
          const streak = next.lastStreakDate === today ? next.streak : next.lastStreakDate === yesterday ? next.streak + 1 : 1
          const actionDays = { ...next.actionDays }
          plan.actions.forEach((a) => (actionDays[a.id] = (actionDays[a.id] ?? 0) + 1))
          const recovered = round1(plan.recovered + plan.dailyTarget)
          const p2: AusterityPlan = { ...next.plan!, recovered }
          next = { ...next, plan: p2, streak, lastStreakDate: today, actionDays }

          if (idx === plan.days) {
            const ended: AusterityPlan = { ...p2, recovered: plan.amount, status: 'completed', endedAt: today }
            next = {
              ...next,
              plan: null,
              planHistory: [ended, ...next.planHistory].slice(0, 30),
              notices: [
                ...next.notices,
                {
                  kind: 'success',
                  title: '补差成功 🎉',
                  message: `「${plan.label}」的 ${plan.amount} 元已全部补回，心愿进度不受影响！`,
                },
              ],
            }
          } else {
            next = {
              ...next,
              notices: [
                ...next.notices,
                {
                  kind: 'info',
                  title: `第 ${idx}/${plan.days} 天达标`,
                  message: `今日已补回 ${plan.dailyTarget} 元，连续自律 ${streak} 天，明天继续！`,
                },
              ],
            }
          }
        }
        set({ ...next, ...withBadges(next) })
      },

      logSpendToday: (amount) => {
        const s = get()
        const plan = s.plan
        if (!plan || amount <= 0) return
        const idx = planDayIndex(plan)
        if (idx < 1 || idx > plan.days) return
        const log: DayLog = plan.logs[idx] ?? { checked: [], spent: 0, done: false }
        const spent = round1(log.spent + amount)
        const cap = planDailyCap(s, plan)
        const next: State = { ...s, plan: { ...plan, logs: { ...plan.logs, [idx]: { ...log, spent } } } }
        if (spent > cap) {
          set({ ...next, ...failPlan(next, `今日校园开销 ¥${spent} 超出上限 ¥${round1(cap)}`) })
        } else {
          set(next)
        }
      },

      abandonPlan: () => {
        const s = get()
        set(failPlan(s, '你主动结束了本次紧缩计划'))
      },

      /** 检查是否有过去某天漏打卡 → 违约兜底 */
      syncPlan: () => {
        const s = get()
        const plan = s.plan
        if (!plan) return
        const idx = planDayIndex(plan)
        const lastPast = Math.min(idx - 1, plan.days)
        for (let d = 1; d <= lastPast; d++) {
          if (!plan.logs[d]?.done) {
            set(failPlan(s, `第 ${d} 天的校园降级清单未全部完成`))
            return
          }
        }
      },

      toggleDisabledAction: (id) =>
        set((s) => ({
          disabledActions: s.disabledActions.includes(id)
            ? s.disabledActions.filter((x) => x !== id)
            : [...s.disabledActions, id],
        })),

      dismissNotice: () => set((s) => ({ notices: s.notices.slice(1) })),
      pushNotice: (n) => set((s) => ({ notices: [...s.notices, n] })),
      replaceState: (data) => set((s) => ({ ...s, ...data })),

      resetAll: () => set({ ...initialState, goals: [{ ...defaultGoal, deadline: addDays(toDateKey(), 150) }] }),
    }),
    {
      name: 'goalsaver-campus-v1',
      version: 1,
      partialize: ({ notices: _n, ...rest }) => rest as unknown as Store,
    },
  ),
)

export function extractSyncData(s: State) {
  return {
    budgetMode: s.budgetMode,
    monthly: s.monthly,
    daysInMonth: s.daysInMonth,
    dailyCustom: s.dailyCustom,
    essentials: s.essentials,
    goals: s.goals,
    activeGoalId: s.activeGoalId,
    records: s.records,
    achievementFund: s.achievementFund,
    resistTotal: s.resistTotal,
    resistCount: s.resistCount,
    plan: s.plan,
    planHistory: s.planHistory,
    disabledActions: s.disabledActions,
    actionDays: s.actionDays,
    streak: s.streak,
    lastStreakDate: s.lastStreakDate,
    badges: s.badges,
    lastDepositDate: s.lastDepositDate,
  }
}

export { ACTION_MAP }
