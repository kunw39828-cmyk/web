<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { apiRequest } from '../api/client'
import { useAuthStore } from '../stores/auth'

type PendingApproval = {
  id: string | number
  venueName: string
  applicant: string
  date: string
  startTime: string
  endTime: string
  purpose: string
  status: '待老师审批' | '已通过' | '已驳回'
}

const auth = useAuthStore()
const items = ref<PendingApproval[]>([])
const notice = ref('')
const loading = ref(false)
let pollTimer: number | null = null

async function loadPending() {
  loading.value = true
  try {
    items.value = await apiRequest('/approvals/pending', {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    if (!notice.value.includes('失败')) notice.value = ''
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '加载审批列表失败。'
  } finally {
    loading.value = false
  }
}

async function decide(id: string | number, decision: 'approve' | 'reject') {
  try {
    await apiRequest(`/approvals/${id}/decision`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ decision }),
    })
    items.value = items.value.filter((item) => String(item.id) !== String(id))
    notice.value = decision === 'approve' ? '审批已通过。' : '审批已驳回。'
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '审批操作失败。'
  }
}

onMounted(() => {
  loadPending()
  pollTimer = window.setInterval(() => {
    loadPending()
  }, 5000)
})

onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer)
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>老师审批台</h1>
      <p>仅老师可访问，处理场馆预约申请。</p>
    </header>
    <section class="profile-card">
      <div class="profile-actions">
        <button type="button" class="btn btn--ghost" :disabled="loading" @click="loadPending">立即刷新</button>
      </div>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
      <p v-if="items.length === 0" class="muted">暂无待审批申请。</p>
      <ul v-else class="list-cards">
        <li v-for="item in items" :key="item.id">
          <article class="list-card">
            <div class="list-card__meta">
              <span>{{ item.venueName }}</span>
              <span class="pill pill--warn">{{ item.status }}</span>
            </div>
            <p>申请人：{{ item.applicant }}</p>
            <p>时间：{{ item.date }} {{ item.startTime }} - {{ item.endTime }}</p>
            <p>用途：{{ item.purpose }}</p>
            <div class="profile-actions">
              <button type="button" class="btn btn--primary" @click="decide(item.id, 'approve')">
                通过
              </button>
              <button type="button" class="btn btn--ghost" @click="decide(item.id, 'reject')">
                驳回
              </button>
            </div>
          </article>
        </li>
      </ul>
    </section>
  </div>
</template>
