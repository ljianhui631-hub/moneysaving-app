import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

/* ---------- Button (触控靶点 ≥ 48px + 弹性物理反馈) ---------- */
type Variant = 'primary' | 'emerald' | 'amber' | 'outline' | 'ghost' | 'soft' | 'danger'
const variants: Record<Variant, string> = {
  // 哆啦经典蓝 (Sky-500) 渐变
  primary:
    'bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-md shadow-sky-500/25 hover:from-sky-500 hover:to-sky-600',
  // 翡翠自律绿
  emerald:
    'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-600',
  // 哆啦金铃铛 (Amber-400)
  amber:
    'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-400/30 hover:from-amber-500 hover:to-amber-600',
  // 毛玻璃轮廓
  outline:
    'border border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white hover:border-sky-300 shadow-2xs',
  // 幽灵态
  ghost:
    'text-slate-600 hover:bg-sky-50/80 hover:text-sky-600 active:bg-sky-100/60',
  // 治愈浅蓝底
  soft:
    'bg-sky-50/90 text-sky-700 hover:bg-sky-100/90 border border-sky-100/70',
  // 哆啦红项圈警示 (Rose-400/500)
  danger:
    'bg-rose-50 text-rose-500 hover:bg-rose-100/90 border border-rose-200/60',
}

const sizes = {
  sm: 'min-h-[44px] h-11 px-4 text-xs font-semibold rounded-full',
  md: 'min-h-[48px] h-12 px-5 text-sm font-semibold rounded-full',
  lg: 'min-h-[52px] h-13 px-6 text-base font-bold rounded-full',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: keyof typeof sizes
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 tracking-wide transition-transform duration-100 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 disabled:transform-none disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 touch-manipulation',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})

/* ---------- Card (毛玻璃白底容器) ---------- */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/70 bg-white/75 p-4 sm:p-5 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
        className,
      )}
      {...props}
    />
  )
}

export function SectionTitle({ icon, children, extra }: { icon?: ReactNode; children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-1">
      <h2 className="flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-slate-700">
        {icon}
        {children}
      </h2>
      {extra}
    </div>
  )
}

/* ---------- Progress (胶囊状轨道 + 平滑流动渐变填充) ---------- */
export function Progress({
  value,
  className,
  barClass,
}: {
  value: number
  className?: string
  barClass?: string
}) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cn('h-3.5 w-full overflow-hidden rounded-full bg-sky-100/80 p-0.5 shadow-inner', className)}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500 shadow-xs transition-all duration-500 ease-out',
          barClass,
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  )
}

/* ---------- Badge / Pill (圆润胶囊) ---------- */
export function Pill({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide shadow-2xs',
        className,
      )}
      {...props}
    />
  )
}

/* ---------- Field ---------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  )
}

/* ---------- Input 极简圆角 (最小高度 48px，舒适拇指触控) ---------- */
export const inputCls =
  'min-h-[48px] h-12 w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 text-sm font-medium text-slate-700 outline-none backdrop-blur-md transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100/70 shadow-2xs'

/* ---------- Bottom Sheet (全面统一的移动端手势抽屉) ---------- */
interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** 保留 variant 兼容性，在移动端一律采用精致 Bottom Sheet */
  variant?: 'sheet' | 'center'
  hideHeader?: boolean
}

export function Dialog({ open, onClose, title, children, hideHeader }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useRef(`dlg-${Math.random().toString(36).slice(2, 8)}`).current
  const startY = useRef<number | null>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  // 兜底 light dismiss
  useEffect(() => {
    const d = ref.current
    if (!d || 'closedBy' in HTMLDialogElement.prototype) return
    const onClick = (e: MouseEvent) => {
      if (e.target !== d) return
      const r = d.getBoundingClientRect()
      const inside = r.top <= e.clientY && e.clientY <= r.bottom && r.left <= e.clientX && e.clientX <= r.right
      if (!inside) d.close()
    }
    d.addEventListener('click', onClick)
    return () => d.removeEventListener('click', onClick)
  }, [])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      onClose={onClose}
    >
      {/* 拖拽手柄条 (胶囊形 Drag Handle，下划关闭) */}
      <div
        className="flex cursor-grab touch-none select-none justify-center pb-2 pt-3"
        onPointerDown={(e) => (startY.current = e.clientY)}
        onPointerUp={(e) => {
          if (startY.current !== null && e.clientY - startY.current > 50) ref.current?.close()
          startY.current = null
        }}
        aria-hidden
      >
        <div className="h-1.5 w-12 rounded-full bg-slate-300/80 transition-colors hover:bg-slate-400" />
      </div>

      <div
        className={cn(
          hideHeader && 'sr-only',
          'flex items-center justify-between px-6 pt-1 pb-2 border-b border-slate-100/60',
        )}
      >
        <h2 id={titleId} className="text-base font-bold tracking-tight text-slate-800">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="grid size-11 place-items-center rounded-full text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-600 active:scale-95 touch-manipulation"
          aria-label="关闭"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="max-h-[82dvh] overflow-y-auto no-scrollbar overscroll-contain">
        {open && children}
      </div>
    </dialog>
  )
}
