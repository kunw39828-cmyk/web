<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useLostFoundStore, type LostFoundKind, type LostFoundPost } from '../stores/lostFound'

const auth = useAuthStore()
const router = useRouter()
const store = useLostFoundStore()
const route = useRoute()
const notice = ref((route.query.created as string) ? '失物招领发布成功，已展示在列表。' : '')

const tab = ref<'all' | LostFoundKind>('all')
const keyword = ref('')
const searchInput = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const displayItems = computed(() => store.items)

onMounted(() => {
  runLoad().catch((error) => {
    notice.value = error instanceof Error ? error.message : '加载失物招领失败。'
  })
})

watch(tab, () => runLoad().catch(() => {}))
watch(searchInput, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    keyword.value = searchInput.value
    runLoad().catch(() => {})
  }, 320)
})

async function runLoad() {
  const k = tab.value === 'all' ? undefined : tab.value
  await store.loadItems(keyword.value, k)
}

function contact(item: LostFoundPost) {
  if (!auth.isAuthenticated) {
    router.push({ path: '/login', query: { from: route.fullPath } })
    return
  }
  const pid = item.publisherId?.trim()
  if (!pid) {
    notice.value = '该条没有发布人信息，无法联系。'
    return
  }
  if (auth.user?.studentId === pid) {
    notice.value = '这是您自己发布的信息。'
    return
  }
  router.push({
    path: '/lost-found/chat',
    query: {
      itemId: String(item.id),
      title: item.title,
      seller: item.publisherName || '发布人',
      sellerId: pid,
    },
  })
}

function goPublish() {
  if (auth.isAuthenticated) {
    router.push('/lost-found/publish')
    return
  }
  router.push({ path: '/login', query: { from: '/lost-found/publish' } })
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>失物招领</h1>
      <p>按分类浏览；关键词可搜标题、地点或发布人（须为已入库账号）。</p>
    </header>
    <section class="profile-card">
      <div class="section__head">
        <h2>发布入口</h2>
        <span :class="auth.isAuthenticated ? 'pill pill--ok' : 'pill pill--warn'">{{
          auth.isAuthenticated ? '已登录，可发布' : '未登录，仅可浏览'
        }}</span>
      </div>
      <div class="profile-actions">
        <button type="button" class="btn btn--primary" @click="goPublish">我要发布</button>
        <RouterLink to="/login" class="btn btn--ghost" v-if="!auth.isAuthenticated">去登录</RouterLink>
      </div>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>

    <section class="profile-card lost-found-toolbar">
      <div class="lost-found-tabs" role="tablist" aria-label="分类">
        <button
          type="button"
          class="lost-found-tab"
          :class="{ 'lost-found-tab--active': tab === 'all' }"
          role="tab"
          :aria-selected="tab === 'all'"
          @click="tab = 'all'"
        >
          全部
        </button>
        <button
          type="button"
          class="lost-found-tab"
          :class="{ 'lost-found-tab--active': tab === '寻物' }"
          role="tab"
          :aria-selected="tab === '寻物'"
          @click="tab = '寻物'"
        >
          丢失的东西
        </button>
        <button
          type="button"
          class="lost-found-tab"
          :class="{ 'lost-found-tab--active': tab === '招领' }"
          role="tab"
          :aria-selected="tab === '招领'"
          @click="tab = '招领'"
        >
          捡到的东西
        </button>
      </div>
      <label class="field lost-found-search">
        <span class="sr-only">搜索</span>
        <input
          v-model="searchInput"
          type="search"
          placeholder="搜索标题、地点或发布人"
          autocomplete="off"
        />
      </label>
    </section>

    <ul class="table-list lost-found-list">
      <li v-for="item in displayItems" :key="item.id" class="table-list__row lost-found-row">
        <div class="lost-found-row__main">
          <div class="lost-found-row__text">
            <strong>{{ item.title }}</strong>
            <p class="muted">{{ item.place }}</p>
            <p v-if="item.publisherName || item.publisherId" class="muted lost-found-publisher">
              发布：{{ item.publisherName || '—' }}
              <span v-if="item.publisherId" class="lost-found-publisher-id">{{ item.publisherId }}</span>
              <button
                v-if="item.publisherId && auth.user?.studentId !== item.publisherId"
                type="button"
                class="btn btn--ghost lost-found-contact-inline"
                @click.stop="contact(item)"
              >
                联系我
              </button>
              <span v-else-if="item.publisherId" class="lost-found-self-tag">我的发布</span>
            </p>
            <div class="lost-found-kind-row">
              <span class="pill pill--sky">{{ (item.kind || '寻物') === '招领' ? '招领' : '寻物' }}</span>
              <span v-if="!item.publisherId" class="muted lost-found-no-publisher">无发布人</span>
            </div>
          </div>
          <div v-if="item.imageUrl" class="lost-found-thumb">
            <img :src="item.imageUrl" :alt="item.title" loading="lazy" />
          </div>
        </div>
        <div class="lost-found-row__tail">
          <time :datetime="item.date">{{ item.date }}</time>
          <span :class="item.status === '已认领' ? 'pill pill--ok' : 'pill pill--warn'">{{ item.status }}</span>
        </div>
      </li>
    </ul>
    <p v-if="displayItems.length === 0" class="muted profile-card">暂无记录，可更换分类或关键词试试。</p>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.lost-found-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
}
.lost-found-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.lost-found-tab {
  border: 1px solid var(--border);
  background: var(--surface);
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  color: var(--text);
}
.lost-found-tab--active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
  font-weight: 600;
}
.lost-found-search {
  flex: 1;
  min-width: 200px;
  margin: 0;
}
.lost-found-search input {
  width: 100%;
}
.lost-found-list {
  margin-top: 0;
}
.lost-found-row {
  align-items: flex-start;
}
.lost-found-row__main {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}
.lost-found-row__text {
  min-width: 0;
}
.lost-found-row__text .pill {
  margin-top: 8px;
  display: inline-block;
}
.lost-found-kind-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.lost-found-kind-row .pill {
  margin-top: 0;
}
.lost-found-publisher {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.lost-found-publisher-id {
  opacity: 0.85;
  font-family: ui-monospace, monospace;
  font-size: 0.85em;
}
.lost-found-contact-inline {
  margin-left: 2px;
  font-size: 0.8rem;
  padding: 3px 9px;
}
.lost-found-self-tag {
  font-size: 0.8rem;
  color: #0f766e;
  background: rgba(20, 184, 166, 0.12);
  border-radius: 999px;
  padding: 2px 8px;
}
.lost-found-thumb {
  flex-shrink: 0;
  width: 96px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: #f1f5f9;
}
.lost-found-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lost-found-row__tail {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.lost-found-no-publisher {
  font-size: 0.85rem;
}
.pill--sky {
  background: rgba(14, 165, 233, 0.15);
  color: #0369a1;
}
</style>
