export type UserRole = 'student' | 'teacher'

export type UserProfile = {
  studentId: string
  name: string
  role: UserRole
  department: string
}

export type AuthSession = {
  token: string
  user: UserProfile
}

type PasswordLoginPayload = {
  studentId: string
  password: string
}

const fakeUsers: Record<string, UserProfile & { password: string }> = {
  '20260001': {
    studentId: '20260001',
    name: '张晓雨',
    role: 'student',
    department: '计算机学院',
    password: '123456',
  },
  '20260002': {
    studentId: '20260002',
    name: '李明哲',
    role: 'student',
    department: '信息工程学院',
    password: '654321',
  },
  'T2026001': {
    studentId: 'T2026001',
    name: '陈老师',
    role: 'teacher',
    department: '教务处',
    password: '888888',
  },
}

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

  const profile = { ...user }
  delete profile.password
  return makeSession(profile)
}
