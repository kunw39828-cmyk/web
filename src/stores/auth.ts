import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiRequest } from '../api/client'

type UserRole = 'student' | 'teacher'
type UserProfile = {
  studentId: string
  name: string
  role: UserRole
  department: string
  wechatBound: boolean
}
type AuthSession = { token: string; user: UserProfile }

export type WechatCapabilities = {
  openQrEnabled: boolean
  mockQrAvailable: boolean
  vapidPublicKey: string
}

const STORAGE_KEY = 'campus-service-auth'

function readStoredSession(): AuthSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(readStoredSession())
  const user = computed<UserProfile | null>(() => session.value?.user ?? null)
  const token = computed(() => session.value?.token ?? '')
  const isAuthenticated = computed(() => Boolean(session.value?.token))
  const isTeacher = computed(() => user.value?.role === 'teacher')

  function persist(next: AuthSession) {
    session.value = next
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  async function passwordLogin(studentId: string, password: string) {
    const next = await apiRequest('/auth/password-login', {
      method: 'POST',
      body: JSON.stringify({ studentId, password }),
    })
    persist(next)
  }

  async function createWechatSession(studentId: string) {
    return apiRequest('/auth/wechat/session', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    })
  }

  async function getWechatStatus(sessionId: string) {
    const data = await apiRequest(`/auth/wechat/session/${sessionId}/status`)
    return data.status as 'pending' | 'confirmed' | 'expired'
  }

  async function confirmWechatSession(sessionId: string) {
    const next = await apiRequest(`/auth/wechat/session/${sessionId}/confirm`, {
      method: 'POST',
    })
    persist(next)
  }

  async function bindUserWechat() {
    if (!user.value) throw new Error('请先登录后再绑定微信。')
    const nextUser = await apiRequest('/auth/bind-wechat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.value?.token || ''}` },
      body: JSON.stringify({ studentId: user.value.studentId }),
    })
    persist({ token: session.value!.token, user: nextUser })
  }

  async function fetchWechatCapabilities(): Promise<WechatCapabilities> {
    return apiRequest('/auth/wechat/capabilities')
  }

  async function initWechatOpen(body: { studentId?: string; password?: string }) {
    return apiRequest<{ pollId: string; iframeUrl: string; expiresAt: number }>('/auth/wechat/open/init', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async function pollWechatOpen(pollId: string) {
    return apiRequest<{ status: string; token?: string; user?: UserProfile; message?: string }>(
      `/auth/wechat/open/poll?pollId=${encodeURIComponent(pollId)}`,
    )
  }

  function completeWechatOpenLogin(next: AuthSession) {
    persist(next)
  }

  function logout() {
    session.value = null
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return {
    user,
    token,
    isAuthenticated,
    isTeacher,
    passwordLogin,
    createWechatSession,
    getWechatStatus,
    confirmWechatSession,
    bindUserWechat,
    fetchWechatCapabilities,
    initWechatOpen,
    pollWechatOpen,
    completeWechatOpenLogin,
    logout,
  }
})
