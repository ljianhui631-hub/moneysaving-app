import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  Clock3,
  Coffee,
  CupSoda,
  Egg,
  Footprints,
  Moon,
  RefreshCw,
  Shuffle,
  Utensils,
  Zap,
} from 'lucide-react'
import { ACTION_MAP, CATEGORY_META } from '../data/actions'
import { useDerived } from '../hooks'
import { rankPlans, suggestDays } from '../lib/planner'
import { addDays, cn, formatDateCN, round1, vibrate, yuan } from '../lib/utils'
import { useStore } from '../store'
import { Button, Dialog, Pill, Progress } from './ui'

interface Props {
  open: boolean
  onClose: () => void
}

/** 校园高频小额快捷胶囊标签 */
const QUICK_PRESETS = [
  { label: '食堂早餐', amount: 5, icon: Egg },
  { label: '食堂午晚饭', amount: 15, icon: Utensils },
  { label: '现制奶茶', amount: 16, icon: CupSoda },
  { label: '共享单车', amount: 2, icon: Footprints },
  { label: '宿舍宵夜', amount: 25, icon: Moon },
  { label: '瑞幸咖啡', amount: 13, icon: Coffee },
]

export function ImpulseSheet({ open, onClose }: Props) {
  const [showDorayaki, setShowDorayaki] = useState(false)

  const triggerDorayaki = () => {
    setShowDorayaki(true)
    setTimeout(() => setShowDorayaki(false), 1400)
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="校园记一笔 · 冲动拦截">
        <ImpulseBody onDone={onClose} onResistDorayaki={triggerDorayaki} />
      </Dialog>

      {/* 铜锣烧 +1 粒子轻盈浮现微动效 */}
      {showDorayaki && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-amber-200/90 bg-white/95 px-6 py-4 shadow-2xl backdrop-blur-xl animate-[float-up_1.2s_ease-out_forwards]">
            <span className="text-4xl drop-shadow-md">🥯</span>
            <span className="text-base font-black tracking-wide text-amber-500 drop-shadow-xs">
              铜锣烧 +1 ✨
            </span>
            <span className="text-xs font-semibold text-slate-500">意志力满分，回宿舍喝水！</span>
          </div>
        </div>
      )}
    </>
  )
}

function ImpulseBody({
  onDone,
  onResistDorayaki,
}: {
  onDone: () => void
  onResistDorayaki: () => void
}) {
  const { dailyBudget, dailySaving, essentialTotal, goal, projection, todaySpent } = useDerived()
  const plan = useStore((s) => s.plan)
  const disabled = useStore((s) => s.disabledActions)
  const recordImpulse = useStore((s) => s.recordImpulse)
  const pushNotice = useStore((s) => s.pushNotice)

  const [label, setLabel] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [step, setStep] = useState<'decide' | 'plan'>('decide')
  const amount = Number(amountStr) || 0

  const delay = dailySaving > 0 ? round1(amount / dailySaving) : Infinity
  const pct = dailyBudget > 0 ? (amount / dailyBudget) * 100 : 0
  const pctWithToday = dailyBudget > 0 ? ((amount + todaySpent) / dailyBudget) * 100 : 0
  const newDate =
    projection.projectedDate && Number.isFinite(delay) ? addDays(projection.projectedDate, Math.ceil(delay)) : null
  const name = label.trim() || '这笔消费'

  // 动态预测若扣除这笔钱，最新存款变动
  const remainingAfter = Math.max(0, round1(goal.saved - amount))

  const finish = (decision: 'resist' | 'accept') => {
    vibrate(decision === 'resist' ? 35 : 15)
    recordImpulse(name, amount, decision)
    if (decision === 'resist') {
      onResistDorayaki()
      pushNotice({
        kind: 'info',
        title: '忍住了！回宿舍喝水 🥯✨',
        message: `+${yuan(amount)} 抵制诱惑成就金，${goal.name} 离你更近一步！`,
      })
    } else if (!plan) {
      pushNotice({
        kind: 'info',
        title: '已认罚，目标延期',
        message: `${goal.name} 延期 ${delay} 天${newDate ? `，预计 ${formatDateCN(newDate)} 达成` : ''}`,
      })
    }
    setTimeout(() => {
      onDone()
    }, 200)
  }

  if (step === 'plan') {
    return <PlanStep label={name} amount={amount} disabled={disabled} back={() => setStep('decide')} onDone={onDone} />
  }

  return (
    <div className="space-y-4 px-5 pb-8 pt-2">
      {/* 校园高频小额快捷胶囊标签 (横向平滑滑动) */}
      <div>
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-400">校园高频小额快捷选</p>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {QUICK_PRESETS.map((p) => {
            const active = label === p.label && amount === p.amount
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setLabel(p.label)
                  setAmountStr(String(p.amount))
                  vibrate(8)
                }}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-150 active:scale-95 touch-manipulation',
                  active
                    ? 'border-sky-400 bg-sky-500 text-white shadow-xs shadow-sky-500/30'
                    : 'border-slate-200/80 bg-white/90 text-slate-600 shadow-2xs hover:bg-white',
                )}
              >
                <p.icon className="size-3.5" />
                <span>{p.label}</span>
                <span className={active ? 'text-sky-100 font-bold' : 'text-slate-400 font-normal'}>¥{p.amount}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 极速单手输入框 */}
      <div className="grid grid-cols-[1fr_8rem] gap-2">
        <input
          className="min-h-[50px] h-12 w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 text-sm font-medium text-slate-700 outline-none backdrop-blur-md transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 shadow-2xs"
          placeholder="消费名称（如：霸王茶姬）"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            ¥
          </span>
          <input
            className="min-h-[50px] h-12 w-full rounded-2xl border border-slate-200/80 bg-white/90 pl-8 pr-4 text-right text-lg font-black text-slate-800 outline-none backdrop-blur-md transition-all placeholder:text-slate-300 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 shadow-2xs"
            inputMode="decimal"
            type="number"
            min={0}
            step="any"
            placeholder="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            aria-label="金额"
          />
        </div>
      </div>

      {/* 铃铛红项圈警戒卡片 & 实时存款联动计算 */}
      {amount > 0 && (
        <div className="animate-pop space-y-3 rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50/90 via-white/80 to-amber-50/80 p-4.5 backdrop-blur-md shadow-xs">
          {/* 红项圈警戒条 */}
          <div className="flex items-start gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-rose-500 text-white shadow-xs">
              <Clock3 className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-semibold leading-snug text-slate-800">
                这顿 <b className="text-rose-500 font-extrabold">{yuan(amount)}</b> 的{name === '这笔消费' ? '开销' : `「${name}」`}，将让你的
                <b className="text-sky-600">【{goal.name}】</b>
                {Number.isFinite(delay) ? (
                  <>
                    延期 <b className="text-base text-rose-500 font-black">{delay}</b> 天达成！
                  </>
                ) : (
                  <>进度受阻（日净储蓄 ≤ 0）</>
                )}
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                若扣除这笔钱，心愿基金当前可用余额将变为{' '}
                <b className="text-slate-700 font-bold">{yuan(remainingAfter)}</b>
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>占今日生活费比例</span>
              <span className={pct >= 50 ? 'text-rose-500 font-bold' : 'text-amber-500 font-bold'}>
                {Math.round(pct)}%
              </span>
            </div>
            <Progress
              value={pct}
              className="h-3 bg-rose-100/80"
              barClass={
                pct >= 50
                  ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500'
              }
            />
            {todaySpent > 0 && (
              <p className="mt-1 text-[10px] text-slate-400">
                加上今日已记 {yuan(todaySpent)}，非必要开销累计占今日支配的 {Math.round(pctWithToday)}%
              </p>
            )}
            <p className="mt-1 text-[10px] text-slate-400">
              日支配 {yuan(dailyBudget)} · 刚需 {yuan(essentialTotal)} · 日净存 {yuan(dailySaving)}
            </p>
          </div>
        </div>
      )}

      {/* 拇指热区：底部并排/并列大触控圆角决策按钮 */}
      <div className="space-y-2.5 pt-1">
        {/* 高亮主要决策：忍住了（拇指最舒适区） */}
        <Button
          variant="emerald"
          size="lg"
          className="w-full justify-center text-center shadow-md shadow-emerald-500/25"
          disabled={amount <= 0}
          onClick={() => finish('resist')}
        >
          <span className="text-base font-bold">忍住了！回宿舍喝水（+1 铜锣烧 🥯）</span>
        </Button>

        {/* 次要决策并排 */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="amber"
            size="md"
            className="w-full justify-center text-xs sm:text-sm font-bold shadow-xs"
            disabled={amount <= 0 || !!plan || dailySaving <= 0}
            onClick={() => setStep('plan')}
          >
            <Zap className="size-4 fill-white" />
            <span>开启紧缩补差</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full justify-center text-xs sm:text-sm font-semibold text-slate-600 shadow-2xs"
            disabled={amount <= 0}
            onClick={() => finish('accept')}
          >
            <CalendarClock className="size-4 text-slate-400" />
            <span>认罚·接受延期</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- 紧缩补差：拼单步骤 ---------------- */
function PlanStep({
  label,
  amount,
  disabled,
  back,
  onDone,
}: {
  label: string
  amount: number
  disabled: string[]
  back: () => void
  onDone: () => void
}) {
  const recordImpulse = useStore((s) => s.recordImpulse)
  const { dailyBudget, essentialTotal } = useDerived()
  const [days, setDays] = useState(() => Math.min(4, suggestDays(amount, disabled)))
  const [pick, setPick] = useState(0)

  const gap = round1(amount / days)
  const ranked = useMemo(() => rankPlans(gap, disabled), [gap, disabled])
  const feasibleCount = ranked.filter((r) => r.feasible).length
  const cand = ranked.length ? ranked[pick % Math.max(1, Math.min(feasibleCount || ranked.length, 6))] : null
  const cap = Math.max(0, dailyBudget - gap)
  const belowEssential = cap < essentialTotal

  return (
    <div className="space-y-4 px-5 pb-8 pt-2">
      <button
        type="button"
        onClick={back}
        className="-ml-1 flex items-center gap-1 py-1 text-xs font-bold text-slate-500 transition-colors hover:text-sky-600 touch-manipulation"
      >
        <ArrowLeft className="size-4" /> 返回决策
      </button>

      <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/80 p-4.5 backdrop-blur-md">
        <p className="text-xs font-semibold text-amber-700">「{label}」超支</p>
        <p className="text-2xl font-black text-amber-500 tracking-tight">{yuan(amount)}</p>
        <p className="mt-2 text-xs font-bold text-slate-700">分几天在校内补回？</p>

        {/* 胶囊天数切换 */}
        <div className="mt-2 grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="补差天数">
          {[2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={days === n}
              onClick={() => {
                setDays(n)
                setPick(0)
                vibrate(8)
              }}
              className={cn(
                'min-h-[44px] h-11 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-150 active:scale-95 touch-manipulation',
                days === n
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-xs'
                  : 'border border-white/90 bg-white/80 text-slate-600 hover:bg-white',
              )}
            >
              {n}天
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs sm:text-sm text-slate-700">
          每日需补差 = {yuan(amount)} ÷ {days} = <b className="text-amber-500 font-bold">{yuan(gap)}</b>
        </p>
      </div>

      {cand && (
        <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/60 p-4.5 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-emerald-800">未来 {days} 天每日省钱清单</p>
            <button
              type="button"
              onClick={() => {
                setPick((p) => p + 1)
                vibrate(8)
              }}
              className="flex min-h-[36px] items-center gap-1 rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow-2xs transition-all active:scale-95 touch-manipulation"
            >
              <Shuffle className="size-3.5" /> 换一组
            </button>
          </div>

          <ol className="space-y-2">
            {cand.actions.map((pa, i) => {
              const a = ACTION_MAP[pa.id]
              return (
                <li key={pa.id} className="flex items-start gap-2.5 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-2xs">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {'①②③'[i]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-[13px] leading-snug text-slate-700 font-medium">{a.title}</p>
                    <Pill className={cn('mt-1', CATEGORY_META[a.category].tone)}>
                      {CATEGORY_META[a.category].label}
                    </Pill>
                  </div>
                  <span className="shrink-0 text-xs sm:text-sm font-bold text-emerald-600">省 {yuan(pa.save)}</span>
                </li>
              )
            })}
          </ol>

          <p className="mt-3 text-right text-xs sm:text-sm text-slate-600">
            = 每日可省 <b className="text-emerald-600 font-bold">{yuan(cand.total)}</b>
            {cand.feasible ? <Check className="ml-1 inline size-4 text-emerald-500 stroke-[3]" /> : null}
          </p>

          {!cand.feasible && (
            <p className="mt-2 flex gap-1.5 rounded-2xl bg-amber-100/70 p-2.5 text-xs text-amber-800">
              <AlertTriangle className="size-4 shrink-0 text-amber-600" />
              每日缺口过大，校园降级动作最多只能省 {yuan(cand.total)}，建议延长补差天数。
            </p>
          )}
        </div>
      )}

      <p className={cn('flex gap-1.5 text-xs', belowEssential ? 'text-amber-700' : 'text-slate-500')}>
        {belowEssential ? (
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
        ) : (
          <RefreshCw className="size-3.5 shrink-0 text-slate-400" />
        )}
        紧缩期每日校园开销上限 {yuan(cap)}
        {belowEssential ? `（低于刚需基线 ${yuan(essentialTotal)}，压力较大，可多分几天）` : ''}
      </p>

      <Button
        variant="amber"
        size="lg"
        className="w-full shadow-md"
        disabled={!cand}
        onClick={() => {
          if (!cand) return
          vibrate(25)
          recordImpulse(label, amount, 'austerity', { days, actions: cand.actions })
          onDone()
        }}
      >
        <Zap className="size-5 fill-white" /> 开启 {days} 天紧缩补差
      </Button>
    </div>
  )
}
