import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  bindWechat as bindWechatApi,
  confirmWechatLoginSession as confirmWechatSessionApi,
  createWechatLoginSession as createWechatSessionApi,
  getWechatLoginSessionStatus as getWechatSessionStatusApi,
  loginWithPassword as passwordLoginApi,
} from '../api/auth'
import type { AuthSession, UserProfile } from '../api/auth'

type PasswordLoginInput = {
  studentId: string
  password: string
}

type WechatSessionStatus = 'pending' | 'confirmed' | 'expired'

type AuthContextValue = {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  loginWithPassword: (input: PasswordLoginInput) => Promise<void>
  createWechatLoginSession: (
    studentId: string,
  ) => Promise<{ sessionId: string; expiresAt: number; qrCodeText: string }>
  getWechatLoginSessionStatus: (sessionId: string) => Promise<WechatSessionStatus>
  loginWithWechatSession: (sessionId: string) => Promise<void>
  bindWechat: () => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'campus-service-auth'

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): AuthSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)

  useEffect(() => {
    setSession(readStoredSession())
  }, [])

  const persistSession = useCallback((nextSession: AuthSession) => {
    setSession(nextSession)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
  }, [])

  const loginWithPassword = useCallback(async (input: PasswordLoginInput) => {
    const nextSession = await passwordLoginApi(input)
    persistSession(nextSession)
  }, [persistSession])

  const loginWithWechatSession = useCallback(async (sessionId: string) => {
    const nextSession = await confirmWechatSessionApi(sessionId)
    persistSession(nextSession)
  }, [persistSession])

  const createWechatLoginSession = useCallback(async (studentId: string) => {
    return createWechatSessionApi(studentId)
  }, [])

  const getWechatLoginSessionStatus = useCallback(async (sessionId: string) => {
    return getWechatSessionStatusApi(sessionId)
  }, [])

  const bindWechat = useCallback(async () => {
    if (!session?.user) {
      throw new Error('请先登录后再绑定微信。')
    }

    const nextUser = await bindWechatApi({ studentId: session.user.studentId })
    const nextSession: AuthSession = {
      token: session.token,
      user: nextUser,
    }
    persistSession(nextSession)
  }, [persistSession, session])

  const logout = useCallback(() => {
    setSession(null)
    window.localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      loginWithPassword,
      createWechatLoginSession,
      getWechatLoginSessionStatus,
      loginWithWechatSession,
      bindWechat,
      logout,
    }),
    [
      bindWechat,
      createWechatLoginSession,
      getWechatLoginSessionStatus,
      loginWithPassword,
      loginWithWechatSession,
      logout,
      session,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用。')
  }
  return context
}
