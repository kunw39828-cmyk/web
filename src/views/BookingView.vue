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

type Venue = { id: string; name: string; building: string; open: string; seats: number }
type Teacher = { id: string; name: string; department: string; managedVenueIds: string[] }

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
const selectedVenue = computed(() => venues.value.find((v) => v.id === selectedVenueId.value))
const venueTeachers = computed(() => teachers.value)
const selectedTeacher = computed(() => venueTeachers.value.find((t) => t.id === selectedTeacherId.value))

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
  await loadTeachers()
  if (auth.isAuthenticated) {
    requests.value = await apiRequest('/bookings', {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
  }
})

async function submit() {
  if (!auth.user) return (notice.value = '请先登录后再提交预约申请。')
  if (!selectedVenue.value || !selectedTeacher.value) return (notice.value = '请选择场馆和审批老师。')
  if (!date.value) return (notice.value = '请选择使用日期。')
  if (!startTime.value || !endTime.value) return (notice.value = '请填写开始/结束时间。')
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
    date.value = ''
    startTime.value = ''
    endTime.value = ''
    purpose.value = ''
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '提交失败。'
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header"><h1>场馆预约</h1><p>选择场馆、审批老师和使用时间段后提交审批。</p></header>
    <section class="profile-card">
      <form class="login__form" @submit.prevent="submit">
        <label class="field"><span>选择场馆</span><select v-model="selectedVenueId"><option v-for="v in venues" :key="v.id" :value="v.id">{{ v.name }}（{{ v.building }}）</option></select></label>
        <label class="field">
          <span>老师来源</span>
          <select v-model="teacherMode">
            <option value="byVenue">按场馆筛选（推荐）</option>
            <option value="all">全部老师（数据库实时）</option>
          </select>
        </label>
        <label class="field"><span>选择审批老师</span><select v-model="selectedTeacherId"><option v-for="t in venueTeachers" :key="t.id" :value="t.id">{{ t.name }}（{{ t.department }}）</option></select></label>
        <div class="profile-actions">
          <button type="button" class="btn btn--ghost" :disabled="loadingTeachers" @click="loadTeachers">刷新老师列表</button>
        </div>
        <div class="booking-time-grid">
          <label class="field"><span>使用日期</span><input v-model="date" type="date" /></label>
          <label class="field"><span>开始时间</span><input v-model="startTime" type="time" /></label>
          <label class="field"><span>结束时间</span><input v-model="endTime" type="time" /></label>
        </div>
        <label class="field"><span>使用用途</span><textarea v-model="purpose" rows="3" /></label>
        <button class="btn btn--primary" :disabled="!auth.user">提交老师审批</button>
      </form>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
    <section class="profile-card booking-requests">
      <div class="section__head"><h2>我的预约申请</h2></div>
      <p v-if="requests.length===0" class="muted">暂无申请记录。</p>
      <ul v-else class="list-cards">
        <li v-for="r in requests" :key="r.id">
          <article class="list-card">
            <div class="list-card__meta"><span>{{ r.venueName }}</span><span class="pill pill--warn">{{ r.status }}</span></div>
            <p>使用时间：{{ r.date }} {{ r.startTime }} - {{ r.endTime }}</p>
            <p>用途：{{ r.purpose }}</p>
            <p class="muted">审批老师：{{ r.managerTeacher }}（{{ r.managerDepartment }}）</p>
          </article>
        </li>
      </ul>
    </section>
  </div>
</template>
