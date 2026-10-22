import { useMemo, useState } from 'react'
import { Calculator, Repeat, Sparkles } from 'lucide-react'
import { ACTION_LIBRARY, ACTION_MAP, CATEGORY_META, type ActionCategory } from '../data/actions'
import { rankPlans } from '../lib/planner'
import { cn, round1, yuan } from '../lib/utils'
import { useStore } from '../store'
import { Card, inputCls, Pill, SectionTitle } from './ui'

const cats: ActionCategory[] = ['food', 'study', 'social']

export function LibraryView() {
  const disabled = useStore((s) => s.disabledActions)
  const toggle = useStore((s) => s.toggleDisabledAction)

  return (
    <div className="space-y-4">
      <div className="px-1.5">
        <h1 className="text-lg font-bold tracking-tight text-slate-800">校园消费降级行动库</h1>
        <p className="mt-0.5 text-xs text-slate-400">关掉不适合你的动作（比如没有二手车），智能拼单就不会推荐它 ✨</p>
      </div>

      <Simulator />

      {cats.map((c) => (
        <section key={c}>
          <SectionTitle icon={<span className={cn('size-2 rounded-full', CATEGORY_META[c].dot)} />}>
            {CATEGORY_META[c].label}
          </SectionTitle>
          <Card className="divide-y divide-slate-100/70 p-0 overflow-hidden">
            {ACTION_LIBRARY.filter((a) => a.category === c).map((a) => {
              const on = !disabled.includes(a.id)
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/50">
                  <div
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-2xl shadow-xs',
                      CATEGORY_META[c].tone,
                    )}
                  >
                    <a.icon className="size-5" />
                  </div>
                  <div className={cn('min-w-0 flex-1', !on && 'opacity-40')}>
                    <p className="text-[13px] leading-snug font-medium text-slate-700">{a.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="font-bold text-emerald-600">
                        省 {a.saveMin === a.saveMax ? yuan(a.saveMin) : `¥${a.saveMin}~${a.saveMax}`}
                        {a.frequency === 'daily' ? '/天' : ''}
                      </span>
                      {a.frequency === 'oneoff' && (
                        <Pill className="border border-slate-200/60 bg-slate-100/70 text-slate-500">
                          一次性折算 · 不参与每日拼单
                        </Pill>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`${a.title} ${on ? '已启用' : '已停用'}`}
                    onClick={() => toggle(a.id)}
                    className={cn(
                      'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-sky-400',
                      on ? 'bg-gradient-to-r from-sky-400 to-sky-500 shadow-xs shadow-sky-500/30' : 'bg-slate-300/80',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                        on ? 'left-[22px]' : 'left-0.5',
                      )}
                    />
                  </button>
                </div>
              )
            })}
          </Card>
        </section>
      ))}
    </div>
  )
}

function Simulator() {
  const disabled = useStore((s) => s.disabledActions)
  const [amount, setAmount] = useState(60)
  const [days, setDays] = useState(2)
  const [pick, setPick] = useState(0)
  const gap = round1(amount / Math.max(1, days))
  const ranked = useMemo(() => rankPlans(gap, disabled), [gap, disabled])
  const pool = ranked.filter((r) => r.feasible).slice(0, 6)
  const list = pool.length ? pool : ranked.slice(0, 1)
  const cand = list[pick % Math.max(1, list.length)]

  return (
    <Card className="border border-sky-100/80 bg-gradient-to-br from-white/90 via-sky-50/40 to-white/90 shadow-[0_8px_30px_rgb(14,165,233,0.05)]">
      <SectionTitle
        icon={<Calculator className="size-4 text-sky-500" />}
        extra={
          list.length > 1 && (
            <button
              type="button"
              onClick={() => setPick((p) => p + 1)}
              className="flex items-center gap-1 rounded-full border border-sky-200/60 bg-white/80 px-2.5 py-0.5 text-xs font-medium text-sky-600 shadow-2xs transition-all hover:bg-white active:scale-95"
            >
              <Repeat className="size-3.5" /> 换一组
            </button>
          )
        }
      >
        拼单模拟器
      </SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="text-xs font-medium text-slate-500">
          超支金额
          <input
            className={cn(inputCls, 'mt-1.5')}
            type="number"
            inputMode="decimal"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          补差天数 N
          <input
            className={cn(inputCls, 'mt-1.5')}
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            value={days}
            onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
      </div>

      {cand ? (
        <div className="mt-3.5 rounded-2xl border border-white/80 bg-white/85 p-3.5 text-xs sm:text-[13px] leading-relaxed text-slate-600 shadow-2xs backdrop-blur-md">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-sky-700">
            <Sparkles className="size-3.5 text-amber-400" /> 未来 {days} 天每日省钱清单（每日需少花 {yuan(gap)}）
          </p>
          {cand.actions.map((pa, i) => (
            <span key={pa.id}>
              {i > 0 && ' + '}
              {'①②③'[i]} {ACTION_MAP[pa.id].title.split('，')[0]}（省 <b className="text-emerald-600 font-bold">{yuan(pa.save)}</b>）
            </span>
          ))}
          <span>
            {' '}
            = 达成每日补差 <b className={cand.feasible ? 'text-emerald-600 font-bold' : 'text-amber-500 font-bold'}>{yuan(cand.total)}</b>
            {!cand.feasible && '（缺口过大，建议延长天数）'}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">请至少启用 2 个每日型动作。</p>
      )}
    </Card>
  )
}
