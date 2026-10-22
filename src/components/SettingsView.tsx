import { useState } from 'react'
import { Plus, RotateCcw, Target, Trash2, Wallet, Utensils, Pencil, Sparkles, Cloud } from 'lucide-react'
import { useDerived } from '../hooks'
import { addDays, cn, toDateKey, yuan } from '../lib/utils'
import { useStore, type Goal } from '../store'
import { Button, Card, Dialog, Field, inputCls, SectionTitle } from './ui'

export function SettingsView({ openAuth }: { openAuth?: () => void }) {
  const s = useStore()
  const { dailyBudget, essentialTotal, dailySaving } = useDerived()
  const [editing, setEditing] = useState<Goal | 'new' | null>(null)

  return (
    <div className="space-y-4">
      <div className="px-1.5">
        <h1 className="text-lg font-bold tracking-tight text-slate-800">收支与心愿配置</h1>
        <p className="mt-0.5 text-xs text-slate-400">贴合大学生活的基准设定，随时可以微调 ✨</p>
      </div>

      {/* 云同步卡片入口 */}
      {openAuth && (
        <Card className="flex items-center justify-between p-4 border border-sky-200/80 bg-gradient-to-r from-sky-50/80 to-blue-50/80">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-tr from-sky-400 to-sky-500 text-white shadow-xs">
              <Cloud className="size-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">Supabase 多设备云端同步</h2>
              <p className="text-[11px] text-slate-500">登录账号即可在手机与电脑间无感实时同步账本</p>
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={openAuth} className="text-xs font-bold shrink-0">
            账号设置
          </Button>
        </Card>
      )}

      {/* 预算 (毛玻璃卡片) */}
      <Card>
        <SectionTitle icon={<Wallet className="size-4 text-sky-500" />}>生活费预算</SectionTitle>

        {/* 胶囊模式切换 */}
        <div className="mb-3.5 grid grid-cols-2 rounded-full border border-slate-200/60 bg-slate-100/70 p-1" role="radiogroup" aria-label="预算输入模式">
          {(
            [
              ['monthly', '按月生活费'],
              ['daily', '按日自定义'],
            ] as const
          ).map(([m, l]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={s.budgetMode === m}
              onClick={() => s.setBudget({ budgetMode: m })}
              className={cn(
                'h-9 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200',
                s.budgetMode === m
                  ? 'bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {s.budgetMode === 'monthly' ? (
          <div className="grid grid-cols-[1fr_6rem] gap-2.5">
            <Field label="月生活费 (¥)">
              <input
                className={inputCls}
                type="number"
                inputMode="decimal"
                min={0}
                value={s.monthly}
                onChange={(e) => s.setBudget({ monthly: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="按天折算">
              <input
                className={inputCls}
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={s.daysInMonth}
                onChange={(e) => s.setBudget({ daysInMonth: Math.max(1, Number(e.target.value) || 30) })}
              />
            </Field>
          </div>
        ) : (
          <Field label="日均支配额度 (¥)">
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              min={0}
              value={s.dailyCustom}
              onChange={(e) => s.setBudget({ dailyCustom: Number(e.target.value) || 0 })}
            />
          </Field>
        )}

        <p className="mt-3.5 rounded-2xl border border-sky-100/80 bg-sky-50/70 px-3.5 py-2.5 text-xs text-sky-800">
          日均可用 <b>{yuan(dailyBudget)}</b> − 刚需 <b>{yuan(essentialTotal)}</b> = 日净储蓄{' '}
          <b className={dailySaving > 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>{yuan(dailySaving)}</b>
        </p>
      </Card>

      {/* 刚需基线 */}
      <Card>
        <SectionTitle
          icon={<Utensils className="size-4 text-emerald-500" />}
          extra={
            <Button size="sm" variant="soft" onClick={s.addEssential} className="text-xs">
              <Plus className="size-3.5" /> 添加项
            </Button>
          }
        >
          校园日常刚需基线
        </SectionTitle>

        <ul className="space-y-2.5">
          {s.essentials.map((e) => (
            <li key={e.id} className="grid grid-cols-[1fr_5.5rem_2.25rem] items-center gap-2">
              <input
                className={cn(inputCls, 'h-10 text-xs sm:text-sm')}
                value={e.name}
                aria-label="刚需名称"
                onChange={(ev) => s.updateEssential(e.id, { name: ev.target.value })}
              />
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  ¥
                </span>
                <input
                  className={cn(inputCls, 'h-10 pl-6.5 text-right font-semibold text-xs sm:text-sm')}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={e.amount}
                  aria-label={`${e.name} 每日金额`}
                  onChange={(ev) => s.updateEssential(e.id, { amount: Number(ev.target.value) || 0 })}
                />
              </div>
              <button
                type="button"
                onClick={() => s.removeEssential(e.id)}
                className="grid size-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 active:scale-95"
                aria-label={`删除 ${e.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-xs font-medium text-slate-500">
          刚需合计 <b className="text-slate-700">{yuan(essentialTotal)}</b> / 天
        </p>
      </Card>

      {/* 心愿目标 */}
      <Card>
        <SectionTitle
          icon={<Target className="size-4 text-sky-500" />}
          extra={
            <Button size="sm" variant="soft" onClick={() => setEditing('new')} className="text-xs">
              <Plus className="size-3.5" /> 新心愿
            </Button>
          }
        >
          心愿好物目标
        </SectionTitle>

        <ul className="space-y-2.5">
          {s.goals.map((g) => (
            <li
              key={g.id}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3.5 backdrop-blur-md transition-all',
                g.id === s.activeGoalId
                  ? 'border-sky-300 bg-sky-50/60 shadow-xs ring-1 ring-sky-200/50'
                  : 'border-white/80 bg-white/70 hover:bg-white',
              )}
            >
              <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => s.setActiveGoal(g.id)}>
                <span className="text-2xl drop-shadow-2xs">{g.emoji}</span>
                <span className="min-w-0">
                  <span className="block truncate text-xs sm:text-sm font-semibold text-slate-700">{g.name}</span>
                  <span className="text-[11px] text-slate-400">
                    已存 {yuan(g.saved)} / {yuan(g.target)} · 期望 {g.deadline}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEditing(g)}
                className="grid size-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600 active:scale-95"
                aria-label={`编辑 ${g.name}`}
              >
                <Pencil className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {/* 重置 */}
      <Button
        variant="danger"
        size="md"
        className="w-full"
        onClick={() => {
          if (confirm('确定清空所有本地数据并恢复默认？')) s.resetAll()
        }}
      >
        <RotateCcw className="size-4" /> 重置全部数据
      </Button>

      <p className="pb-3 text-center text-[11px] text-slate-400">
        所有数据均安全保存在本机浏览器 LocalStorage 中，完全支持离线运行 ✨
      </p>

      {/* 编辑/新建心愿弹窗 */}
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? '新建心愿好物' : '编辑心愿好物'}
      >
        {editing !== null && <GoalForm goal={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </Dialog>
    </div>
  )
}

const EMOJIS = ['📱', '📷', '🎧', '💻', '✈️', '🎤', '🎮', '🎸', '👟', '🎓']

function GoalForm({ goal, onDone }: { goal: Goal | null; onDone: () => void }) {
  const s = useStore()
  const [name, setName] = useState(goal?.name ?? '')
  const [emoji, setEmoji] = useState(goal?.emoji ?? '📷')
  const [target, setTarget] = useState(String(goal?.target ?? ''))
  const [saved, setSaved] = useState(String(goal?.saved ?? 0))
  const [deadline, setDeadline] = useState(goal?.deadline ?? addDays(toDateKey(), 120))

  return (
    <form
      className="space-y-3.5 px-6 pb-7 pt-3"
      onSubmit={(e) => {
        e.preventDefault()
        const data = {
          name: name.trim() || '我的心愿',
          emoji,
          target: Number(target) || 0,
          saved: Number(saved) || 0,
          deadline,
        }
        if (goal) s.updateGoal(goal.id, data)
        else s.addGoal(data)
        onDone()
      }}
    >
      <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
        {EMOJIS.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => setEmoji(em)}
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-2xl text-xl transition-all duration-200 active:scale-95',
              emoji === em
                ? 'bg-sky-100/90 ring-2 ring-sky-400 shadow-xs'
                : 'border border-white/80 bg-white/70 hover:bg-white',
            )}
            aria-label={`图标 ${em}`}
          >
            {em}
          </button>
        ))}
      </div>

      <Field label="物品名称">
        <input
          className={inputCls}
          required
          placeholder="如：微单镜头、毕业旅行、iPad Air"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="目标金额 (¥)">
          <input
            className={inputCls}
            required
            type="number"
            inputMode="decimal"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </Field>
        <Field label="当前已存 (¥)">
          <input
            className={inputCls}
            type="number"
            inputMode="decimal"
            min={0}
            value={saved}
            onChange={(e) => setSaved(e.target.value)}
          />
        </Field>
      </div>

      <Field label="心愿达成期望日期">
        <input
          className={inputCls}
          type="date"
          required
          min={toDateKey()}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </Field>

      {goal && goal.delayDays > 0 && (
        <button
          type="button"
          className="text-xs text-sky-600 underline underline-offset-2 transition-colors hover:text-sky-700"
          onClick={() => s.updateGoal(goal.id, { delayDays: 0 })}
        >
          清零累计延期（当前延期 {goal.delayDays} 天）
        </button>
      )}

      <div className="flex gap-2 pt-2">
        {goal && s.goals.length > 1 && (
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              s.removeGoal(goal.id)
              onDone()
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
        <Button type="submit" size="md" className="flex-1 shadow-xs">
          <Sparkles className="size-4" /> 保存心愿
        </Button>
      </div>
    </form>
  )
}
