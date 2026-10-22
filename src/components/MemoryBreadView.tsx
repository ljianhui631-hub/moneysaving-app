import { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { yuan } from '../lib/utils'
import { useStore, type SpendRecord } from '../store'
import { Card, Pill } from './ui'

export function MemoryBreadView({}: { openImpulse?: () => void }) {
  const s = useStore()
  const records = s.records
  const [filter, setFilter] = useState<'all' | 'resist' | 'spent'>('all')
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  // 统计概览
  const totalResist = s.resistTotal
  const totalSpent = records
    .filter((r) => r.decision !== 'resist')
    .reduce((acc, r) => acc + r.amount, 0)

  // 按日期归类分组流水
  const grouped = records.reduce<Record<string, SpendRecord[]>>((acc, r) => {
    const day = r.date.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(r)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1))

  return (
    <div className="space-y-4 pb-20">
      {/* 记忆面包抬头与日系卡片 */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-100/90 via-orange-50/80 to-amber-50/90 p-5 shadow-xs backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl drop-shadow-xs">🍞</span>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-800">记忆面包 · 对账明细</h1>
              <p className="text-[11px] font-medium text-amber-700/80">每一笔开支都记得清清楚楚 ✨</p>
            </div>
          </div>
          <Pill className="border border-amber-300/80 bg-amber-200/50 text-amber-800">
            流水 {records.length} 笔
          </Pill>
        </div>

        {/* 统计指标 */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-2xs">
            <p className="text-[10px] font-bold tracking-wide text-slate-400">已抵制诱惑总额</p>
            <p className="mt-0.5 text-lg font-black text-emerald-500">+{yuan(totalResist)}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-2xs">
            <p className="text-[10px] font-bold tracking-wide text-slate-400">非必要消费累计</p>
            <p className="mt-0.5 text-lg font-black text-rose-500">-{yuan(totalSpent)}</p>
          </div>
        </div>
      </section>

      {/* 筛选胶囊 */}
      <div className="flex gap-2 px-1" role="radiogroup" aria-label="记录筛选">
        {(
          [
            ['all', '全部记录'],
            ['resist', '忍住了 🎉'],
            ['spent', '已支出 💸'],
          ] as const
        ).map(([key, label]) => {
          const active = filter === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setFilter(key)}
              className={`min-h-[40px] px-4 rounded-full text-xs font-bold transition-all duration-150 active:scale-95 touch-manipulation ${
                active
                  ? 'bg-sky-500 text-white shadow-xs shadow-sky-500/25'
                  : 'border border-slate-200/80 bg-white/80 text-slate-500 hover:bg-white'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* 流水明细列表 */}
      {dates.length === 0 ? (
        <Card className="flex flex-col items-center py-10 text-center">
          <span className="text-4xl drop-shadow-xs">🍞</span>
          <p className="mt-3 text-sm font-bold text-slate-700">面包上空空如也</p>
          <p className="mt-1 text-xs text-slate-400">今天发生伙食或冲动消费时，随时点下方加号记录</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {dates.map((day) => {
            const list = grouped[day].filter((r) => {
              if (filter === 'resist') return r.decision === 'resist'
              if (filter === 'spent') return r.decision !== 'resist'
              return true
            })
            if (list.length === 0) return null

            const isExpanded = expandedDate === day || expandedDate === null

            const dayResist = list
              .filter((r) => r.decision === 'resist')
              .reduce((a, b) => a + b.amount, 0)
            const daySpent = list
              .filter((r) => r.decision !== 'resist')
              .reduce((a, b) => a + b.amount, 0)

            return (
              <Card key={day} className="p-0 overflow-hidden">
                {/* 日期表头 */}
                <button
                  type="button"
                  onClick={() => setExpandedDate(expandedDate === day ? '' : day)}
                  className="flex w-full items-center justify-between border-b border-slate-100/80 bg-white/50 px-4 py-3 text-left transition-colors hover:bg-white/80 active:bg-slate-50 touch-manipulation"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-sky-500" />
                    <span className="text-xs font-bold tracking-tight text-slate-800">{day}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {daySpent > 0 && <span className="text-rose-500">-{yuan(daySpent)}</span>}
                    {dayResist > 0 && <span className="text-emerald-500">+{yuan(dayResist)}</span>}
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="size-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* 明细项 */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100/70">
                    {list.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs sm:text-sm font-semibold text-slate-700">{r.label}</p>
                          <p className="text-[10px] text-slate-400">
                            {r.date.slice(11, 16)} ·{' '}
                            {r.decision === 'resist'
                              ? '抵制成功 ✨'
                              : r.decision === 'accept'
                              ? `认罚（延期 ${r.delayDays} 天）`
                              : '开启紧缩补差 ⚡'}
                          </p>
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-black ${
                            r.decision === 'resist' ? 'text-emerald-500' : 'text-slate-800'
                          }`}
                        >
                          {r.decision === 'resist' ? '+' : '-'}
                          {yuan(r.amount).slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
