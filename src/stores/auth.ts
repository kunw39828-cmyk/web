import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiRequest } from '../api/client'

type UserRole = 'student' | 'teacher'
type UserProfile = {
  studentId: string
  name: string
  role: UserRole
  department: string
  mustChangePassword?: boolean
}
type AuthSession = { token: string; user: UserProfile }

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

  async function changePassword(oldPassword: string, newPassword: string) {
    if (!session.value?.token) throw new Error('请先登录。')
    const r = await apiRequest<{ ok: boolean; user: UserProfile }>('/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.value.token}` },
      body: JSON.stringify({ oldPassword, newPassword }),
    })
    persist({ token: session.value.token, user: r.user })
  }

  async function forgotPassword(studentId: string, name: string, idCardLast4: string) {
    await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ studentId, name, idCardLast4 }),
    })
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
    changePassword,
    forgotPassword,
    logout,
  }
})
