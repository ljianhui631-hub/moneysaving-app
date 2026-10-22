import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  Cloud,
  CloudCheck,
  CloudOff,
  KeyRound,
  LogOut,
  Mail,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import type { SyncStatus } from '../hooks/useSavingsSync'
import { supabase } from '../lib/supabase'
import { vibrate } from '../lib/utils'
import { Button, Dialog, Field, inputCls, Pill } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  user: User | null
  syncStatus: SyncStatus
  lastSyncTime: Date | null
  manualPush: () => Promise<void>
  manualPull: () => Promise<void>
}

export function AuthDrawer({
  open,
  onClose,
  user,
  syncStatus,
  lastSyncTime,
  manualPush,
  manualPull,
}: Props) {
  const [mode, setMode] = useState<'otp' | 'password'>('password')
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setMsg(null)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMsg({ type: 'success', text: '注册成功！若需要邮箱确认，请查收验证邮件，或直接尝试登录 ✨' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setMsg({ type: 'success', text: '登录成功！云端账本开始实时同步 ☁️' })
        setTimeout(() => onClose(), 600)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '认证失败，请检查账号密码'
      setMsg({ type: 'error', text: message })
    } finally {
      setLoading(false)
    }
  }

  const handleOtpAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setMsg(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      setMsg({ type: 'success', text: '免密登录链接已发送至邮箱，请点击邮件中的链接登录 ✨' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '发送失败，请稍后重试'
      setMsg({ type: 'error', text: message })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    vibrate(12)
    await supabase.auth.signOut()
    setMsg({ type: 'success', text: '已退出登录，本地数据依然完好保存 ✨' })
    setTimeout(() => onClose(), 500)
  }

  return (
    <Dialog open={open} onClose={onClose} title={user ? '云端同步与账号' : '登录以多设备同步'}>
      <div className="space-y-4 px-6 pb-8 pt-2">
        {user ? (
          /* 已登录状态视图 */
          <div className="space-y-4">
            <div className="rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 to-blue-50/70 p-4.5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-tr from-sky-400 to-sky-500 text-white shadow-xs">
                    <Cloud className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">当前同步账号</p>
                    <p className="text-sm font-extrabold text-slate-800 truncate max-w-[200px]">{user.email}</p>
                  </div>
                </div>
                <Pill
                  className={
                    syncStatus === 'syncing'
                      ? 'border border-amber-200 bg-amber-50 text-amber-600'
                      : syncStatus === 'error'
                      ? 'border border-rose-200 bg-rose-50 text-rose-500'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                  }
                >
                  {syncStatus === 'syncing' ? '同步中...' : syncStatus === 'error' ? '同步异常' : '云端同步正常'}
                </Pill>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-sky-100/80 pt-3 text-xs text-slate-500">
                <span>
                  最后同步：{lastSyncTime ? `${lastSyncTime.getHours().toString().padStart(2, '0')}:${lastSyncTime.getMinutes().toString().padStart(2, '0')}:${lastSyncTime.getSeconds().toString().padStart(2, '0')}` : '刚刚'}
                </span>
                <span className="text-[11px] text-sky-600 font-semibold">1.5s 无感防抖同步</span>
              </div>
            </div>

            {/* 手动立即同步操作 */}
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={async () => {
                  vibrate(10)
                  await manualPush()
                }}
                className="text-xs font-bold"
              >
                <RefreshCw className="size-3.5" /> 立即备份至云端
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={async () => {
                  vibrate(10)
                  await manualPull()
                }}
                className="text-xs font-bold"
              >
                <CloudCheck className="size-3.5" /> 从云端强制拉取
              </Button>
            </div>

            <Button variant="danger" size="md" className="w-full mt-2 font-bold" onClick={handleSignOut}>
              <LogOut className="size-4" /> 退出当前登录
            </Button>
          </div>
        ) : (
          /* 未登录状态视图 */
          <div className="space-y-4">
            <div className="rounded-3xl border border-sky-100/90 bg-gradient-to-br from-white/90 to-sky-50/70 p-4 shadow-2xs backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-600">
                  <CloudOff className="size-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">当前处于本地离线模式</h3>
                  <p className="text-[11px] text-slate-400">
                    数据已安全保存在本机浏览器。登录后可在手机与电脑间实时同步！
                  </p>
                </div>
              </div>
            </div>

            {/* 切换登录模式 */}
            <div className="grid grid-cols-2 rounded-full border border-slate-200/70 bg-slate-100/70 p-1" role="radiogroup">
              <button
                type="button"
                onClick={() => setMode('password')}
                className={`min-h-[40px] rounded-full text-xs font-bold transition-all ${
                  mode === 'password'
                    ? 'bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                账号密码登录
              </button>
              <button
                type="button"
                onClick={() => setMode('otp')}
                className={`min-h-[40px] rounded-full text-xs font-bold transition-all ${
                  mode === 'otp'
                    ? 'bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                邮箱免密登录
              </button>
            </div>

            {/* 提示信息 */}
            {msg && (
              <div
                className={`rounded-2xl p-3 text-xs font-medium ${
                  msg.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-rose-200 bg-rose-50 text-rose-600'
                }`}
              >
                {msg.text}
              </div>
            )}

            {/* 账号密码表单 */}
            {mode === 'password' ? (
              <form onSubmit={handlePasswordAuth} className="space-y-3">
                <Field label="电子邮箱">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      className={`${inputCls} pl-10`}
                      type="email"
                      required
                      placeholder="student@campus.edu.cn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </Field>

                <Field label="密码">
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      className={`${inputCls} pl-10`}
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </Field>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="font-bold text-sky-600 hover:underline"
                  >
                    {isSignUp ? '已有账号？去登录' : '没有账号？点击注册新账号'}
                  </button>
                </div>

                <Button type="submit" size="lg" className="w-full font-bold shadow-sm" disabled={loading}>
                  {loading ? '处理中...' : isSignUp ? '立即注册并同步' : '登录并同步云端'}
                </Button>
              </form>
            ) : (
              /* 邮箱免密登录表单 */
              <form onSubmit={handleOtpAuth} className="space-y-3">
                <Field label="接收验证链接的邮箱" hint="无需记住密码，点击邮件中的 Magic Link 即可直接登录">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      className={`${inputCls} pl-10`}
                      type="email"
                      required
                      placeholder="student@campus.edu.cn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </Field>

                <Button type="submit" size="lg" className="w-full font-bold shadow-sm" disabled={loading}>
                  <Sparkles className="size-4" />
                  {loading ? '发送中...' : '发送免密登录邮件'}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}
