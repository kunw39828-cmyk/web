<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useLostFoundStore } from '../stores/lostFound'
import { useMarketStore } from '../stores/market'
import { useNewsStore } from '../stores/news'
import { fuzzyScore } from '../utils/fuzzySearch'

const router = useRouter()
const news = useNewsStore()
const market = useMarketStore()
const lostFound = useLostFoundStore()

const serviceTiles = [
  { to: '/news', icon: '□', title: '教务服务' },
  { to: '/lost-found', icon: '◎', title: '生活服务' },
  { to: '/ai-assistant', icon: '☰', title: '学习资源' },
]

const heroImage =
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80'

type SearchHit = {
  id: string
  group: string
  title: string
  hint?: string
  to: string | { path: string; query?: Record<string, string> }
}

const searchQuery = ref('')
const panelOpen = ref(false)
const searchRootRef = ref<HTMLElement | null>(null)
const loadError = ref('')
const loading = ref(true)

const quickTags = [
  { label: '通知', kw: '通知' },
  { label: '二手', kw: '二手' },
  { label: '失物', kw: '失物' },
  { label: '场馆', kw: '场馆' },
  { label: 'AI', kw: 'AI' },
] as const

const corpus = computed<SearchHit[]>(() => {
  const staticLinks: SearchHit[] = [
    { id: 's-booking', group: '场馆', title: '校园场馆预约', hint: '教室、报告厅、活动室', to: '/booking' },
    { id: 's-ai', group: 'AI', title: 'AI 服务助手', hint: '校园智能问答', to: '/ai-assistant' },
    { id: 's-msg', group: '消息', title: '消息中心', hint: '二手与失物聊天', to: '/messages' },
    { id: 's-news', group: '通知', title: '通知公告列表', hint: '教务与校园通知', to: '/news' },
    { id: 's-market', group: '二手', title: '二手市集', hint: '浏览与发布商品', to: '/market' },
    { id: 's-lf', group: '失物', title: '失物招领', hint: '寻物与招领', to: '/lost-found' },
  ]

  const fromNews: SearchHit[] = news.posts.map((n) => ({
    id: `news-${n.id}`,
    group: '通知',
    title: n.title,
    hint: n.tag ? `${n.tag} · ${n.summary?.slice(0, 36) ?? ''}` : n.summary?.slice(0, 48),
    to: '/news',
  }))

  const fromMarket: SearchHit[] = market.items.map((m) => ({
    id: `m-${m.id}`,
    group: '二手',
    title: m.title,
    hint: `${m.campus} · ¥${m.price.toFixed(0)} · ${m.seller}`,
    to: { path: '/market', query: { keyword: String(m.title).slice(0, 48) } },
  }))

  const fromLf: SearchHit[] = lostFound.items.map((x) => ({
    id: `lf-${x.id}`,
    group: '失物',
    title: x.title,
    hint: [x.kind, x.place, x.status].filter(Boolean).join(' · '),
    to: { path: '/lost-found', query: { keyword: String(x.title).slice(0, 32) } },
  }))

  return [...staticLinks, ...fromNews, ...fromMarket, ...fromLf]
})

const searchResults = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return []
  const ranked = corpus.value
    .map((item) => ({
      ...item,
      score: fuzzyScore(q, item.title, item.hint ?? '', item.group),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
  return ranked
})

function applyTag(kw: string) {
  searchQuery.value = kw
  panelOpen.value = true
}

function openPanel() {
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
}

function goHit(hit: SearchHit & { score?: number }) {
  const { to: t } = hit
  if (typeof t === 'string') void router.push(t)
  else void router.push(t)
  closePanel()
}

function onSubmitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  const first = searchResults.value[0]
  if (first) {
    goHit(first)
    return
  }
  void router.push({ path: '/news' })
}

function onDocClick(e: MouseEvent) {
  const root = searchRootRef.value
  if (!root || root.contains(e.target as Node)) return
  closePanel()
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  loading.value = true
  loadError.value = ''
  try {
    await Promise.all([
      news.loadPosts().catch(() => []),
      market.loadItems().catch(() => []),
      lostFound.loadItems().catch(() => []),
    ])
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载搜索数据失败'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div class="home-scroll">
    <section class="home-hero" aria-label="首页封面">
      <div class="home-hero__media" :style="{ '--home-hero-img': `url(${heroImage})` }" />
      <div class="home-hero__veil" aria-hidden="true" />
      <div class="home-hero__content">
        <p class="home-hero__eyebrow">Campus Connect · IM Style</p>
        <h1 class="home-hero__title">校园e站</h1>
        <p class="home-hero__lead">一站式校园服务入口</p>
        <div class="home-hero__chips">
          <span>实时消息</span>
          <span>丝滑过渡</span>
          <span>多端体验</span>
        </div>
        <p class="home-hero__hint" aria-hidden="true">向下滚动进入主页</p>
      </div>
    </section>

    <div class="home-hero__sheet">
      <div class="home-hero__sheet-inner">
        <div class="page home-lite home-lite--hero-follow">
          <header class="home-lite__head home-lite__head--compact home-scroll-reveal home-scroll-scrub home-scroll-scrub--s1">
            <p class="home-lite__eyebrow">服务入口</p>
            <p class="home-hero__sublead">选课务、生活与 AI 助手，一站直达</p>
          </header>

          <section class="home-lite__panel">
            <div class="home-lite__services">
              <RouterLink
                v-for="tile in serviceTiles"
                :key="tile.to"
                :to="tile.to"
                class="home-lite__service home-scroll-reveal home-scroll-scrub"
                :class="`home-scroll-scrub--s${2 + serviceTiles.findIndex((t) => t.to === tile.to)}`"
                v-hover-spotlight
              >
                <span class="home-lite__service-icon" aria-hidden="true">{{ tile.icon }}</span>
                <strong>{{ tile.title }}</strong>
              </RouterLink>
            </div>

            <div ref="searchRootRef" class="home-search">
              <div class="home-search__surface home-scroll-reveal home-scroll-scrub home-scroll-scrub--s5">
                <p class="home-search__label">模糊搜索</p>
                <div class="home-search__tags" role="group" aria-label="快捷搜索标签">
                  <button
                    v-for="tag in quickTags"
                    :key="tag.kw"
                    type="button"
                    class="home-search__tag"
                    v-hover-spotlight
                    @click="applyTag(tag.kw)"
                  >
                    {{ tag.label }}
                  </button>
                </div>

                <form class="home-search__form" @submit.prevent="onSubmitSearch">
                  <span class="home-search__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
                    </svg>
                  </span>
                  <input
                    v-model="searchQuery"
                    type="search"
                    class="home-search__input"
                    placeholder="搜通知标题、二手商品、失物启事…"
                    autocomplete="off"
                    :aria-expanded="panelOpen"
                    aria-controls="home-search-results"
                    @focus="openPanel"
                    @input="openPanel"
                  />
                  <button type="submit" class="home-search__submit">搜索</button>
                </form>

                <p v-if="loadError" class="home-search__meta home-search__meta--warn">{{ loadError }}</p>
                <p v-else-if="loading" class="home-search__meta">正在加载可搜索内容…</p>
              </div>

              <div
                v-show="panelOpen && searchQuery.trim()"
                id="home-search-results"
                class="home-search__dropdown"
                role="listbox"
              >
                <template v-if="searchResults.length">
                  <button
                    v-for="row in searchResults"
                    :key="row.id"
                    type="button"
                    class="home-search__hit"
                    role="option"
                    @click="goHit(row)"
                  >
                    <span class="home-search__hit-group">{{ row.group }}</span>
                    <span class="home-search__hit-title">{{ row.title }}</span>
                    <span v-if="row.hint" class="home-search__hit-hint">{{ row.hint }}</span>
                  </button>
                </template>
                <p v-else class="home-search__empty">没有匹配项，可换个关键词或点上方标签试试</p>
              </div>
            </div>
          </section>

          <section class="home-lite__banner">
            <RouterLink
              to="/booking"
              class="home-lite__banner-item home-lite__banner-item--campus home-scroll-reveal home-scroll-scrub home-scroll-scrub--s6"
              v-hover-spotlight
            >
              <div>
                <strong>校园场馆预约</strong>
                <p>教室、报告厅、活动室线上申请</p>
              </div>
            </RouterLink>
            <RouterLink
              to="/messages"
              class="home-lite__banner-item home-lite__banner-item--fresh home-scroll-reveal home-scroll-scrub home-scroll-scrub--s7"
              v-hover-spotlight
            >
              <div>
                <strong>联系与消息中心</strong>
                <p>二手与失物聊天统一查看</p>
              </div>
            </RouterLink>
            <RouterLink
              to="/market"
              class="home-lite__banner-item home-lite__banner-item--market home-scroll-reveal home-scroll-scrub home-scroll-scrub--s8"
              v-hover-spotlight
            >
              <div>
                <strong>热门校园服务</strong>
                <p>交易、招领、公告同步更新</p>
              </div>
            </RouterLink>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-scroll {
  position: relative;
}

.home-hero {
  position: fixed;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
}

.home-hero__media {
  position: absolute;
  inset: 0;
  background-image: var(--home-hero-img);
  background-size: cover;
  background-position: center;
  transform-origin: center center;
}

.home-hero__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(35, 48, 72, 0.24) 0%,
    rgba(40, 55, 75, 0.06) 40%,
    rgba(28, 38, 58, 0.48) 100%
  );
}

.home-hero__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: var(--max, 1100px);
  margin: 0 auto;
  padding: 28px 20px max(32px, env(safe-area-inset-bottom));
  pointer-events: auto;
  text-align: center;
}

.home-hero__eyebrow {
  display: inline-block;
  margin: 0 0 10px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.74rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 250, 245, 0.95);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(180, 210, 245, 0.45);
  backdrop-filter: blur(10px);
}

.home-hero__title {
  margin: 0 0 10px;
  font-size: clamp(2.6rem, 8vw, 4.4rem);
  letter-spacing: -0.04em;
  line-height: 1.1;
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, #c8e0ff 38%, #b8ebe0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.35));
}

.home-hero__lead {
  margin: 0 0 16px;
  font-size: 1.05rem;
  color: rgba(255, 250, 245, 0.9);
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.25);
}

.home-hero__chips {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}

.home-hero__chips span {
  border: 1px solid rgba(190, 215, 240, 0.55);
  background: rgba(255, 252, 248, 0.14);
  color: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.78rem;
  backdrop-filter: blur(10px);
}

.home-hero__hint {
  margin: 26px 0 0;
  font-size: 0.82rem;
  color: rgba(255, 250, 245, 0.65);
  letter-spacing: 0.12em;
  animation: home-hero-hint 2.2s ease-in-out infinite;
}

@keyframes home-hero-hint {
  0%,
  100% {
    opacity: 0.55;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(6px);
  }
}

.home-hero__sheet {
  position: relative;
  z-index: 1;
  margin-top: 100vh;
  margin-top: 100dvh;
  min-height: min(100vh, 100dvh);
}

.home-hero__sheet-inner {
  border-radius: calc(var(--radius, 16px) + 8px) calc(var(--radius, 16px) + 8px) 0 0;
  padding: 0 env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
  background: linear-gradient(180deg, rgba(255, 252, 248, 0.75) 0px, var(--bg) min(180px, 26vh));
  border-top: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
}

.home-hero__sublead {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.98rem;
  line-height: 1.55;
  max-width: 36em;
  margin-inline: auto;
}

/* —— 搜索区 —— */
.home-search {
  position: relative;
  min-width: 0;
  align-self: start;
}

.home-search__surface {
  display: block;
}

.home-search__label {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--muted) 88%, var(--text));
}

.home-search__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.home-search__tag {
  border: 1px solid rgba(200, 218, 238, 0.55);
  background: linear-gradient(180deg, rgba(255, 252, 250, 0.98), rgba(242, 248, 255, 0.72));
  color: var(--brand-dark);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.home-search__tag:hover {
  border-color: rgba(170, 200, 232, 0.65);
  background: linear-gradient(180deg, #fffefc, rgba(236, 244, 252, 0.95));
  box-shadow: 0 3px 12px rgba(45, 85, 120, 0.06);
  transform: translateY(-1px);
}

.home-search__form {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0;
  border: 1px solid rgba(210, 225, 242, 0.75);
  border-radius: 14px;
  overflow: visible;
  background: linear-gradient(180deg, rgba(255, 254, 252, 0.98), rgba(246, 250, 255, 0.55));
  box-shadow:
    0 3px 14px rgba(45, 75, 110, 0.04),
    inset 0 0 0 1px rgba(255, 255, 255, 0.85);
}

.home-search__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 12px;
  color: color-mix(in srgb, var(--brand) 58%, var(--muted));
  opacity: 0.95;
}

.home-search__input {
  border: 0;
  padding: 12px 10px;
  font: inherit;
  font-size: 0.95rem;
  color: var(--text);
  background: transparent;
  min-width: 0;
}

.home-search__input::placeholder {
  color: color-mix(in srgb, var(--muted) 78%, #c4b8a8);
}

.home-search__input:focus {
  outline: none;
}

.home-search__form:focus-within {
  border-color: rgba(185, 210, 238, 0.95);
  box-shadow:
    0 4px 18px rgba(45, 95, 150, 0.07),
    inset 0 0 0 1px rgba(255, 255, 255, 0.9);
}

.home-search__submit {
  border: 1px solid rgba(185, 210, 235, 0.9);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  font-size: 0.88rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
  flex-shrink: 0;
  border-radius: 0 11px 11px 0;
  padding: 12px 18px;
  margin: 4px 4px 4px 0;
  color: var(--brand-dark);
  background: linear-gradient(180deg, rgba(240, 246, 255, 0.98), rgba(228, 238, 252, 0.92));
  box-shadow: 0 2px 10px rgba(45, 85, 120, 0.06);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.home-search__submit:hover {
  background: linear-gradient(180deg, rgba(232, 242, 255, 1), rgba(218, 232, 250, 0.96));
  border-color: rgba(165, 198, 235, 0.95);
  box-shadow: 0 4px 14px rgba(45, 95, 140, 0.09);
}

.home-search__submit:focus {
  outline: none;
}

.home-search__submit:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--brand) 38%, transparent);
  outline-offset: 2px;
}

.home-search__meta {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--muted) 92%, var(--text));
}

.home-search__meta--warn {
  color: #b45309;
}

.home-search__dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 30;
  max-height: min(320px, 50vh);
  overflow-y: auto;
  border-radius: 14px;
  border: 1px solid rgba(210, 225, 242, 0.85);
  background: linear-gradient(180deg, rgba(255, 254, 252, 0.99), rgba(248, 251, 255, 0.94));
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 32px rgba(45, 75, 110, 0.07);
}

.home-search__hit {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 10px;
  row-gap: 2px;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  border: none;
  border-bottom: 1px solid rgba(220, 228, 238, 0.65);
  background: transparent;
  cursor: pointer;
  font: inherit;
  transition: background 0.12s ease;
}

.home-search__hit:last-child {
  border-bottom: none;
}

.home-search__hit:hover {
  background: rgba(236, 244, 252, 0.65);
}

.home-search__hit-group {
  grid-row: 1 / span 2;
  align-self: center;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: color-mix(in srgb, var(--brand-dark) 88%, var(--muted));
  padding: 3px 8px;
  border-radius: 8px;
  background: rgba(220, 235, 250, 0.45);
  border: 1px solid rgba(200, 220, 242, 0.65);
}

.home-search__hit-title {
  font-weight: 600;
  color: var(--text);
  font-size: 0.92rem;
}

.home-search__hit-hint {
  grid-column: 2;
  font-size: 0.78rem;
  color: var(--muted);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.home-search__empty {
  margin: 0;
  padding: 14px 12px;
  font-size: 0.88rem;
  color: var(--muted);
  text-align: center;
}

/* 下滑时跟随滚动“擦出来”（scrub），避免一次性跳出 */
.home-lite--hero-follow :deep(.home-lite__panel) {
  overflow: visible;
}

/* 默认：不支持滚动时间轴时直接显示 */
.home-scroll-scrub {
  opacity: 1;
  transform: none;
}

/* 支持 scroll-driven animation 时：按滚动进度渐变显现（scrub） */
@supports (animation-timeline: scroll()) {
  .home-scroll-scrub {
    opacity: 0;
    transform: translateY(18px);
    will-change: opacity, transform;
    animation: home-scroll-scrub-in linear both;
    animation-timeline: scroll(root block);
  }

  /* 分段：略拉长区间 = 同一段滚动里渐变稍慢、更顺 */
  .home-scroll-scrub--s1 {
    animation-range: 46vh 74vh;
  }
  .home-scroll-scrub--s2 {
    animation-range: 52vh 78vh;
  }
  .home-scroll-scrub--s3 {
    animation-range: 56vh 82vh;
  }
  .home-scroll-scrub--s4 {
    animation-range: 60vh 86vh;
  }
  .home-scroll-scrub--s5 {
    animation-range: 64vh 94vh;
  }
  .home-scroll-scrub--s6 {
    animation-range: 76vh 108vh;
  }
  .home-scroll-scrub--s7 {
    animation-range: 80vh 114vh;
  }
  .home-scroll-scrub--s8 {
    animation-range: 84vh 120vh;
  }
}

@keyframes home-scroll-scrub-in {
  from {
    opacity: 0;
    transform: translateY(18px);
    filter: blur(1.5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@supports (animation-timeline: scroll()) {
  .home-hero__media {
    animation: home-hero-parallax linear forwards;
    animation-timeline: scroll(root block);
    animation-range: 0vh 90vh;
  }

  .home-hero__veil {
    animation: home-hero-veil linear forwards;
    animation-timeline: scroll(root block);
    animation-range: 0vh 90vh;
  }
}

@keyframes home-hero-parallax {
  from {
    transform: scale(1);
    filter: brightness(1) saturate(1.02);
  }
  to {
    transform: scale(1.04);
    filter: brightness(0.93) saturate(1.05);
  }
}

@keyframes home-hero-veil {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.96;
  }
}

@media (max-width: 900px) {
  .home-search__form {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
  }

  .home-search__submit {
    grid-column: 1 / -1;
    border-radius: 0 0 10px 10px;
    margin: 0 4px 4px 4px;
  }
}

@media (max-width: 640px) {
  .home-hero__sheet-inner {
    border-radius: calc(var(--radius, 16px) + 4px) calc(var(--radius, 16px) + 4px) 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__hint {
    animation: none;
  }

  .home-scroll-scrub {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }

  @supports (animation-timeline: scroll()) {
    .home-hero__media,
    .home-hero__veil {
      animation: none;
    }
  }
}
</style>
