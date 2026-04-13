export type NewsItem = {
  id: string
  title: string
  date: string
  tag: string
  summary: string
}

export type LostItem = {
  id: string
  title: string
  place: string
  date: string
  status: '寻找中' | '已认领'
}

export type MarketItem = {
  id: string
  title: string
  price: number
  seller: string
  campus: string
}

export type VenueSlot = {
  id: string
  name: string
  building: string
  open: string
  seats: number
  managerTeacher: string
  managerDepartment: string
}

export type TeacherApprover = {
  id: string
  name: string
  department: string
  managedVenueIds: string[]
}

export type ClubItem = {
  id: string
  name: string
  category: string
  president: string
  recruitStatus: '招新中' | '已截止'
}

export type ActivityItem = {
  id: string
  title: string
  organizer: string
  time: string
  quota: number
}

export type RepairItem = {
  id: string
  title: string
  location: string
  status: '待处理' | '处理中' | '已完成'
}

export const newsItems: NewsItem[] = [
  {
    id: '1',
    title: '关于2026年春季学期图书馆延长开放时间的通知',
    date: '2026-04-10',
    tag: '教务',
    summary: '自习区与借阅区在工作日延长至22:30，周末照常开放。',
  },
  {
    id: '2',
    title: '校园网维护窗口：4月15日凌晨1:00–3:00',
    date: '2026-04-08',
    tag: '信息化',
    summary: '维护期间部分楼宇有线网络可能短时中断，无线网不受影响。',
  },
  {
    id: '3',
    title: '心理健康周活动报名开启',
    date: '2026-04-06',
    tag: '学工',
    summary: '讲座、团体辅导与一对一咨询名额有限，请通过本平台预约。',
  },
]

export const lostItems: LostItem[] = [
  {
    id: 'l1',
    title: '黑色双肩包（内有学生证）',
    place: '食堂二楼靠窗座位',
    date: '2026-04-11',
    status: '寻找中',
  },
  {
    id: 'l2',
    title: 'AirPods 充电盒',
    place: '图书馆三楼东区',
    date: '2026-04-09',
    status: '寻找中',
  },
  {
    id: 'l3',
    title: '蓝色雨伞',
    place: '教学楼B座门口',
    date: '2026-04-05',
    status: '已认领',
  },
]

export const marketItems: MarketItem[] = [
  {
    id: 'm1',
    title: '线性代数教材（第九版，少量笔记）',
    price: 25,
    seller: '张同学',
    campus: '本部',
  },
  {
    id: 'm2',
    title: '台灯 LED 可调光',
    price: 40,
    seller: '李同学',
    campus: '本部',
  },
  {
    id: 'm3',
    title: '自行车 26 寸 带锁',
    price: 180,
    seller: '王同学',
    campus: '东校区',
  },
]

export const venues: VenueSlot[] = [
  {
    id: 'v1',
    name: '报告厅 A101',
    building: '活动中心',
    open: '08:00–21:00',
    seats: 200,
    managerTeacher: '陈老师',
    managerDepartment: '活动中心管理办公室',
  },
  {
    id: 'v2',
    name: '舞蹈练习室 3',
    building: '体育馆副楼',
    open: '09:00–20:00',
    seats: 30,
    managerTeacher: '赵老师',
    managerDepartment: '体育部场馆管理组',
  },
  {
    id: 'v3',
    name: '研讨室 12F-05',
    building: '图书馆',
    open: '08:30–22:00',
    seats: 8,
    managerTeacher: '林老师',
    managerDepartment: '图书馆运行管理中心',
  },
]

export const teacherApprovers: TeacherApprover[] = [
  {
    id: 't1',
    name: '陈老师',
    department: '活动中心管理办公室',
    managedVenueIds: ['v1'],
  },
  {
    id: 't2',
    name: '赵老师',
    department: '体育部场馆管理组',
    managedVenueIds: ['v2'],
  },
  {
    id: 't3',
    name: '林老师',
    department: '图书馆运行管理中心',
    managedVenueIds: ['v3'],
  },
  {
    id: 't4',
    name: '王老师',
    department: '活动中心管理办公室',
    managedVenueIds: ['v1', 'v2'],
  },
]

export const clubs: ClubItem[] = [
  {
    id: 'c1',
    name: '程序设计协会',
    category: '学术科技',
    president: '周同学',
    recruitStatus: '招新中',
  },
  {
    id: 'c2',
    name: '青年志愿者协会',
    category: '公益服务',
    president: '陈同学',
    recruitStatus: '招新中',
  },
  {
    id: 'c3',
    name: '摄影社',
    category: '文体艺术',
    president: '林同学',
    recruitStatus: '已截止',
  },
]

export const activities: ActivityItem[] = [
  {
    id: 'a1',
    title: '春季校园歌手报名',
    organizer: '学生会文艺部',
    time: '2026-04-18 19:00',
    quota: 80,
  },
  {
    id: 'a2',
    title: 'AI 应用工作坊',
    organizer: '程序设计协会',
    time: '2026-04-20 14:30',
    quota: 60,
  },
  {
    id: 'a3',
    title: '无偿献血志愿者招募',
    organizer: '青年志愿者协会',
    time: '2026-04-22 09:00',
    quota: 120,
  },
]

export const repairs: RepairItem[] = [
  {
    id: 'r1',
    title: '宿舍 3 号楼热水器故障',
    location: '学生宿舍 3 号楼 402',
    status: '处理中',
  },
  {
    id: 'r2',
    title: '图书馆五楼照明损坏',
    location: '图书馆五楼西区',
    status: '待处理',
  },
  {
    id: 'r3',
    title: '教学楼 A 区投影仪异常',
    location: '教学楼 A203',
    status: '已完成',
  },
]
