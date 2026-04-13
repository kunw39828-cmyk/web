import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  bindWechat,
  confirmWechatLoginSession,
  createWechatLoginSession,
  getWechatLoginSessionStatus,
  loginWithPassword,
} from '../api/auth'
import type { AuthSession, UserProfile } from '../api/auth'

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
  const isAuthenticated = computed(() => Boolean(session.value?.token))

  function persist(next: AuthSession) {
    session.value = next
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  async function passwordLogin(studentId: string, password: string) {
    const next = await loginWithPassword({ studentId, password })
    persist(next)
  }

  async function createWechatSession(studentId: string) {
    return createWechatLoginSession(studentId)
  }

  async function getWechatStatus(sessionId: string) {
    return getWechatLoginSessionStatus(sessionId)
  }

  async function confirmWechatSession(sessionId: string) {
    const next = await confirmWechatLoginSession(sessionId)
    persist(next)
  }

  async function bindUserWechat() {
    if (!user.value) throw new Error('请先登录后再绑定微信。')
    const nextUser = await bindWechat({ studentId: user.value.studentId })
    persist({ token: session.value!.token, user: nextUser })
  }

  function logout() {
    session.value = null
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return {
    user,
    isAuthenticated,
    passwordLogin,
    createWechatSession,
    getWechatStatus,
    confirmWechatSession,
    bindUserWechat,
    logout,
  }
})
