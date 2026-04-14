import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'

const app = express()
// Default 3001 so Java + MySQL backend can own 3000 (`npm run dev:server:java`).
const PORT = Number(process.env.PORT || 3001)
const JWT_SECRET = process.env.JWT_SECRET || 'campus-demo-secret'

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

const users = {
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
  T2026001: {
    studentId: 'T2026001',
    name: '陈老师',
    role: 'teacher',
    department: '教务处',
    wechatBound: true,
    password: '888888',
  },
}

const teacherApprovers = [
  { id: 't1', name: '陈老师', department: '活动中心管理办公室', managedVenueIds: ['v1'] },
  { id: 't2', name: '赵老师', department: '体育部场馆管理组', managedVenueIds: ['v2'] },
  { id: 't3', name: '林老师', department: '图书馆运行管理中心', managedVenueIds: ['v3'] },
  { id: 't4', name: '王老师', department: '活动中心管理办公室', managedVenueIds: ['v1', 'v2'] },
]

const venues = [
  { id: 'v1', name: '报告厅 A101', building: '活动中心', open: '08:00–21:00', seats: 200 },
  { id: 'v2', name: '舞蹈练习室 3', building: '体育馆副楼', open: '09:00–20:00', seats: 30 },
  { id: 'v3', name: '研讨室 12F-05', building: '图书馆', open: '08:30–22:00', seats: 8 },
]

const news = [
  { id: '1', title: '图书馆延长开放通知', date: '2026-04-10', tag: '教务', summary: '工作日延长至22:30。', author: '教务处', imageUrls: [] },
]
const lostFound = [
  {
    id: 'l1',
    title: '黑色双肩包（内有学生证）',
    place: '食堂二楼靠窗座位',
    date: '2026-04-11',
    status: '寻找中',
    kind: '寻物',
    imageUrl: 'https://picsum.photos/seed/nl1/640/480',
    publisherId: '20260001',
    publisherName: '张晓雨（学生）',
  },
]
const market = [
  { id: 'm1', title: '线性代数教材（第九版）', price: 25, seller: '张同学', campus: '本部' },
]
const bookings = []
const wechatSessions = new Map()

function sanitizeUser(user) {
  const { password, ...profile } = user
  return profile
}

function createToken(user) {
  return jwt.sign({ studentId: user.studentId, role: user.role }, JWT_SECRET, { expiresIn: '2h' })
}

function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: '未登录。' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.auth = payload
    next()
  } catch {
    res.status(401).json({ message: '登录状态已失效。' })
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/auth/password-login', (req, res) => {
  const { studentId, password } = req.body || {}
  const user = users[String(studentId || '').trim()]
  if (!user || user.password !== password) return res.status(400).json({ message: '学号或密码错误。' })
  res.json({ token: createToken(user), user: sanitizeUser(user) })
})

app.post('/api/auth/bind-wechat', authRequired, (req, res) => {
  const { studentId } = req.body || {}
  const user = users[String(studentId || '').trim()]
  if (!user) return res.status(404).json({ message: '账号不存在。' })
  user.wechatBound = true
  res.json(sanitizeUser(user))
})

app.post('/api/auth/wechat/session', (req, res) => {
  const { studentId } = req.body || {}
  const user = users[String(studentId || '').trim()]
  if (!user) return res.status(404).json({ message: '未找到该学号。' })
  if (!user.wechatBound) return res.status(400).json({ message: '当前账号未绑定微信。' })
  const sessionId = `wx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const expiresAt = Date.now() + 90_000
  wechatSessions.set(sessionId, { studentId: user.studentId, expiresAt, status: 'pending' })
  res.json({ sessionId, expiresAt, qrCodeText: `WECHAT_LOGIN:${sessionId}` })
})

app.get('/api/auth/wechat/session/:id/status', (req, res) => {
  const record = wechatSessions.get(req.params.id)
  if (!record) return res.json({ status: 'expired' })
  if (Date.now() > record.expiresAt) {
    record.status = 'expired'
    wechatSessions.set(req.params.id, record)
    return res.json({ status: 'expired' })
  }
  res.json({ status: record.status })
})

app.post('/api/auth/wechat/session/:id/confirm', (req, res) => {
  const record = wechatSessions.get(req.params.id)
  if (!record || Date.now() > record.expiresAt) return res.status(400).json({ message: '二维码已过期。' })
  record.status = 'confirmed'
  const user = users[record.studentId]
  res.json({ token: createToken(user), user: sanitizeUser(user) })
})

app.get('/api/news', (_req, res) => res.json(news))
app.post('/api/news', authRequired, (req, res) => {
  const authUser = users[req.auth.studentId]
  if (!authUser || authUser.role !== 'teacher') return res.status(403).json({ message: '仅老师可发布通知。' })
  const { title, tag, summary, imageUrls = [] } = req.body || {}
  if (!title || !summary) return res.status(400).json({ message: '标题和摘要必填。' })
  const item = {
    id: `${Date.now()}`,
    title: String(title).trim(),
    tag: String(tag || '教务'),
    summary: String(summary).trim(),
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    author: authUser.name,
    date: new Date().toISOString().slice(0, 10),
  }
  news.unshift(item)
  res.status(201).json(item)
})

app.get('/api/lost-found', (req, res) => {
  let list = [...lostFound]
  const { keyword, kind } = req.query
  if (kind) {
    list = list.filter((i) => (i.kind || '寻物') === String(kind))
  }
  if (keyword) {
    const k = String(keyword)
    list = list.filter(
      (i) =>
        i.title.includes(k) ||
        i.place.includes(k) ||
        (i.publisherName && i.publisherName.includes(k)) ||
        (i.publisherId && i.publisherId.includes(k)),
    )
  }
  res.json(list)
})
app.post('/api/lost-found', authRequired, (req, res) => {
  const { title, place, status = '寻找中', imageUrl, kind: rawKind } = req.body || {}
  if (!title || !place) return res.status(400).json({ message: '物品名称和地点必填。' })
  const user = users[req.auth.studentId]
  if (!user) return res.status(401).json({ message: '账号不在用户库中，请重新登录。' })
  const kind = rawKind === '招领' ? '招领' : '寻物'
  const item = {
    id: `${Date.now()}`,
    title: String(title).trim(),
    place: String(place).trim(),
    status,
    kind,
    imageUrl,
    date: new Date().toISOString().slice(0, 10),
    publisherId: user.studentId,
    publisherName: `${user.name}（${user.role === 'teacher' ? '老师' : '学生'}）`,
  }
  lostFound.unshift(item)
  res.status(201).json(item)
})

app.get('/api/market', (_req, res) => res.json(market))
app.post('/api/market', authRequired, (req, res) => {
  const { title, price, campus = '本部' } = req.body || {}
  if (!title || Number(price) <= 0.01) return res.status(400).json({ message: '商品名称必填且价格需大于 0.01。' })
  const user = users[req.auth.studentId]
  const item = { id: `${Date.now()}`, title: String(title).trim(), price: Number(price), campus: String(campus), seller: `${user.name}（${user.role === 'teacher' ? '老师' : '学生'}）` }
  market.unshift(item)
  res.status(201).json(item)
})
app.post('/api/market/:id/buy', authRequired, (req, res) => {
  const product = market.find((m) => m.id === req.params.id)
  if (!product) return res.status(404).json({ message: '商品不存在。' })
  const buyer = users[req.auth.studentId]
  res.json({ message: `${buyer.name} 已购买「${product.title}」。` })
})

app.get('/api/venues', (_req, res) => res.json(venues))
app.get('/api/teachers', (req, res) => {
  const { venueId } = req.query
  const list = venueId
    ? teacherApprovers.filter((t) => t.managedVenueIds.includes(String(venueId)))
    : teacherApprovers
  res.json(list)
})
app.get('/api/bookings', authRequired, (req, res) => {
  res.json(bookings.filter((b) => b.ownerId === req.auth.studentId))
})
app.post('/api/bookings', authRequired, (req, res) => {
  const { venueId, teacherId, date, startTime, endTime, purpose } = req.body || {}
  if (!venueId || !teacherId || !date || !startTime || !endTime || !purpose) {
    return res.status(400).json({ message: '预约参数不完整。' })
  }
  if (!(startTime < endTime)) return res.status(400).json({ message: '开始时间需早于结束时间。' })
  const venue = venues.find((v) => v.id === venueId)
  const teacher = teacherApprovers.find((t) => t.id === teacherId)
  if (!venue || !teacher) return res.status(404).json({ message: '场馆或审批老师不存在。' })
  if (!teacher.managedVenueIds.includes(venue.id)) return res.status(400).json({ message: '老师不负责该场馆审批。' })
  const user = users[req.auth.studentId]
  const booking = {
    id: `${Date.now()}`,
    ownerId: user.studentId,
    teacherId: teacher.id,
    venueId: venue.id,
    venueName: venue.name,
    applicant: `${user.name}（${user.studentId}）`,
    date,
    startTime,
    endTime,
    purpose: String(purpose).trim(),
    managerTeacher: teacher.name,
    managerDepartment: teacher.department,
    status: '待老师审批',
  }
  bookings.unshift(booking)
  res.status(201).json(booking)
})

app.get('/api/approvals/pending', authRequired, (req, res) => {
  const user = users[req.auth.studentId]
  if (!user || user.role !== 'teacher') {
    return res.status(403).json({ message: '仅老师可查看审批列表。' })
  }
  const teacherIds = teacherApprovers
    .filter((teacher) => teacher.name === user.name)
    .map((teacher) => teacher.id)
  const list = bookings.filter(
    (booking) => teacherIds.includes(booking.teacherId) && booking.status === '待老师审批',
  )
  res.json(list)
})

app.post('/api/approvals/:id/decision', authRequired, (req, res) => {
  const user = users[req.auth.studentId]
  if (!user || user.role !== 'teacher') {
    return res.status(403).json({ message: '仅老师可处理审批。' })
  }
  const { decision } = req.body || {}
  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ message: '审批参数错误。' })
  }
  const booking = bookings.find((item) => item.id === req.params.id)
  if (!booking) return res.status(404).json({ message: '预约申请不存在。' })
  const teacher = teacherApprovers.find((item) => item.id === booking.teacherId)
  if (!teacher || teacher.name !== user.name) {
    return res.status(403).json({ message: '该申请不属于当前老师审批。' })
  }
  booking.status = decision === 'approve' ? '已通过' : '已驳回'
  res.json(booking)
})

app.listen(PORT, () => {
  console.log(`API server running: http://localhost:${PORT}`)
})
