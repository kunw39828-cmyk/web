export type UserRole = 'student' | 'teacher'

export type UserProfile = {
  studentId: string
  name: string
  role: UserRole
  department: string
  wechatBound: boolean
}

export type AuthSession = {
  token: string
  user: UserProfile
}

type PasswordLoginPayload = {
  studentId: string
  password: string
}

type WechatLoginPayload = {
  studentId: string
  wechatBound: boolean
}

type BindWechatPayload = {
  studentId: string
}

export type WechatLoginSession = {
  sessionId: string
  expiresAt: number
  qrCodeText: string
}

type WechatSessionStatus = 'pending' | 'confirmed' | 'expired'

type WechatSessionRecord = {
  studentId: string
  expiresAt: number
  status: WechatSessionStatus
}

const fakeUsers: Record<string, UserProfile & { password: string }> = {
  '20260001': {
    studentId: '20260001',
    name: '张晓雨',
    role: 'student',
    department: '计算机学院',
    wechatBound: true,
    password: '123456',
  },
  '20260002': {
    studentId: '20260002',
    name: '李明哲',
    role: 'student',
    department: '信息工程学院',
    wechatBound: false,
    password: '654321',
  },
  'T2026001': {
    studentId: 'T2026001',
    name: '陈老师',
    role: 'teacher',
    department: '教务处',
    wechatBound: true,
    password: '888888',
  },
}

const wechatSessions = new Map<string, WechatSessionRecord>()

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function makeSession(user: UserProfile): AuthSession {
  return {
    token: `demo-token-${user.studentId}`,
    user,
  }
}

export async function loginWithPassword(
  payload: PasswordLoginPayload,
): Promise<AuthSession> {
  await wait(500)

  const user = fakeUsers[payload.studentId.trim()]
  if (!user || user.password !== payload.password) {
    throw new Error('学号或密码错误，请检查后重试。')
  }

  const { password: _password, ...profile } = user
  return makeSession(profile)
}

export async function loginWithWechat(
  payload: WechatLoginPayload,
): Promise<AuthSession> {
  await wait(500)

  const user = fakeUsers[payload.studentId.trim()]
  if (!user) {
    throw new Error('未找到该学号，请先使用学号密码登录。')
  }
  if (!payload.wechatBound || !user.wechatBound) {
    throw new Error('当前账号未绑定微信，请先完成绑定。')
  }

  const { password: _password, ...profile } = user
  return makeSession(profile)
}

export async function createWechatLoginSession(studentId: string): Promise<WechatLoginSession> {
  await wait(300)

  const normalizedId = studentId.trim()
  const user = fakeUsers[normalizedId]
  if (!user) {
    throw new Error('未找到该学号，请先确认学号是否正确。')
  }
  if (!user.wechatBound) {
    throw new Error('当前账号未绑定微信，请先使用学号密码登录后绑定。')
  }

  const sessionId = `wx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const expiresAt = Date.now() + 90_000

  wechatSessions.set(sessionId, {
    studentId: normalizedId,
    expiresAt,
    status: 'pending',
  })

  return {
    sessionId,
    expiresAt,
    qrCodeText: `WECHAT_LOGIN:${sessionId}`,
  }
}

export async function getWechatLoginSessionStatus(sessionId: string): Promise<WechatSessionStatus> {
  await wait(250)

  const record = wechatSessions.get(sessionId)
  if (!record) {
    return 'expired'
  }
  if (Date.now() > record.expiresAt) {
    record.status = 'expired'
    wechatSessions.set(sessionId, record)
    return 'expired'
  }
  return record.status
}

export async function confirmWechatLoginSession(sessionId: string): Promise<AuthSession> {
  await wait(300)

  const record = wechatSessions.get(sessionId)
  if (!record || Date.now() > record.expiresAt) {
    throw new Error('二维码已过期，请刷新后重试。')
  }
  if (record.status === 'expired') {
    throw new Error('二维码已过期，请刷新后重试。')
  }

  record.status = 'confirmed'
  wechatSessions.set(sessionId, record)

  const user = fakeUsers[record.studentId]
  const { password: _password, ...profile } = user
  return makeSession(profile)
}

export async function bindWechat(
  payload: BindWechatPayload,
): Promise<UserProfile> {
  await wait(500)

  const user = fakeUsers[payload.studentId.trim()]
  if (!user) {
    throw new Error('账号不存在，无法完成微信绑定。')
  }

  user.wechatBound = true
  const { password: _password, ...profile } = user
  return profile
}
