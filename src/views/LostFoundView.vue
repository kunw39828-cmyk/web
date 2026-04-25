<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  const qk = route.query.keyword
  if (typeof qk === 'string' && qk.trim()) {
    searchInput.value = qk.trim()
    keyword.value = qk.trim()
  }
  runLoad().catch((error) => {
    notice.value = error instanceof Error ? error.message : '加载失物招领失败。'
  })
})

watch(tab, () => runLoad().catch(() => {}))

watch(
  () => route.query.keyword,
  (kw) => {
    if (typeof kw === 'string' && kw.trim()) {
      searchInput.value = kw.trim()
      keyword.value = kw.trim()
      runLoad().catch(() => {})
    }
  },
)
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
      peerId: pid,
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
  <div class="page lost-found-page">
    <section class="lost-found-shell">
      <div class="lost-found-toolbar">
        <div class="lost-found-tabs" role="tablist" aria-label="分类">
          <button
            type="button"
            class="ui-pill-tab"
            :class="{ 'ui-pill-tab--active': tab === 'all' }"
            role="tab"
            :aria-selected="tab === 'all'"
            @click="tab = 'all'"
          >
            全部
          </button>
          <button
            type="button"
            class="ui-pill-tab"
            :class="{ 'ui-pill-tab--active': tab === '寻物' }"
            role="tab"
            :aria-selected="tab === '寻物'"
            @click="tab = '寻物'"
          >
            丢失的东西
          </button>
          <button
            type="button"
            class="ui-pill-tab"
            :class="{ 'ui-pill-tab--active': tab === '招领' }"
            role="tab"
            :aria-selected="tab === '招领'"
            @click="tab = '招领'"
          >
            捡到的东西
          </button>
        </div>
        <label class="lost-found-search">
          <span class="sr-only">搜索</span>
          <input
            v-model="searchInput"
            type="search"
            placeholder="搜索标题、地点或发布人"
            autocomplete="off"
          />
        </label>
      </div>

      <div class="lost-found-publish">
        <button type="button" class="btn btn--primary lost-found-publish__btn" @click="goPublish">
          填写失物招领信息框
        </button>
      </div>

      <div class="lost-found-status">
        <p v-if="notice" class="lost-found-status__msg">{{ notice }}</p>
        <p v-else class="lost-found-status__msg">按分类浏览，支持关键词与地点筛选。</p>
        <span :class="auth.isAuthenticated ? 'pill pill--ok' : 'pill pill--warn'">
          {{ auth.isAuthenticated ? '已登录，可联系与发布' : '未登录，仅可浏览' }}
        </span>
      </div>

      <ul class="lost-found-grid">
        <li v-for="item in displayItems" :key="item.id" class="lost-found-card">
          <div class="lost-found-card__media">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" loading="lazy" />
            <div v-else class="lost-found-card__placeholder">暂无图片</div>
          </div>
          <div class="lost-found-card__body">
            <p class="lost-found-card__contact">联系人：{{ item.publisherName || '匿名发布' }}</p>
            <p class="lost-found-card__phone">电话：XXX-XXXXXXX</p>
            <p class="lost-found-card__place-label">丢失地点：</p>
            <p class="lost-found-card__place">{{ item.place || '未知地点' }}</p>
            <div class="lost-found-card__meta">
              <span class="pill pill--sky">{{ (item.kind || '寻物') === '招领' ? '捡到的东西' : '丢失的东西' }}</span>
              <time :datetime="item.date">{{ item.date }}</time>
            </div>
            <p class="lost-found-card__detail">{{ item.title }}</p>
            <div class="lost-found-card__actions">
              <button
                v-if="item.publisherId && auth.user?.studentId !== item.publisherId"
                type="button"
                class="btn btn--ghost lost-found-card__btn"
                @click.stop="contact(item)"
              >
                联系我
              </button>
              <span v-else-if="item.publisherId" class="lost-found-self-tag">我的发布</span>
              <span v-else class="muted lost-found-no-publisher">无发布人</span>
            </div>
          </div>
        </li>
      </ul>

      <p v-if="displayItems.length === 0" class="lost-found-empty">暂无记录，可更换分类或关键词试试。</p>
    </section>
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
.lost-found-page {
  padding-top: 8px;
}
.lost-found-shell {
  border: 1px solid rgba(206, 223, 240, 0.95);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(240, 247, 255, 0.96), rgba(245, 250, 255, 0.98));
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  padding: 20px;
}
.lost-found-toolbar {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
}
.lost-found-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.lost-found-search input {
  width: 100%;
  border: 1px solid rgba(194, 213, 233, 0.92);
  border-radius: 14px;
  padding: 12px 14px;
  font: inherit;
  background: rgba(255, 255, 255, 0.9);
}
.lost-found-search input:focus {
  outline: none;
  border-color: rgba(126, 168, 216, 0.95);
}
.lost-found-publish {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}
.lost-found-publish__btn {
  min-width: 240px;
}
.lost-found-status {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--muted);
  font-size: 0.9rem;
}
.lost-found-status__msg {
  margin: 0;
}
.lost-found-grid {
  list-style: none;
  margin: 20px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.lost-found-card {
  border: 1px solid rgba(207, 220, 236, 0.96);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  overflow: hidden;
  display: grid;
}
.lost-found-card__media {
  height: 156px;
  background: rgba(227, 238, 250, 0.65);
}
.lost-found-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lost-found-card__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--muted);
  font-size: 0.85rem;
}
.lost-found-card__body {
  padding: 12px 12px 13px;
}
.lost-found-card__contact,
.lost-found-card__phone,
.lost-found-card__place,
.lost-found-card__place-label {
  margin: 0;
  font-size: 0.96rem;
  line-height: 1.45;
  color: #334155;
}
.lost-found-card__place {
  margin-top: 2px;
}
.lost-found-card__place-label {
  margin-top: 2px;
}
.lost-found-card__meta {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.lost-found-card__meta time {
  color: #64748b;
  font-size: 1rem;
  letter-spacing: 0.02em;
}
.lost-found-card__detail {
  margin: 10px 0 0;
  color: #475569;
  font-size: 1rem;
  line-height: 1.35;
}
.lost-found-card__actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}
.lost-found-card__btn {
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 999px;
  border-color: rgba(59, 130, 246, 0.25);
  color: #2563eb;
  background: rgba(219, 234, 254, 0.75);
}
.lost-found-card__btn:hover {
  border-color: rgba(59, 130, 246, 0.38);
  color: #1d4ed8;
  background: rgba(219, 234, 254, 0.95);
}
.lost-found-self-tag {
  font-size: 0.8rem;
  color: var(--brand-dark);
  background: rgba(219, 234, 254, 0.75);
  border-radius: 999px;
  padding: 2px 8px;
}
.lost-found-no-publisher {
  font-size: 0.85rem;
}
.lost-found-empty {
  margin: 14px 0 0;
  border-radius: 12px;
  border: 1px dashed rgba(182, 203, 228, 0.9);
  color: var(--muted);
  background: rgba(255, 255, 255, 0.75);
  padding: 12px;
}
@media (max-width: 1180px) {
  .lost-found-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .lost-found-toolbar {
    grid-template-columns: 1fr;
  }
  .lost-found-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 620px) {
  .lost-found-shell {
    padding: 14px;
  }
  .lost-found-grid {
    grid-template-columns: 1fr;
  }
}
</style>
