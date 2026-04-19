import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'

const app = express()
// Default 3001 so Java + MySQL backend can own 3000 (`npm run dev:server:java`).
const PORT = Number(process.env.PORT || 3001)
const JWT_SECRET = process.env.JWT_SECRET || 'campus-demo-secret'

app.use(cors({ origin: true, credentials: true }))
// 二手/失物等聊天用 JSON 内嵌 data:image base64，默认 100kb 会触发 HTTP 413
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '25mb' }))

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
  {
    id: 'm1',
    title: '线性代数教材（第九版）',
    price: 25,
    seller: '张晓雨（学生）',
    sellerId: '20260001',
    campus: '本部',
  },
]
/** 与 Java `MarketChatMessage` 对齐的内存表（仅 Node 演示服务使用） */
let nextMarketChatMessageId = 1
const marketChatMessages = []
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

function userFromAuth(req) {
  return users[req.auth?.studentId]
}

function findUserByStudentId(id) {
  return users[String(id || '').trim()]
}

function findFirstUserByName(name) {
  const n = String(name || '').trim()
  if (!n) return null
  for (const u of Object.values(users)) {
    if (u.name === n) return u
  }
  return null
}

function resolvePeerId(peerId, peerName) {
  if (peerId != null && String(peerId).trim()) {
    const u = findUserByStudentId(peerId)
    if (!u) {
      const err = new Error('对方账号不存在。')
      err.status = 404
      throw err
    }
    return u.studentId
  }
  let name = String(peerName || '').trim()
  if (name.endsWith('（老师）') || name.endsWith('（学生）')) {
    name = name.slice(0, -4)
  }
  if (!name) {
    const err = new Error('缺少联系对象。')
    err.status = 400
    throw err
  }
  const u = findFirstUserByName(name)
  if (!u) {
    const err = new Error('未找到对应卖家账号。')
    err.status = 404
    throw err
  }
  return u.studentId
}

function findMarketProduct(id) {
  return market.find((m) => String(m.id) === String(id))
}

function resolveMarketPeerId(item, meId, peerId, peerName) {
  if (peerId != null && String(peerId).trim()) {
    return resolvePeerId(peerId, peerName)
  }
  if (item.sellerId && String(item.sellerId).trim() && item.sellerId !== meId) {
    return item.sellerId
  }
  return resolvePeerId(peerId, peerName)
}

function listMarketConversationRows(itemId, a, b) {
  return marketChatMessages
    .filter(
      (m) =>
        String(m.itemId) === String(itemId) &&
        ((m.fromId === a && m.toId === b) || (m.fromId === b && m.toId === a)),
    )
    .sort((x, y) => x.id - y.id)
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

/** 顶栏未读轮询会请求失物会话列表；Node 演示栈若无失物聊天则返回空数组，避免拖垮整次刷新 */
app.get('/api/lost-found/chat/sessions', authRequired, (_req, res) => res.json([]))

app.get('/api/market', (_req, res) => res.json(market))
app.post('/api/market', authRequired, (req, res) => {
  const { title, price, campus = '本部' } = req.body || {}
  if (!title || Number(price) <= 0.01) return res.status(400).json({ message: '商品名称必填且价格需大于 0.01。' })
  const user = users[req.auth.studentId]
  const item = {
    id: `${Date.now()}`,
    title: String(title).trim(),
    price: Number(price),
    campus: String(campus),
    seller: `${user.name}（${user.role === 'teacher' ? '老师' : '学生'}）`,
    sellerId: user.studentId,
  }
  market.unshift(item)
  res.status(201).json(item)
})
app.post('/api/market/:id/buy', authRequired, (req, res) => {
  const product = market.find((m) => m.id === req.params.id)
  if (!product) return res.status(404).json({ message: '商品不存在。' })
  const buyer = users[req.auth.studentId]
  res.json({ message: `${buyer.name} 已购买「${product.title}」。` })
})

app.get('/api/market/chat/sessions', authRequired, (req, res) => {
  try {
    const me = userFromAuth(req)
    if (!me) return res.status(401).json({ message: '登录状态失效。' })
    const all = marketChatMessages
      .filter((m) => m.fromId === me.studentId || m.toId === me.studentId)
      .sort((a, b) => b.id - a.id)
    const sessions = new Map()
    for (const m of all) {
      const peerId = m.fromId === me.studentId ? m.toId : m.fromId
      const key = `${m.itemId}:${peerId}`
      let s = sessions.get(key)
      if (!s) {
        const peerUser = findUserByStudentId(peerId)
        const peerName = peerUser ? peerUser.name : peerId
        const prod = findMarketProduct(m.itemId)
        const itemTitle = prod ? prod.title : '商品已下架'
        const unread = m.toId === me.studentId && !m.readFlag ? 1 : 0
        s = {
          itemId: m.itemId,
          peerId,
          peerName,
          itemTitle,
          lastContent: m.messageType === 'image' ? '[图片]' : m.content,
          lastAt: m.createdAt,
          unread,
        }
        sessions.set(key, s)
      } else if (m.toId === me.studentId && !m.readFlag) {
        s.unread += 1
      }
    }
    res.json([...sessions.values()])
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || '加载会话失败。' })
  }
})

app.get('/api/market/:id/chat', authRequired, (req, res) => {
  try {
    const me = userFromAuth(req)
    if (!me) return res.status(401).json({ message: '登录状态失效。' })
    const item = findMarketProduct(req.params.id)
    if (!item) return res.status(404).json({ message: '商品不存在。' })
    const peerId = req.query.peerId
    const peerName = req.query.peerName
    const otherId = resolveMarketPeerId(item, me.studentId, peerId, peerName)
    if (otherId === me.studentId) {
      return res.status(400).json({ message: '不能和自己聊天。' })
    }
    const list = listMarketConversationRows(item.id, me.studentId, otherId)
    for (const m of list) {
      if (m.toId === me.studentId && !m.readFlag) m.readFlag = true
    }
    res.json(
      list.map((m) => ({
        id: m.id,
        itemId: m.itemId,
        fromId: m.fromId,
        toId: m.toId,
        content: m.content,
        createdAt: m.createdAt,
        read: m.readFlag,
        type: m.messageType,
        deleted: m.deletedFlag,
      })),
    )
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || '加载消息失败。' })
  }
})

app.post('/api/market/:id/chat', authRequired, (req, res) => {
  try {
    const me = userFromAuth(req)
    if (!me) return res.status(401).json({ message: '登录状态失效。' })
    const item = findMarketProduct(req.params.id)
    if (!item) return res.status(404).json({ message: '商品不存在。' })
    const body = req.body || {}
    const otherId = resolveMarketPeerId(item, me.studentId, body.peerId, body.peerName)
    if (otherId === me.studentId) {
      return res.status(400).json({ message: '不能和自己聊天。' })
    }
    const type = String(body.type || 'text').trim()
    if (type !== 'text' && type !== 'image') {
      return res.status(400).json({ message: '消息类型不支持。' })
    }
    const text = String(body.content || '').trim()
    if (!text) return res.status(400).json({ message: '消息不能为空。' })
    if (type === 'image' && !text.startsWith('data:image/')) {
      return res.status(400).json({ message: '图片消息格式非法。' })
    }
    const createdAt = new Date().toISOString()
    const msg = {
      id: nextMarketChatMessageId++,
      itemId: item.id,
      fromId: me.studentId,
      toId: otherId,
      content: text,
      createdAt,
      readFlag: false,
      messageType: type,
      deletedFlag: false,
    }
    marketChatMessages.push(msg)
    res.status(201).json({
      id: msg.id,
      itemId: msg.itemId,
      fromId: msg.fromId,
      toId: msg.toId,
      content: msg.content,
      createdAt: msg.createdAt,
      read: msg.readFlag,
      type: msg.messageType,
      deleted: msg.deletedFlag,
    })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || '发送失败。' })
  }
})

app.post('/api/market/chat/:messageId/revoke', authRequired, (req, res) => {
  try {
    const me = userFromAuth(req)
    if (!me) return res.status(401).json({ message: '登录状态失效。' })
    const mid = Number(req.params.messageId)
    const msg = marketChatMessages.find((m) => m.id === mid)
    if (!msg) return res.status(404).json({ message: '消息不存在。' })
    if (msg.fromId !== me.studentId) {
      return res.status(403).json({ message: '只能撤回自己发送的消息。' })
    }
    if (msg.deletedFlag) {
      return res.json({ ok: true, already: true })
    }
    const sentAt = new Date(msg.createdAt).getTime()
    if (Number.isNaN(sentAt) || Date.now() - sentAt > 2 * 60 * 1000) {
      return res.status(400).json({ message: '仅支持发送后 2 分钟内撤回。' })
    }
    msg.deletedFlag = true
    msg.content = '你撤回了一条消息'
    msg.messageType = 'text'
    res.json({ ok: true })
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || '撤回失败。' })
  }
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

/** 与 Java `CampusFaqBot` 对齐的本地指引（未接大模型时使用） */
const FAQ_DEFAULT =
  '我是校园综合服务平台助手。你可以问我：通知公告、失物招领、二手市集、场馆预约、登录与个人中心等问题。' +
  '\n\n顶部导航可进入各模块：「通知公告」「失物招领」「二手市集」「场馆预约」「AI 服务助手」「个人中心」。' +
  '\n学生可预约场馆并等待老师审批；老师账号可在「老师审批」中处理预约。' +
  '\n登录支持学号密码或微信扫码（需先绑定微信）。'

function containsAny(text, keys) {
  return keys.some((k) => text.includes(k))
}

function campusFaqReply(question) {
  const q = String(question || '').trim()
  if (!q) {
    return '请输入你的问题，例如：怎么发布通知、如何预约场馆、二手怎么卖等。'
  }
  const low = q.toLowerCase()

  if (containsAny(q, ['通知', '公告', '教务', '发布通知', '新闻'])) {
    return (
      '【通知公告】在顶部进入「通知公告」可浏览全校通知。' +
      '\n老师登录后可通过「发布通知」撰写标题、摘要与标签；学生仅可查看。' +
      '\n首页「近期动态」为展示示例，完整列表请以通知页为准。'
    )
  }
  if (containsAny(q, ['失物', '招领', '丢', '捡', '寻物'])) {
    return (
      '【失物招领】进入「失物招领」浏览信息；登录后在「发布失物」填写物品、地点与状态（如寻找中）。' +
      '\n建议描述清晰，便于同学认领。'
    )
  }
  if (containsAny(q, ['二手', '市集', '卖', '买', '出售', '商品', '教材'])) {
    return (
      '【二手市集】登录后点「我要出售」填写商品名、价格与校区；在列表中可浏览他人商品并「立即购买」（演示为下单提示）。' +
      '\n交易请自行线下沟通，注意安全。'
    )
  }
  if (containsAny(q, ['预约', '场馆', '报告厅', '活动室', '舞蹈', '研讨室', '时间段', '审批'])) {
    return (
      '【场馆预约】在「场馆预约」中选择场馆、负责审批的老师、使用日期与起止时间，并填写用途后提交。' +
      '\n申请状态为「待老师审批」时，请等待对应老师处理；通过或驳回后状态会更新。' +
      '\n开始时间必须早于结束时间。'
    )
  }
  if (containsAny(q, ['老师审批', '通过', '驳回', '待审批']) && containsAny(q, ['老师', '审批', '通过', '驳回'])) {
    return (
      '【老师审批】使用老师账号（如教务账号）登录后，顶部会出现「老师审批」。' +
      '\n在列表中可查看待处理预约，选择「通过」或「驳回」。'
    )
  }
  if (containsAny(q, ['登录', '密码', '学号', '微信', '扫码', '绑定'])) {
    return (
      '【登录与账号】在「登录 / 统一认证」页可使用学号+密码登录。' +
      '\n微信扫码需该学号已绑定微信；未绑定可登录后在「个人中心」操作绑定。' +
      '\n演示学生：20260001 / 123456；老师：T2026001 / 888888。'
    )
  }
  if (containsAny(q, ['个人中心', '资料', '退出'])) {
    return '【个人中心】登录后可在顶部进入，查看姓名、院系、身份与微信绑定状态，并可退出当前账号。'
  }
  if (containsAny(q, ['ai', '助手', '机器人', '你好', '您好']) || q.length <= 4) {
    return (
      '你好！我是校园服务助手，可解答本平台内通知、失物、二手、预约与登录等问题。' +
      '\n试着问：「怎么预约场馆？」「老师怎么审批？」'
    )
  }
  if (containsAny(low, ['help', 'how', 'what'])) {
    return `${FAQ_DEFAULT}\n\nYou can also ask in Chinese about 通知、失物、二手、预约、登录。`
  }

  return FAQ_DEFAULT
}

app.get('/api/ai/status', (_req, res) => {
  res.json({ mode: 'campus-faq', model: 'local' })
})

app.post('/api/ai/chat', (req, res) => {
  const message = String((req.body && req.body.message) || '').trim()
  if (!message) {
    return res.status(400).json({ message: '消息不能为空。' })
  }
  if (message.length > 8000) {
    return res.status(400).json({ message: '消息过长，请缩短后再试。' })
  }
  res.json({ reply: campusFaqReply(message) })
})

app.listen(PORT, () => {
  console.log(`API server running: http://localhost:${PORT}`)
})
