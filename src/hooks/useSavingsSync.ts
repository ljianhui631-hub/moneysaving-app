import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { extractSyncData, useStore } from '../store'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

export function useSavingsSync() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const storeState = useStore()
  const replaceState = useStore((s) => s.replaceState)
  const pushNotice = useStore((s) => s.pushNotice)

  // 避免拉取云端数据时反向触发推送
  const isApplyingCloudUpdate = useRef(false)
  const debounceTimer = useRef<number | null>(null)

  // 1. 初始化监听用户鉴权状态
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 2. 登录成功后检测云端数据
  useEffect(() => {
    if (!user) {
      setSyncStatus('idle')
      return
    }

    let isMounted = true

    async function initCloudData(currentUser: User) {
      try {
        setSyncStatus('syncing')
        const { data, error } = await supabase
          .from('user_savings')
          .select('data, updated_at')
          .eq('user_id', currentUser.id)
          .maybeSingle()

        if (error) {
          console.warn('查询云端数据警告/表可能未创建:', error.message)
          setSyncStatus('idle')
          return
        }

        if (!isMounted) return

        if (!data || !data.data) {
          // 云端为空：将当前本地数据一次性推送到云端
          const localPayload = extractSyncData(useStore.getState())
          await supabase.from('user_savings').upsert({
            user_id: currentUser.id,
            data: localPayload,
            updated_at: new Date().toISOString(),
          })
          if (isMounted) {
            setSyncStatus('synced')
            setLastSyncTime(new Date())
            pushNotice({
              kind: 'success',
              title: '云端备份已就绪',
              message: '已将本机账本成功备份到 Supabase 云端 ✨',
            })
          }
        } else {
          // 云端已有数据：拉取并应用到本地
          isApplyingCloudUpdate.current = true
          replaceState(data.data)
          if (isMounted) {
            setSyncStatus('synced')
            setLastSyncTime(new Date(data.updated_at || Date.now()))
            pushNotice({
              kind: 'info',
              title: '已同步云端账本 ☁️',
              message: '多设备数据已同步为最新版本',
            })
          }
          setTimeout(() => {
            isApplyingCloudUpdate.current = false
          }, 500)
        }
      } catch (err) {
        console.error('初始化同步失败:', err)
        if (isMounted) setSyncStatus('error')
      }
    }

    initCloudData(user)

    // 订阅云端实时变更 (Realtime)
    const channel = supabase
      .channel(`realtime_savings_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_savings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && payload.new.data && !isApplyingCloudUpdate.current) {
            isApplyingCloudUpdate.current = true
            replaceState(payload.new.data)
            setSyncStatus('synced')
            setLastSyncTime(new Date(payload.new.updated_at || Date.now()))
            setTimeout(() => {
              isApplyingCloudUpdate.current = false
            }, 500)
          }
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [user, replaceState, pushNotice])

  // 3. 用户登录状态下，监听本地数据变动并 1.5 秒防抖 upsert
  useEffect(() => {
    if (!user || isApplyingCloudUpdate.current) return

    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = window.setTimeout(async () => {
      try {
        setSyncStatus('syncing')
        const payload = extractSyncData(useStore.getState())
        const { error } = await supabase.from('user_savings').upsert({
          user_id: user.id,
          data: payload,
          updated_at: new Date().toISOString(),
        })

        if (error) {
          console.error('自动保存失败:', error)
          setSyncStatus('error')
        } else {
          setSyncStatus('synced')
          setLastSyncTime(new Date())
        }
      } catch (err) {
        console.error('自动保存异常:', err)
        setSyncStatus('error')
      }
    }, 1500)

    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current)
      }
    }
  }, [
    user,
    storeState.monthly,
    storeState.dailyCustom,
    storeState.budgetMode,
    storeState.essentials,
    storeState.goals,
    storeState.activeGoalId,
    storeState.records,
    storeState.achievementFund,
    storeState.plan,
    storeState.streak,
    storeState.badges,
    storeState.lastDepositDate,
  ])

  // 手动立即推送或拉取
  const manualPush = useCallback(async () => {
    if (!user) return
    setSyncStatus('syncing')
    try {
      const payload = extractSyncData(useStore.getState())
      const { error } = await supabase.from('user_savings').upsert({
        user_id: user.id,
        data: payload,
        updated_at: new Date().toISOString(),
      })
      if (!error) {
        setSyncStatus('synced')
        setLastSyncTime(new Date())
      } else {
        setSyncStatus('error')
      }
    } catch {
      setSyncStatus('error')
    }
  }, [user])

  const manualPull = useCallback(async () => {
    if (!user) return
    setSyncStatus('syncing')
    try {
      const { data, error } = await supabase
        .from('user_savings')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data?.data) {
        isApplyingCloudUpdate.current = true
        replaceState(data.data)
        setSyncStatus('synced')
        setLastSyncTime(new Date(data.updated_at || Date.now()))
        setTimeout(() => {
          isApplyingCloudUpdate.current = false
        }, 500)
      } else {
        setSyncStatus('error')
      }
    } catch {
      setSyncStatus('error')
    }
  }, [user, replaceState])

  return {
    user,
    authLoading,
    syncStatus,
    lastSyncTime,
    manualPush,
    manualPull,
  }
}
