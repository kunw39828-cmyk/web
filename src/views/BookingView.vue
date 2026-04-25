<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { apiRequest } from '../api/client'
import { useAuthStore } from '../stores/auth'

type RequestStatus = '待老师审批' | '已通过' | '已驳回'
type BookingRequest = {
  id: string | number
  venueName: string
  applicant: string
  date: string
  startTime: string
  endTime: string
  purpose: string
  managerTeacher: string
  managerDepartment: string
  status: RequestStatus
}
type PendingApproval = BookingRequest

type Venue = { id: string; name: string; building: string; open: string; seats: number }
type Teacher = { id: string; name: string; department: string; managedVenueIds: string[] }

/** 与参考稿一致：10 个连续时段（小时） */
const SLOT_TIMES = [
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:00', end: '18:00' },
  { start: '18:00', end: '19:00' },
] as const

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

function formatYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function venueThumb(id: string) {
  return `https://picsum.photos/seed/venue-${id}/200/120`
}

const auth = useAuthStore()
const venues = ref<Venue[]>([])
const teachers = ref<Teacher[]>([])
const teacherMode = ref<'byVenue' | 'all'>('byVenue')
const loadingTeachers = ref(false)
const selectedVenueId = ref('')
const selectedTeacherId = ref('')
const date = ref('')
const startTime = ref('')
const endTime = ref('')
const purpose = ref('')
const notice = ref('')
const requests = ref<BookingRequest[]>([])
const pendingApprovals = ref<PendingApproval[]>([])
const approvingId = ref<string | number | null>(null)
const calendarMonth = ref(new Date())
/** 第一次点击时段锚点；第二次点击与锚点组成区间（含端点） */
const slotAnchor = ref<number | null>(null)
const slotFrom = ref(1)
const slotTo = ref(1)

const selectedVenue = computed(() => venues.value.find((v) => v.id === selectedVenueId.value))
const venueTeachers = computed(() => teachers.value)
const selectedTeacher = computed(() => venueTeachers.value.find((t) => t.id === selectedTeacherId.value))

const todayStr = computed(() => formatYMD(new Date()))

const calendarTitle = computed(() => {
  const d = calendarMonth.value
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
})

const calendarWeeks = computed(() => {
  const y = calendarMonth.value.getFullYear()
  const m = calendarMonth.value.getMonth()
  const first = new Date(y, m, 1)
  const startWeekday = (first.getDay() + 6) % 7
  const dim = new Date(y, m + 1, 0).getDate()
  const cells: { label: number | null; dateStr: string | null; muted: boolean }[] = []
  for (let i = 0; i < startWeekday; i++) cells.push({ label: null, dateStr: null, muted: true })
  for (let day = 1; day <= dim; day++) {
    const dt = new Date(y, m, day)
    cells.push({ label: day, dateStr: formatYMD(dt), muted: false })
  }
  while (cells.length % 7 !== 0) cells.push({ label: null, dateStr: null, muted: true })
  const weeks: (typeof cells)[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
})

function isPastDate(dateStr: string) {
  return dateStr < todayStr.value
}

function selectCalendarDay(dateStr: string | null) {
  if (!dateStr || isPastDate(dateStr)) return
  date.value = dateStr
}

function prevMonth() {
  const d = calendarMonth.value
  calendarMonth.value = new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

function nextMonth() {
  const d = calendarMonth.value
  calendarMonth.value = new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

function applySlotRange(from: number, to: number) {
  const a = Math.min(from, to)
  const b = Math.max(from, to)
  slotFrom.value = a
  slotTo.value = b
  startTime.value = SLOT_TIMES[a - 1].start
  endTime.value = SLOT_TIMES[b - 1].end
}

function onSlotClick(n: number) {
  if (slotAnchor.value === null) {
    slotAnchor.value = n
    applySlotRange(n, n)
    return
  }
  applySlotRange(slotAnchor.value, n)
  slotAnchor.value = null
}

function slotInRange(n: number) {
  return n >= slotFrom.value && n <= slotTo.value
}

function clearSlots() {
  slotAnchor.value = null
  slotFrom.value = 1
  slotTo.value = 1
  startTime.value = SLOT_TIMES[0].start
  endTime.value = SLOT_TIMES[0].end
}

function selectVenue(id: string) {
  selectedVenueId.value = id
}

function scrollToMyBookings() {
  document.getElementById('booking-requests')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const isTeacher = computed(() => auth.user?.role === 'teacher')

async function loadPendingApprovals() {
  if (!auth.isAuthenticated || !isTeacher.value) {
    pendingApprovals.value = []
    return
  }
  pendingApprovals.value = await apiRequest('/approvals/pending', {
    headers: { Authorization: `Bearer ${auth.token}` },
  })
}

async function decideApproval(id: string | number, decision: 'approve' | 'reject') {
  approvingId.value = id
  try {
    await apiRequest(`/approvals/${id}/decision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ decision }),
    })
    pendingApprovals.value = pendingApprovals.value.filter((item) => String(item.id) !== String(id))
    notice.value = decision === 'approve' ? '已通过该预约申请。' : '已驳回该预约申请。'
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '审批操作失败。'
  } finally {
    approvingId.value = null
  }
}

watch(venueTeachers, (list) => {
  selectedTeacherId.value = list[0]?.id ?? ''
}, { immediate: true })

async function loadTeachers() {
  loadingTeachers.value = true
  try {
    if (teacherMode.value === 'all') {
      teachers.value = await apiRequest('/teachers')
    } else if (selectedVenueId.value) {
      teachers.value = await apiRequest(`/teachers?venueId=${selectedVenueId.value}`)
    } else {
      teachers.value = []
    }
  } finally {
    loadingTeachers.value = false
  }
}

watch(selectedVenueId, () => {
  loadTeachers().catch((error) => {
    notice.value = error instanceof Error ? error.message : '加载老师失败。'
  })
}, { immediate: true })

watch(teacherMode, () => {
  loadTeachers().catch((error) => {
    notice.value = error instanceof Error ? error.message : '加载老师失败。'
  })
})

onMounted(async () => {
  venues.value = await apiRequest('/venues')
  selectedVenueId.value = venues.value[0]?.id || ''
  date.value = todayStr.value
  applySlotRange(2, 4)
  slotAnchor.value = null
  await loadTeachers()
  if (auth.isAuthenticated) {
    requests.value = await apiRequest('/bookings', {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    await loadPendingApprovals()
  }
})

async function submit() {
  if (!auth.user) return (notice.value = '请先登录后再提交预约申请。')
  if (!selectedVenue.value || !selectedTeacher.value) return (notice.value = '请选择场馆和审批老师。')
  if (!date.value) return (notice.value = '请选择使用日期。')
  if (!startTime.value || !endTime.value) return (notice.value = '请选择时段。')
  if (!(startTime.value < endTime.value)) return (notice.value = '开始时间需早于结束时间。')
  if (purpose.value.trim().length < 2) return (notice.value = '请填写用途（至少 2 个字）。')

  try {
    const created = await apiRequest('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({
        venueId: selectedVenue.value.id,
        teacherId: selectedTeacher.value.id,
        date: date.value,
        startTime: startTime.value,
        endTime: endTime.value,
        purpose: purpose.value.trim(),
      }),
    })
    requests.value.unshift(created)
    notice.value = `申请已提交，已发送给 ${selectedTeacher.value.name}（${selectedTeacher.value.department}）审批。`
    date.value = todayStr.value
    applySlotRange(2, 4)
    slotAnchor.value = null
    purpose.value = ''
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '提交失败。'
  }
}
</script>

<template>
  <div class="page booking-page">
    <div class="booking-shell">
      <div class="booking-card">
        <div class="booking-card__left">
          <h1 class="booking-card__title">场馆预约</h1>
          <p class="booking-card__lead">选择日期与时段，填写用途后提交审批老师审核。</p>

          <div class="booking-field">
            <span class="booking-label">选择日期</span>
            <input v-model="date" type="date" class="booking-date-input" />
          </div>

          <div class="booking-calendar">
            <div class="booking-calendar__head">
              <button type="button" class="booking-cal-nav" aria-label="上月" @click="prevMonth">‹</button>
              <span class="booking-calendar__title">{{ calendarTitle }}</span>
              <button type="button" class="booking-cal-nav" aria-label="下月" @click="nextMonth">›</button>
            </div>
            <div class="booking-calendar__weekdays">
              <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
            </div>
            <div class="booking-calendar__grid">
              <div v-for="(week, wi) in calendarWeeks" :key="wi" class="booking-calendar__row">
                <button
                  v-for="(cell, ci) in week"
                  :key="ci"
                  type="button"
                  class="booking-cal-cell"
                  :class="{
                    'booking-cal-cell--muted': cell.muted,
                    'booking-cal-cell--pick': cell.dateStr && date === cell.dateStr,
                    'booking-cal-cell--disabled': cell.dateStr && isPastDate(cell.dateStr),
                  }"
                  :disabled="!cell.dateStr || isPastDate(cell.dateStr!)"
                  @click="selectCalendarDay(cell.dateStr)"
                >
                  {{ cell.label ?? '' }}
                </button>
              </div>
            </div>
          </div>

          <div class="booking-field booking-field--slots">
            <div class="booking-slots-head">
              <span class="booking-label">时间</span>
              <button type="button" class="booking-slots-clear" @click="clearSlots">重置时段</button>
            </div>
            <p class="booking-slots-hint">先点一个时段为起点，再点另一个为终点（含中间全部时段）。</p>
            <div class="booking-slots">
              <button
                v-for="n in 10"
                :key="n"
                type="button"
                class="booking-slot"
                :class="{ 'booking-slot--on': slotInRange(n) }"
                @click="onSlotClick(n)"
              >
                <span class="booking-slot__dot" />
                <span class="booking-slot__num">{{ n }}</span>
              </button>
            </div>
          </div>

          <div class="booking-extras">
            <label class="booking-line">
              <span>老师来源</span>
              <select v-model="teacherMode" class="booking-select">
                <option value="byVenue">按场馆筛选</option>
                <option value="all">全部老师</option>
              </select>
            </label>
            <label class="booking-line">
              <span>审批老师</span>
              <select v-model="selectedTeacherId" class="booking-select" :disabled="loadingTeachers">
                <option v-for="t in venueTeachers" :key="t.id" :value="t.id">{{ t.name }}（{{ t.department }}）</option>
              </select>
            </label>
            <label class="booking-line booking-line--full">
              <span>使用用途</span>
              <textarea v-model="purpose" rows="2" class="booking-textarea" placeholder="如：社团例会、讲座彩排…" />
            </label>
            <button type="button" class="booking-refresh-teachers" :disabled="loadingTeachers" @click="loadTeachers">
              刷新老师列表
            </button>
          </div>

          <div class="booking-actions">
            <button type="button" class="booking-btn booking-btn--primary" :disabled="!auth.user" @click="submit">立即预约</button>
            <button type="button" class="booking-btn booking-btn--secondary" @click="scrollToMyBookings">我的预约</button>
          </div>

          <p v-if="notice" class="booking-notice">{{ notice }}</p>
        </div>

        <aside class="booking-card__right">
          <h2 class="booking-aside-title">可选场馆</h2>
          <p class="booking-aside-sub">点击卡片选择，左侧将用于提交。</p>
          <ul class="booking-venue-list">
            <li v-for="v in venues" :key="v.id">
              <button
                type="button"
                class="booking-venue-card"
                :class="{ 'booking-venue-card--on': v.id === selectedVenueId }"
                @click="selectVenue(v.id)"
              >
                <div class="booking-venue-card__img-wrap">
                  <img :src="venueThumb(v.id)" :alt="v.name" class="booking-venue-card__img" loading="lazy" />
                </div>
                <div class="booking-venue-card__body">
                  <strong class="booking-venue-card__name">{{ v.name }}</strong>
                  <p class="booking-venue-card__meta">{{ v.building }} · 开放 {{ v.open }}</p>
                  <p class="booking-venue-card__meta">可容纳约 {{ v.seats }} 人</p>
                </div>
              </button>
            </li>
          </ul>
        </aside>
      </div>

      <section id="booking-requests" class="booking-requests-panel">
        <div class="booking-requests-panel__head">
          <h2>我的预约申请</h2>
        </div>
        <p v-if="requests.length === 0" class="booking-requests-empty">暂无申请记录。</p>
        <ul v-else class="booking-requests-list">
          <li v-for="r in requests" :key="r.id">
            <article class="booking-request-item">
              <div class="booking-request-item__top">
                <span class="booking-request-item__venue">{{ r.venueName }}</span>
                <span class="booking-request-item__status">{{ r.status }}</span>
              </div>
              <p>使用时间：{{ r.date }} {{ r.startTime }} - {{ r.endTime }}</p>
              <p>用途：{{ r.purpose }}</p>
              <p class="booking-request-item__muted">审批老师：{{ r.managerTeacher }}（{{ r.managerDepartment }}）</p>
            </article>
          </li>
        </ul>
      </section>

      <section v-if="isTeacher" class="booking-requests-panel">
        <div class="booking-requests-panel__head booking-requests-panel__head--actions">
          <h2>待我审批</h2>
          <button type="button" class="booking-refresh-teachers" @click="loadPendingApprovals">刷新列表</button>
        </div>
        <p v-if="pendingApprovals.length === 0" class="booking-requests-empty">当前没有待审批申请。</p>
        <ul v-else class="booking-requests-list">
          <li v-for="r in pendingApprovals" :key="`approval-${r.id}`">
            <article class="booking-request-item">
              <div class="booking-request-item__top">
                <span class="booking-request-item__venue">{{ r.venueName }}</span>
                <span class="booking-request-item__status">{{ r.status }}</span>
              </div>
              <p>申请人：{{ r.applicant }}</p>
              <p>使用时间：{{ r.date }} {{ r.startTime }} - {{ r.endTime }}</p>
              <p>用途：{{ r.purpose }}</p>
              <p class="booking-request-item__muted">审批老师：{{ r.managerTeacher }}（{{ r.managerDepartment }}）</p>
              <div class="booking-approval-actions">
                <button
                  type="button"
                  class="booking-btn booking-btn--primary booking-btn--tiny"
                  :disabled="approvingId === r.id"
                  @click="decideApproval(r.id, 'approve')"
                >
                  通过
                </button>
                <button
                  type="button"
                  class="booking-btn booking-btn--secondary booking-btn--tiny"
                  :disabled="approvingId === r.id"
                  @click="decideApproval(r.id, 'reject')"
                >
                  驳回
                </button>
              </div>
            </article>
          </li>
        </ul>
      </section>
    </div>

    <footer class="booking-page__footer" aria-hidden="true" />
  </div>
</template>

<style scoped>
.booking-page {
  --booking-blue: #1c4b8c;
  --booking-blue-light: #3b7dd6;
  --booking-blue-soft: #e8f1fc;
  --booking-card-radius: 18px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 20px 16px 48px;
  min-height: calc(100vh - 80px);
  background: linear-gradient(180deg, #e9f2fb 0%, #f4f7fb 38%, #dfe9f5 100%);
}

.booking-shell {
  max-width: 1040px;
  margin: 0 auto;
}

.booking-card {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(260px, 0.95fr);
  gap: 0;
  background: #fff;
  border-radius: var(--booking-card-radius);
  box-shadow:
    0 24px 48px rgba(28, 75, 140, 0.12),
    0 2px 0 rgba(255, 255, 255, 0.9) inset;
  border: 1px solid rgba(180, 205, 235, 0.85);
  overflow: hidden;
}

.booking-card__left {
  padding: 28px 26px 32px;
  border-right: 1px solid rgba(210, 225, 242, 0.95);
}

.booking-card__right {
  padding: 24px 20px 28px;
  background: linear-gradient(180deg, #fafcfe 0%, #f3f7fc 100%);
}

.booking-card__title {
  margin: 0 0 8px;
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--booking-blue);
}

.booking-card__lead {
  margin: 0 0 22px;
  font-size: 0.9rem;
  color: #5a6f86;
  line-height: 1.5;
  max-width: 36ch;
}

.booking-field {
  margin-bottom: 16px;
}

.booking-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--booking-blue);
  margin-bottom: 8px;
}

.booking-date-input {
  width: 100%;
  max-width: 220px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(160, 190, 225, 0.95);
  font: inherit;
  background: #fff;
  color: var(--text, #1e293b);
}

.booking-calendar {
  margin-bottom: 20px;
  padding: 14px 12px 16px;
  background: var(--booking-blue-soft);
  border-radius: 14px;
  border: 1px solid rgba(170, 200, 235, 0.5);
}

.booking-calendar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.booking-calendar__title {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--booking-blue);
}

.booking-cal-nav {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(140, 175, 220, 0.75);
  background: #fff;
  color: var(--booking-blue);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.booking-cal-nav:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--booking-blue-light);
}

.booking-calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #647896;
  text-align: center;
}

.booking-calendar__grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.booking-calendar__row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.booking-cal-cell {
  aspect-ratio: 1;
  max-height: 40px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.booking-cal-cell--muted {
  visibility: hidden;
  pointer-events: none;
}

.booking-cal-cell--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.booking-cal-cell:hover:not(:disabled):not(.booking-cal-cell--muted) {
  background: rgba(255, 255, 255, 0.85);
}

.booking-cal-cell--pick {
  background: var(--booking-blue) !important;
  color: #fff !important;
  border-color: var(--booking-blue);
}

.booking-field--slots {
  margin-bottom: 18px;
}

.booking-slots-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.booking-slots-head .booking-label {
  margin-bottom: 0;
}

.booking-slots-clear {
  border: none;
  background: none;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--booking-blue-light);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.booking-slots-hint {
  margin: 0 0 10px;
  font-size: 0.75rem;
  color: #6b7c93;
}

.booking-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: flex-end;
}

.booking-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 36px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
}

.booking-slot__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
  transition: background 0.15s ease, transform 0.15s ease;
}

.booking-slot--on .booking-slot__dot {
  background: var(--booking-blue);
  transform: scale(1.15);
}

.booking-slot__num {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.booking-slot--on .booking-slot__num {
  color: var(--booking-blue);
}

.booking-extras {
  padding-top: 16px;
  margin-bottom: 20px;
  border-top: 1px dashed rgba(160, 185, 215, 0.75);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.booking-line {
  display: grid;
  grid-template-columns: 88px 1fr;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  color: #475569;
}

.booking-line--full {
  grid-template-columns: 1fr;
  align-items: start;
}

.booking-line--full span {
  margin-bottom: 6px;
  display: block;
  font-weight: 700;
  color: var(--booking-blue);
}

.booking-select,
.booking-textarea {
  width: 100%;
  padding: 9px 11px;
  border-radius: 10px;
  border: 1px solid rgba(160, 190, 225, 0.95);
  font: inherit;
  background: #fff;
}

.booking-textarea {
  resize: vertical;
  min-height: 52px;
}

.booking-refresh-teachers {
  align-self: flex-start;
  padding: 6px 12px;
  font-size: 0.78rem;
  border-radius: 8px;
  border: 1px solid rgba(160, 190, 225, 0.9);
  background: #fff;
  color: var(--booking-blue);
  cursor: pointer;
}

.booking-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.booking-btn {
  padding: 12px 26px;
  border-radius: 12px;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: filter 0.15s ease, transform 0.1s ease;
}

.booking-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.booking-btn--primary {
  background: linear-gradient(180deg, var(--booking-blue-light) 0%, var(--booking-blue) 100%);
  color: #fff;
  box-shadow: 0 10px 24px rgba(28, 75, 140, 0.28);
}

.booking-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.booking-btn--secondary {
  background: #dbeafe;
  color: var(--booking-blue);
  border: 1px solid rgba(120, 165, 220, 0.55);
}

.booking-notice {
  margin: 16px 0 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #b45309;
  background: #fffbeb;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #fde68a;
}

.booking-aside-title {
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--booking-blue);
}

.booking-aside-sub {
  margin: 0 0 16px;
  font-size: 0.78rem;
  color: #647896;
}

.booking-venue-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.booking-venue-card {
  display: flex;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(180, 205, 235, 0.85);
  background: #fff;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.booking-venue-card:hover {
  border-color: var(--booking-blue-light);
  box-shadow: 0 8px 20px rgba(28, 75, 140, 0.08);
}

.booking-venue-card--on {
  border-color: var(--booking-blue);
  box-shadow: 0 0 0 2px rgba(28, 75, 140, 0.12);
  background: linear-gradient(135deg, #fff 0%, #f0f6ff 100%);
}

.booking-venue-card__img-wrap {
  flex-shrink: 0;
  width: 88px;
  height: 64px;
  border-radius: 10px;
  overflow: hidden;
  background: #e2e8f0;
}

.booking-venue-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.booking-venue-card__body {
  min-width: 0;
}

.booking-venue-card__name {
  display: block;
  font-size: 0.95rem;
  color: #0f172a;
  margin-bottom: 4px;
}

.booking-venue-card__meta {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #64748b;
}

.booking-requests-panel {
  margin-top: 22px;
  padding: 22px 22px 24px;
  background: #fff;
  border-radius: var(--booking-card-radius);
  border: 1px solid rgba(180, 205, 235, 0.85);
  box-shadow: 0 16px 36px rgba(28, 75, 140, 0.08);
}

.booking-requests-panel__head h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--booking-blue);
}

.booking-requests-panel__head--actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.booking-requests-empty {
  margin: 14px 0 0;
  color: #647896;
  font-size: 0.9rem;
}

.booking-approval-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.booking-btn--tiny {
  padding: 8px 18px;
  font-size: 0.84rem;
}

.booking-requests-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.booking-request-item {
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--booking-blue-soft);
  border: 1px solid rgba(170, 200, 235, 0.45);
  font-size: 0.88rem;
}

.booking-request-item p {
  margin: 6px 0 0;
}

.booking-request-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.booking-request-item__venue {
  font-weight: 700;
  color: var(--booking-blue);
}

.booking-request-item__status {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
}

.booking-request-item__muted {
  font-size: 0.8rem;
  color: #647896;
}

.booking-page__footer {
  margin: 32px -16px -48px;
  height: 56px;
  background: linear-gradient(90deg, var(--booking-blue-light) 0%, var(--booking-blue) 55%, #163a6e 100%);
  border-radius: 0;
}

@media (max-width: 860px) {
  .booking-card {
    grid-template-columns: 1fr;
  }

  .booking-card__left {
    border-right: none;
    border-bottom: 1px solid rgba(210, 225, 242, 0.95);
  }
}
</style>
