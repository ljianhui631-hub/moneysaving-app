import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  CloudCheck,
  CloudOff,
  GraduationCap,
  Home,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
} from 'lucide-react'
import { BADGES } from './data/actions'
import { AuthDrawer } from './components/AuthDrawer'
import { BoardView } from './components/BoardView'
import { HomeView } from './components/HomeView'
import { ImpulseSheet } from './components/ImpulseSheet'
import { LibraryView } from './components/LibraryView'
import { MemoryBreadView } from './components/MemoryBreadView'
import { SettingsView } from './components/SettingsView'
import { Button, Dialog } from './components/ui'
import { useSavingsSync } from './hooks/useSavingsSync'
import { cn, vibrate } from './lib/utils'
import { useStore } from './store'

type Tab = 'pocket' | 'austerity' | 'bread'

export default function App() {
  const [tab, setTab] = useState<Tab>('pocket')
  const [impulseOpen, setImpulseOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const plan = useStore((s) => s.plan)
  const notices = useStore((s) => s.notices)
  const dismissNotice = useStore((s) => s.dismissNotice)
  const syncPlan = useStore((s) => s.syncPlan)

  const { user, syncStatus, lastSyncTime, manualPush, manualPull } = useSavingsSync()

  useEffect(() => {
    syncPlan()
  }, [syncPlan])

  const notice = notices[0]

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-slate-50/80 font-sans text-slate-700 antialiased selection:bg-sky-100 selection:text-sky-700 touch-pan-y">
      {/* 氛围层 (Mesh Glow: 左上方浅蓝光斑 + 右下方鹅黄光斑) */}
      <div
        className="pointer-events-none fixed -left-24 -top-24 -z-10 size-96 rounded-full bg-sky-200/35 blur-3xl will-change-transform"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -bottom-24 -right-24 -z-10 size-96 rounded-full bg-amber-100/40 blur-3xl will-change-transform"
        aria-hidden
      />

      {/* 移动端全屏，桌面端自适应居中 */}
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        {/* 顶部栏 (iOS 避让安全区 pt-[env(safe-area-inset-top)]) */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/60 bg-white/75 px-4.5 py-3 backdrop-blur-2xl shadow-xs pt-safe">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-2xl bg-gradient-to-tr from-sky-400 to-sky-500 text-white shadow-sm shadow-sky-500/30">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-800">GoalSaver</span>
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 ring-1 ring-sky-200/60">
                  校园版
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400">梦想与心愿的治愈口袋 ✨</p>
            </div>
          </div>

          {/* 右侧：云端同步状态微标签 + 降级库 + 设置入口 (靶点 ≥ 48px) */}
          <div className="flex items-center gap-1">
            {/* 云端同步指示胶囊按钮 */}
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className={cn(
                'flex min-h-[36px] items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 touch-manipulation',
                user
                  ? syncStatus === 'syncing'
                    ? 'border border-amber-200/80 bg-amber-50 text-amber-600'
                    : syncStatus === 'error'
                    ? 'border border-rose-200/80 bg-rose-50 text-rose-500'
                    : 'border border-sky-200/80 bg-sky-50/80 text-sky-600'
                  : 'border border-slate-200/70 bg-white/70 text-slate-500 hover:bg-white',
              )}
              title={user ? `已连接账号: ${user.email}` : '未登录，点击开启云端同步'}
            >
              {user ? (
                syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="size-3 animate-spin" />
                    <span>同步中</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <CloudOff className="size-3" />
                    <span>同步重试</span>
                  </>
                ) : (
                  <>
                    <CloudCheck className="size-3" />
                    <span>已同步</span>
                  </>
                )
              ) : (
                <>
                  <Cloud className="size-3 text-slate-400" />
                  <span>本地</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="grid size-10 place-items-center rounded-full text-slate-500 transition-transform active:scale-90 hover:bg-sky-50 hover:text-sky-600 touch-manipulation"
              aria-label="校园降级行动库"
              title="校园降级行动库"
            >
              <BookOpen className="size-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="grid size-10 place-items-center rounded-full text-slate-500 transition-transform active:scale-90 hover:bg-sky-50 hover:text-sky-600 touch-manipulation"
              aria-label="收支与心愿设置"
              title="收支与心愿设置"
            >
              <Settings className="size-4.5" />
            </button>
          </div>
        </header>

        {/* 主体视口内容 (严格避让顶部安全区与底部悬浮导航坞 pb-dock) */}
        <main className="flex-1 px-4.5 pt-4 pb-dock">
          {tab === 'pocket' && (
            <HomeView
              goBoard={() => setTab('austerity')}
              goBread={() => setTab('bread')}
              openImpulse={() => setImpulseOpen(true)}
              openSettings={() => setSettingsOpen(true)}
            />
          )}
          {tab === 'austerity' && (
            <BoardView
              openImpulse={() => setImpulseOpen(true)}
              openLibrary={() => setLibraryOpen(true)}
            />
          )}
          {tab === 'bread' && (
            <MemoryBreadView openImpulse={() => setImpulseOpen(true)} />
          )}
        </main>

        {/* 底部悬浮毛玻璃导航坞 (Floating Dock Navigation + 居中 FAB 快速悬浮记账) */}
        <div className="fixed inset-x-3.5 bottom-3.5 z-30 mx-auto max-w-[390px] select-none pb-safe">
          <nav
            aria-label="移动端主导航"
            className="relative flex items-center justify-between rounded-full border border-white/80 bg-white/85 px-3 py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
          >
            {/* 🏠【百宝袋】总资产与心愿大盘 */}
            <DockItem
              active={tab === 'pocket'}
              icon={Home}
              label="百宝袋"
              onClick={() => setTab('pocket')}
            />

            {/* ⚡【紧缩清单】校园降级打卡 Todo */}
            <DockItem
              active={tab === 'austerity'}
              icon={ClipboardCheck}
              label="紧缩清单"
              dot={!!plan}
              onClick={() => setTab('austerity')}
            />

            {/* 核心“记一笔”快速悬浮按钮 (FAB: 居中突出 · 经典哆啦蓝渐变) */}
            <div className="relative -top-4 flex items-center justify-center px-1">
              <button
                type="button"
                onClick={() => {
                  vibrate(18)
                  setImpulseOpen(true)
                }}
                aria-label="3秒极速记账"
                title="3秒极速记账"
                className="group relative grid size-14 place-items-center rounded-full bg-gradient-to-tr from-sky-400 via-sky-500 to-blue-500 text-white shadow-[0_10px_25px_rgba(14,165,233,0.45)] ring-4 ring-white transition-all duration-150 active:scale-90 hover:scale-105 touch-manipulation"
              >
                <Plus className="size-7 stroke-[2.8] transition-transform duration-200 group-hover:rotate-90" />
                <span className="pointer-events-none absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity group-active:opacity-100" />
              </button>
            </div>

            {/* 🍞【记忆面包】每日账单流水明细 */}
            <DockItem
              active={tab === 'bread'}
              icon={BookOpen}
              label="记忆面包"
              emoji="🍞"
              onClick={() => setTab('bread')}
            />

            {/* ⚙️【设置】快捷入口 */}
            <DockItem
              active={false}
              icon={Settings}
              label="配置"
              onClick={() => setSettingsOpen(true)}
            />
          </nav>
        </div>

        {/* 底部滑出手势抽屉 1: 冲动消费决策阻断 & 极速单手记账 */}
        <ImpulseSheet open={impulseOpen} onClose={() => setImpulseOpen(false)} />

        {/* 底部滑出手势抽屉 2: 收支与心愿设置 */}
        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} title="校园收支与心愿配置">
          <div className="p-1">
            <SettingsView openAuth={() => setAuthOpen(true)} />
          </div>
        </Dialog>

        {/* 底部滑出手势抽屉 3: 校园消费降级行动库 */}
        <Dialog open={libraryOpen} onClose={() => setLibraryOpen(false)} title="校园消费降级行动库">
          <div className="p-1">
            <LibraryView />
          </div>
        </Dialog>

        {/* 底部滑出手势抽屉 4: Supabase 云端同步与账号 */}
        <AuthDrawer
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          user={user}
          syncStatus={syncStatus}
          lastSyncTime={lastSyncTime}
          manualPush={manualPush}
          manualPull={manualPull}
        />

        {/* 底部滑出手势抽屉 5: 通知 / 违约兜底 / 徽章解锁通知 */}
        <Dialog open={!!notice} onClose={dismissNotice} title={notice?.title ?? ''} hideHeader>
          {notice && (
            <div className="flex flex-col items-center px-6 py-6 text-center pb-8">
              {notice.kind === 'fail' && (
                <div className="grid size-14 place-items-center rounded-full bg-rose-50 text-rose-500 ring-4 ring-rose-100/70">
                  <AlertTriangle className="size-7" />
                </div>
              )}
              {notice.kind === 'success' && (
                <div className="grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-500 ring-4 ring-emerald-100/70">
                  <CheckCircle2 className="size-7" />
                </div>
              )}
              {notice.kind === 'info' && (
                <div className="grid size-14 place-items-center rounded-full bg-sky-50 text-sky-500 ring-4 ring-sky-100/70">
                  <Sparkles className="size-7" />
                </div>
              )}
              {notice.kind === 'badge' && (
                <div className="flex gap-2">
                  {notice.badgeIds?.map((id) => {
                    const b = BADGES.find((x) => x.id === id)!
                    return (
                      <div
                        key={id}
                        className={cn(
                          'grid size-16 place-items-center rounded-full bg-gradient-to-br text-white shadow-lg shadow-amber-400/30',
                          b.tone,
                        )}
                      >
                        <b.icon className="size-8" />
                      </div>
                    )
                  })}
                </div>
              )}
              <h3 className="mt-4 text-base font-extrabold tracking-tight text-slate-800">{notice.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 max-w-xs">{notice.message}</p>
              <Button size="lg" className="mt-5 w-full font-bold shadow-xs" onClick={dismissNotice}>
                知道了 ✨
              </Button>
            </div>
          )}
        </Dialog>
      </div>
    </div>
  )
}

function DockItem({
  active,
  icon: Icon,
  label,
  emoji,
  dot,
  onClick,
}: {
  active: boolean
  icon: typeof Home
  label: string
  emoji?: string
  dot?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        vibrate(8)
        onClick()
      }}
      className={cn(
        'relative flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-bold tracking-tight transition-all active:scale-90 touch-manipulation',
        active ? 'text-sky-600 font-black' : 'text-slate-400 hover:text-slate-600',
      )}
    >
      <div
        className={cn(
          'relative grid size-7 place-items-center rounded-full transition-colors',
          active ? 'bg-sky-100/80 text-sky-600' : 'text-slate-400',
        )}
      >
        {emoji ? <span className="text-sm">{emoji}</span> : <Icon className="size-4.5" />}
        {dot && (
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-400 ring-2 ring-white" />
        )}
      </div>
      <span>{label}</span>
    </button>
  )
}
