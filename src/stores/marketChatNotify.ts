import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiRequest } from '../api/client'
import { useAuthStore } from './auth'

type SessionRow = { itemId: number; peerId: string; unread?: number }

function hiddenKeySet(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return new Set()
    const data = JSON.parse(raw) as { hidden?: string[] }
    return new Set(data.hidden || [])
  } catch {
    return new Set()
  }
}

/** 顶栏未读角标：二手 + 失物招领，排除各自本地已删除会话。 */
export const useMarketChatNotifyStore = defineStore('marketChatNotify', () => {
  const unreadMarket = ref(0)
  const unreadLost = ref(0)
  const unreadTotal = computed(() => unreadMarket.value + unreadLost.value)
  let timer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    const auth = useAuthStore()
    const token = auth.token?.trim()
    const sid = auth.user?.studentId
    if (!token || !sid) {
      unreadMarket.value = 0
      unreadLost.value = 0
      return
    }
    const hiddenM = hiddenKeySet(`market-chat-pref:${sid}`)
    const hiddenL = hiddenKeySet(`lost-found-chat-pref:${sid}`)
    try {
      const [rawM, rawL] = await Promise.all([
        apiRequest<SessionRow[]>('/market/chat/sessions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest<SessionRow[]>('/lost-found/chat/sessions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      unreadMarket.value = rawM
        .filter((s) => !hiddenM.has(`${s.itemId}:${s.peerId}`))
        .reduce((n, s) => n + (s.unread || 0), 0)
      unreadLost.value = rawL
        .filter((s) => !hiddenL.has(`${s.itemId}:${s.peerId}`))
        .reduce((n, s) => n + (s.unread || 0), 0)
    } catch {
      /* 保留上次数字 */
    }
  }

  function startPolling() {
    stopPolling()
    void refresh()
    timer = setInterval(() => void refresh(), 4000)
  }

  function stopPolling() {
    if (timer) clearInterval(timer)
    timer = null
  }

  return { unreadTotal, unreadMarket, unreadLost, refresh, startPolling, stopPolling }
})
