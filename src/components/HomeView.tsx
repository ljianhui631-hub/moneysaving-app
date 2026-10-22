import { useState } from 'react'
import {
  CalendarCheck2,
  ChevronRight,
  Coins,
  Flame,
  PiggyBank,
  ShieldCheck,
  Target,
  Wallet,
  Zap,
} from 'lucide-react'
import { useDerived } from '../hooks'
import { cn, formatDateCN, round1, vibrate, yuan } from '../lib/utils'
import { planDailyCap, planDayIndex, useStore } from '../store'
import { Button, Card, Pill, Progress, SectionTitle } from './ui'

const HEALING_QUOTES = [
  '在食堂吃饱肚子，也是很棒的自律哦 🍲',
  '每一小步都在认真走向心愿 ✨',
  '今天口袋里的梦想又靠近了一点点 🥯',
  '喝温水既健康又能为心愿省下一杯奶茶 ☕',
  '认真生活的年轻人，运气都不会太差 🌟',
]

export function HomeView({
  goBoard,
  goBread,
  openImpulse,
  openSettings,
}: {
  goBoard: () => void
  goBread: () => void
  openImpulse: () => void
  openSettings: () => void
}) {
  const { dailyBudget, essentialTotal, dailySaving, goal, projection, today, todaySpent } = useDerived()
  const s = useStore()
  const plan = s.plan
  const depositedToday = s.lastDepositDate === today

  // 今日所有心愿总储蓄
  const allSavedTotal = s.goals.reduce((acc, g) => acc + g.saved, 0)
  // 今日资产净变动 (如果打卡了加 dailySaving，减去今日非必要消费)
  const todayNetChange = round1((depositedToday ? dailySaving : 0) - todaySpent)

  const [quoteIdx] = useState(() => Math.floor(Math.random() * HEALING_QUOTES.length))

  return (
    <div className="space-y-4 pb-20">
      {/* 时光机寄语伴侣气泡 (日漫对话气泡造型) */}
      <div className="relative inline-block w-full">
        <div className="relative mx-auto flex max-w-[96%] items-center gap-2 rounded-2xl border border-sky-200/80 bg-white/90 px-3.5 py-2 shadow-xs backdrop-blur-md">
          <span className="text-base">✨</span>
          <p className="flex-1 text-[11px] font-semibold tracking-wide text-sky-800">
            {HEALING_QUOTES[quoteIdx]}
          </p>
          <span className="text-[10px] text-sky-400 font-bold">时光机寄语</span>
        </div>
        {/* 气泡小倒三角尖角 */}
        <div className="mx-auto -mt-0.5 size-2.5 rotate-45 border-b border-r border-sky-200/80 bg-white/90" />
      </div>

      {/* 四次元口袋造型大卡片 (半圆弧 pocket-curve) */}
      <section className="relative overflow-hidden rounded-t-3xl pocket-curve border border-white/80 bg-gradient-to-b from-white/95 via-sky-50/70 to-sky-100/80 p-5 pt-6 shadow-[0_12px_40px_rgba(14,165,233,0.12)] backdrop-blur-xl">
        {/* 经典红项圈与金铃铛 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-12 rounded-full bg-rose-400/90 shadow-2xs" />
            <span className="text-xs font-black tracking-wide text-slate-700">四次元口袋 · 资产大盘</span>
          </div>

          {/* 右上角挂载的金色小铃铛 (晃动微动效) */}
          <div
            className="flex items-center gap-1 rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-400 px-3 py-1 shadow-sm transition-transform active:scale-95 touch-manipulation animate-[bell-ring_3s_ease-in-out_infinite]"
            title="连续打卡天数"
          >
            <span className="text-xs">🔔</span>
            <span className="text-xs font-black text-amber-950">{s.streak}天自律</span>
          </div>
        </div>

        {/* 现有总存款与今日净变动 */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400">当前心愿总储备</p>
            <p className="mt-0.5 text-3xl font-black tracking-tight text-slate-800 drop-shadow-xs">
              {yuan(allSavedTotal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400">今日资产变动</p>
            <p
              className={cn(
                'mt-0.5 text-sm font-extrabold flex items-center justify-end gap-0.5',
                todayNetChange >= 0 ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {todayNetChange >= 0 ? '↗ +' : '↘ '}
              {yuan(Math.abs(todayNetChange))}
            </p>
          </div>
        </div>

        {/* 底部内嵌小胶囊快捷对账入口 */}
        <div className="mt-4 flex items-center justify-between border-t border-sky-100/80 pt-3 text-xs">
          <span className="text-slate-500">
            日支配 <b className="text-slate-700 font-bold">{yuan(dailyBudget)}</b> · 刚需{' '}
            <b className="text-slate-700 font-bold">{yuan(essentialTotal)}</b>
          </span>
          <button
            type="button"
            onClick={goBread}
            className="flex items-center gap-0.5 font-bold text-sky-600 transition-colors hover:text-sky-700 active:scale-95 touch-manipulation"
          >
            <span>记忆面包对账</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </section>

      {/* 紧缩中快捷提示条 */}
      {plan && (
        <button
          type="button"
          onClick={goBoard}
          className="flex w-full items-center gap-3 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/90 p-4 text-left shadow-xs backdrop-blur-xl transition-transform active:scale-[0.98] touch-manipulation"
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-amber-400 text-white shadow-xs shadow-amber-400/30">
            <Zap className="size-4.5 fill-white" />
          </div>
          <span className="flex-1 text-xs leading-snug text-slate-700">
            <span className="font-bold text-amber-700">
              ⚡ 校园紧缩补差中（第 {Math.min(planDayIndex(plan), plan.days)}/{plan.days} 天）
            </span>
            <br />
            今日开销控制在 <b className="text-amber-600 font-bold">{yuan(planDailyCap(s, plan))}</b> 以内即可达标
          </span>
          <ChevronRight className="size-4.5 shrink-0 text-amber-400" />
        </button>
      )}

      {/* 心愿目标横向卡片平滑轮播 (Native Swipe Carousel) */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <SectionTitle icon={<Target className="size-4 text-sky-500" />}>
            <span>心愿好物清单</span>
            <span className="text-[11px] text-slate-400 font-normal">（横向滑动切换）</span>
          </SectionTitle>
          <button
            type="button"
            onClick={openSettings}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 touch-manipulation"
          >
            管理目标
          </button>
        </div>

        <div className="snap-x snap-mandatory no-scrollbar -mx-4.5 flex gap-3.5 overflow-x-auto px-4.5 py-1">
          {s.goals.map((g) => {
            const isActive = g.id === goal.id
            const p = isActive ? projection : { progress: g.target > 0 ? g.saved / g.target : 0 }
            return (
              <div
                key={g.id}
                onClick={() => s.setActiveGoal(g.id)}
                className={cn(
                  'snap-center shrink-0 w-[86vw] max-w-[340px] cursor-pointer rounded-3xl p-5 text-white transition-all duration-200 active:scale-[0.98] touch-manipulation',
                  isActive
                    ? 'bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 shadow-md shadow-sky-500/25 ring-2 ring-white/60'
                    : 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 opacity-80',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl drop-shadow-xs">{g.emoji}</span>
                  {isActive ? (
                    <Pill className="border border-white/30 bg-white/20 text-white font-bold backdrop-blur-md">
                      当前主打心愿
                    </Pill>
                  ) : (
                    <span className="text-xs text-white/60">点击设为主心愿</span>
                  )}
                </div>

                <h3 className="mt-2 text-lg font-bold tracking-tight truncate">{g.name}</h3>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-black tracking-tight">{yuan(g.saved)}</p>
                    <p className="text-[11px] text-sky-100/80">/ 目标 {yuan(g.target)}</p>
                  </div>
                  <span className="text-xl font-black text-amber-300">
                    {Math.round(p.progress * 100)}%
                  </span>
                </div>

                {/* 胶囊进度条 */}
                <div className="mt-3">
                  <Progress
                    value={p.progress * 100}
                    className="h-3.5 bg-white/20 p-0.5 backdrop-blur-xs shadow-inner"
                    barClass="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-sky-100/80 border-t border-white/15 pt-2.5">
                  <span>期望：{formatDateCN(g.deadline)}</span>
                  {g.delayDays > 0 && <span>延期 {g.delayDays} 天</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 每日基准 & 一键打卡 (拇指触手可及舒适区) */}
      <Card>
        <SectionTitle icon={<Wallet className="size-4 text-sky-500" />}>今日校园支配与储蓄</SectionTitle>
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center py-1">
          <div>
            <p className="text-[10px] font-semibold text-slate-400">日均可用</p>
            <p className="mt-0.5 text-base font-bold text-slate-800">{yuan(dailyBudget)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400">校园刚需</p>
            <p className="mt-0.5 text-base font-bold text-slate-800">{yuan(essentialTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400">每日净存</p>
            <p
              className={cn(
                'mt-0.5 text-base font-bold',
                dailySaving > 0 ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {yuan(dailySaving)}
            </p>
          </div>
        </div>

        {todaySpent > 0 && (
          <p className="mt-3 rounded-2xl border border-slate-200/60 bg-white/70 px-3.5 py-2 text-xs text-slate-600">
            今日已记录非必要开支 {yuan(todaySpent)}（占今日支配{' '}
            {Math.round((todaySpent / Math.max(1, dailyBudget)) * 100)}%）
          </p>
        )}

        {/* 核心操作大按钮 (一键打卡存入) */}
        <Button
          variant={depositedToday ? 'soft' : 'emerald'}
          size="lg"
          className="mt-3.5 w-full shadow-sm"
          disabled={depositedToday || dailySaving <= 0}
          onClick={() => {
            vibrate(20)
            s.depositToday()
          }}
        >
          <CalendarCheck2 className="size-5" />
          <span className="text-sm font-bold">
            {depositedToday ? '今日已打卡存入，明天见 ✨' : `一键打卡：今日存入 ${yuan(dailySaving)}`}
          </span>
        </Button>
      </Card>

      {/* 成就金与连续自律 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <ShieldCheck className="size-3.5 text-emerald-500" /> 抵制诱惑成就金
          </p>
          <p className="mt-1 text-xl font-black text-emerald-600">{yuan(s.achievementFund)}</p>
          <p className="text-[10px] text-slate-400">忍住 {s.resistCount} 次诱惑</p>
          <Button
            size="sm"
            variant="soft"
            className="mt-2.5 w-full text-xs font-bold"
            disabled={s.achievementFund <= 0}
            onClick={s.moveFundToGoal}
          >
            <PiggyBank className="size-3.5" /> 存入心愿
          </Button>
        </Card>

        <Card className="p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <Flame className="size-3.5 fill-amber-400 text-amber-400" /> 紧缩连续自律
          </p>
          <p className="mt-1 text-xl font-black text-amber-500">{s.streak} 天</p>
          <p className="text-[10px] text-slate-400">已解锁 {s.badges.length} 枚徽章</p>
          <Button size="sm" variant="soft" className="mt-2.5 w-full text-xs font-bold" onClick={goBoard}>
            查看打卡 <ChevronRight className="size-3.5" />
          </Button>
        </Card>
      </div>

      {/* 快速记账入口 (大号单手操作区域) */}
      <Button variant="amber" size="lg" className="w-full shadow-md" onClick={openImpulse}>
        <Coins className="size-5" />
        <span className="text-base font-bold">记录一笔非必要消费</span>
      </Button>
    </div>
  )
}
