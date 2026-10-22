import { useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import {
  BookOpen,
  Check,
  ChevronsRight,
  Flag,
  Flame,
  History,
  Lock,
  Medal,
  Receipt,
  Sparkles,
  Zap,
} from 'lucide-react'
import { ACTION_LIBRARY, ACTION_MAP, BADGES, CATEGORY_META } from '../data/actions'
import { cn, formatShort, vibrate, yuan } from '../lib/utils'
import { planDailyCap, planDayIndex, useStore, type DayLog } from '../store'
import { Button, Card, inputCls, Pill, Progress, SectionTitle } from './ui'

export function BoardView({
  openImpulse,
  openLibrary,
}: {
  openImpulse: () => void
  openLibrary: () => void
}) {
  const s = useStore()
  const plan = s.plan

  return (
    <div className="space-y-4 pb-20">
      {/* 紧缩核心状态 */}
      {plan ? <ActivePlan /> : <EmptyPlan openImpulse={openImpulse} />}

      {/* 降级行动库快捷配置入口卡片 */}
      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-sky-50 text-sky-600 shadow-2xs">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">校园消费降级行动库</h3>
            <p className="text-[11px] text-slate-400">已启用 {ACTION_LIBRARY.length - s.disabledActions.length}/{ACTION_LIBRARY.length} 项校园动作</p>
          </div>
        </div>
        <Button size="sm" variant="soft" onClick={openLibrary} className="text-xs font-bold">
          管理动作
        </Button>
      </Card>

      {/* 连续打卡 + 徽章 */}
      <section>
        <SectionTitle
          icon={<Medal className="size-4 text-amber-400" />}
          extra={
            <span className="flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-0.5 text-xs font-bold text-amber-600">
              <Flame className="size-3.5 fill-amber-400 text-amber-400" /> 连续达标 {s.streak} 天
            </span>
          }
        >
          自律徽章墙
        </SectionTitle>

        <div className="grid grid-cols-4 gap-2">
          {BADGES.map((b) => {
            const got = s.badges.includes(b.id)
            return (
              <div
                key={b.id}
                className={cn(
                  'flex flex-col items-center rounded-3xl border border-white/80 bg-white/80 p-2.5 text-center backdrop-blur-md shadow-2xs transition-transform active:scale-95 touch-manipulation',
                  !got && 'opacity-55 grayscale-40',
                )}
              >
                <div
                  className={cn(
                    'grid size-11 place-items-center rounded-full text-white transition-all',
                    got
                      ? `bg-gradient-to-br ${b.tone} shadow-md shadow-amber-400/25`
                      : 'bg-slate-200/80 text-slate-400',
                  )}
                >
                  {got ? <b.icon className="size-5" /> : <Lock className="size-4" />}
                </div>
                <p className="mt-1.5 text-[11px] font-bold leading-tight text-slate-800">{b.name}</p>
                <p className="mt-0.5 text-[9px] leading-tight text-slate-400 line-clamp-2">{b.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 补差历史 */}
      {s.planHistory.length > 0 && (
        <section>
          <SectionTitle icon={<History className="size-4 text-slate-400" />}>补差历史记录</SectionTitle>
          <Card className="divide-y divide-slate-100/70 p-0 overflow-hidden">
            {s.planHistory.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-bold text-slate-700">
                    {p.label} · {yuan(p.amount)}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {formatShort(p.startDate)} 起 {p.days} 天{p.failReason ? ` · ${p.failReason}` : ''}
                  </p>
                </div>
                <Pill
                  className={
                    p.status === 'completed'
                      ? 'border border-emerald-200/80 bg-emerald-50 text-emerald-600'
                      : 'border border-rose-200/80 bg-rose-50 text-rose-500'
                  }
                >
                  {p.status === 'completed' ? '补差成功' : '已顺延'}
                </Pill>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  )
}

function EmptyPlan({ openImpulse }: { openImpulse: () => void }) {
  return (
    <Card className="flex flex-col items-center px-6 py-10 text-center">
      <div className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-500 shadow-inner">
        <Sparkles className="size-8 text-sky-400" />
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-800">当前没有进行中的紧缩计划</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        冲动消费后选择「开启未来紧缩补差」，
        <br />
        系统会自动拼出食堂、开水房、图书馆的温和省钱清单。
      </p>
      <p className="mt-2 text-[11px] text-sky-500/80 font-medium">今天也是自律而充实的一天 ✨</p>
      <Button variant="amber" size="md" className="mt-5 shadow-xs" onClick={openImpulse}>
        <Zap className="size-4" /> 记录一笔非必要消费
      </Button>
    </Card>
  )
}

function ActivePlan() {
  const s = useStore()
  const plan = s.plan!
  const idx = planDayIndex(plan)
  const day = Math.min(Math.max(idx, 1), plan.days)
  const log: DayLog = plan.logs[day] ?? { checked: [], spent: 0, done: false }
  const cap = planDailyCap(s, plan)
  const checkedCount = plan.actions.filter((a) => log.checked.includes(a.id)).length
  const pct = (checkedCount / plan.actions.length) * 100
  const [spendStr, setSpendStr] = useState('')

  return (
    <>
      {/* 顶部状态条 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-400 p-5 text-white shadow-[0_12px_40px_rgba(251,191,36,0.22)]">
        <div className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-white/15 blur-xl" />

        <p className="flex items-center gap-1.5 text-sm font-black tracking-tight">
          <Zap className="size-4.5 fill-white" /> ⚡ 校园紧缩补差中（第 {day}/{plan.days} 天）
        </p>
        <p className="mt-1 text-xs sm:text-[13px] text-amber-50">
          今日校园开销控制在 <b className="text-lg text-white font-black">{yuan(cap)}</b> 以内即可达标
        </p>

        {/* 紧缩天数进度胶囊 */}
        <div className="mt-4 flex gap-1.5" aria-label="紧缩天数进度">
          {Array.from({ length: plan.days }, (_, i) => {
            const d = i + 1
            const done = plan.logs[d]?.done
            return (
              <div
                key={d}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center rounded-2xl text-xs font-black transition-all shadow-2xs',
                  done
                    ? 'bg-white text-emerald-600'
                    : d === day
                    ? 'bg-white/40 ring-2 ring-white text-white'
                    : 'bg-white/20 text-white/80',
                )}
              >
                {done ? <Check className="size-4 stroke-[3]" /> : `D${d}`}
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-amber-50">
          <span>
            「{plan.label}」{yuan(plan.amount)} · 每日补 {yuan(plan.dailyTarget)}
          </span>
          <span className="font-bold text-white">
            已补回 {yuan(plan.recovered)} / {yuan(plan.amount)}
          </span>
        </div>

        {/* 进度条 */}
        <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-black/10 p-0.5">
          <div
            className="h-full rounded-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, (plan.recovered / plan.amount) * 100))}%` }}
          />
        </div>
      </section>

      {/* Todo 今日清单 */}
      <Card>
        <SectionTitle
          icon={<Flag className="size-4 text-emerald-500" />}
          extra={<span className="text-[11px] text-slate-400">右滑或轻触打卡 ✨</span>}
        >
          今日校园降级清单
        </SectionTitle>

        <ul className="space-y-2.5">
          {plan.actions.map((pa) => (
            <SwipeTodo
              key={pa.id}
              id={pa.id}
              save={pa.save}
              checked={log.checked.includes(pa.id)}
              locked={log.done}
              onToggle={() => s.toggleCheck(pa.id)}
            />
          ))}
        </ul>

        <div className="mt-4 pt-1">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-slate-500">
              今日完成 {checkedCount}/{plan.actions.length}
            </span>
            <span className={cn('font-bold', log.done ? 'text-emerald-500' : 'text-slate-600')}>
              {log.done ? `✓ 今日达标，已补 ${yuan(plan.dailyTarget)}` : `${Math.round(pct)}%`}
            </span>
          </div>
          <Progress value={pct} className="h-3 bg-sky-100/70" barClass="bg-gradient-to-r from-emerald-400 to-teal-500" />
        </div>
      </Card>

      {/* 今日开销记录 */}
      <Card>
        <SectionTitle icon={<Receipt className="size-4 text-sky-500" />}>今日校园开销</SectionTitle>
        <div className="mb-2 flex items-end justify-between">
          <p className="text-xl font-bold tracking-tight text-slate-700">
            {yuan(log.spent)} <span className="text-xs font-normal text-slate-400">/ 上限 {yuan(cap)}</span>
          </p>
          <span
            className={cn(
              'text-xs font-bold',
              log.spent / Math.max(cap, 1) > 0.8 ? 'text-rose-500' : 'text-emerald-500',
            )}
          >
            还可花 {yuan(Math.max(0, cap - log.spent))}
          </span>
        </div>
        <Progress
          value={(log.spent / Math.max(cap, 1)) * 100}
          className="h-3 bg-slate-100"
          barClass={
            log.spent / Math.max(cap, 1) > 0.8
              ? 'bg-gradient-to-r from-rose-400 to-rose-500'
              : 'bg-gradient-to-r from-sky-400 to-sky-500'
          }
        />
        <form
          className="mt-3.5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const n = Number(spendStr)
            if (n > 0) {
              vibrate(10)
              s.logSpendToday(n)
              setSpendStr('')
            }
          }}
        >
          <input
            className={cn(inputCls, 'flex-1')}
            inputMode="decimal"
            type="number"
            min={0}
            step="0.1"
            placeholder="记一笔食堂/日常开销，如 12"
            value={spendStr}
            onChange={(e) => setSpendStr(e.target.value)}
            aria-label="今日开销金额"
          />
          <Button type="submit" size="md" className="shrink-0 px-5">
            记一笔
          </Button>
        </form>
        <p className="mt-2 text-[11px] text-slate-400">
          超出上限将判定补差失败，未补回金额自动折算为心愿延期。
        </p>
      </Card>

      <button
        type="button"
        className="w-full py-2 text-center text-xs text-slate-400 transition-colors hover:text-rose-500 hover:underline touch-manipulation"
        onClick={() => {
          if (confirm('确定放弃本次紧缩计划？未补回的金额将折算为目标延期。')) s.abandonPlan()
        }}
      >
        放弃本次紧缩计划
      </button>
    </>
  )
}

/* ---------- 右滑打卡 Todo ---------- */
function SwipeTodo({
  id,
  save,
  checked,
  locked,
  onToggle,
}: {
  id: string
  save: number
  checked: boolean
  locked: boolean
  onToggle: () => void
}) {
  const a = ACTION_MAP[id]
  const [dx, setDx] = useState(0)
  const start = useRef<{ x: number; y: number; active: boolean } | null>(null)
  const swiped = useRef(false)
  const THRESHOLD = 75

  const onDown = (e: RPointerEvent) => {
    if (locked) return
    start.current = { x: e.clientX, y: e.clientY, active: false }
    swiped.current = false
  }
  const onMove = (e: RPointerEvent) => {
    const st = start.current
    if (!st) return
    const mx = e.clientX - st.x
    const my = e.clientY - st.y
    if (!st.active) {
      if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.5) {
        st.active = true
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } else if (Math.abs(my) > 10) {
        start.current = null
        return
      } else return
    }
    setDx(Math.max(0, Math.min(140, mx)))
  }
  const onUp = () => {
    const st = start.current
    start.current = null
    if (st?.active) {
      swiped.current = true
      if (dx >= THRESHOLD) {
        vibrate(18)
        onToggle()
      }
    }
    setDx(0)
  }

  return (
    <li className="relative overflow-hidden rounded-2xl" data-swipe-item>
      <div
        className={cn(
          'absolute inset-0 flex items-center gap-1.5 pl-4 text-sm font-bold text-white transition-colors',
          dx >= THRESHOLD ? 'bg-emerald-500' : 'bg-emerald-400',
        )}
        aria-hidden
      >
        <ChevronsRight className="size-5" />
        {checked ? '取消' : '打卡'}
      </div>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-disabled={locked}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={() => {
          if (swiped.current || locked) return
          vibrate(12)
          onToggle()
        }}
        style={{ transform: `translateX(${dx}px)`, touchAction: 'pan-y' }}
        className={cn(
          'relative flex w-full min-h-[56px] items-center gap-3 rounded-2xl border p-3.5 text-left backdrop-blur-md transition-all touch-manipulation',
          dx === 0 && 'transition-transform duration-200',
          checked
            ? 'border-emerald-200/80 bg-emerald-50/80'
            : 'border-white/80 bg-white/90 shadow-2xs hover:bg-white',
        )}
      >
        <span
          className={cn(
            'grid size-6 shrink-0 place-items-center rounded-full border transition-all',
            checked
              ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
              : 'border-slate-300 bg-white/70',
          )}
        >
          {checked && <Check className="size-3.5 stroke-[3]" />}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block text-[13px] leading-snug',
              checked
                ? 'text-emerald-800 line-through decoration-emerald-400/60'
                : 'text-slate-800 font-bold',
            )}
          >
            {a.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className={cn('size-1.5 rounded-full', CATEGORY_META[a.category].dot)} />
            {a.hint}
          </span>
        </span>
        <span className="shrink-0 text-sm font-black text-emerald-600">省{yuan(save)}</span>
      </button>
    </li>
  )
}
