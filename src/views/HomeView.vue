<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useLostFoundStore } from '../stores/lostFound'
import { useMarketStore } from '../stores/market'
import { useNewsStore } from '../stores/news'
import { fuzzyScore } from '../utils/fuzzySearch'

const router = useRouter()
const route = useRoute()
const news = useNewsStore()
const market = useMarketStore()
const lostFound = useLostFoundStore()

/** 首屏互动：校园签 + 今日状态（轻量本地随机，不请求接口） */
type CampusDraw = { tag: string; line: string }

const campusDrawPool: CampusDraw[] = [
  { tag: '上上签', line: '今日宜：把待办拆成三件小事，做完就奖励自己一杯奶茶。' },
  { tag: '宜自习', line: '图书馆靠窗位正在召唤你，手机先开飞行模式十分钟。' },
  { tag: '宜摸鱼', line: '节奏对了效率才高。先闭眼深呼吸五次，再打开教务系统。' },
  { tag: '小吉', line: '二手群里蹲一蹲，说不定能捡到刚好需要的教材。' },
  { tag: '宜社交', line: '失物招领多刷一眼，你的校园卡可能正在等你认领。' },
  { tag: '宜预约', line: '报告厅空档不等人，有空就把场馆预约排进日程。' },
  { tag: '宜搜索', line: '试试模糊搜索：一条关键词，通知二手失物一起捞。' },
  { tag: '平常心', line: '没回的消息不急催，消息中心里慢慢对齐就好。' },
  { tag: '宜问 AI', line: '选课务卡壳时，先让校园 AI 帮你捋一遍流程。' },
  { tag: '宜早睡', line: '熬夜改 bug 不如早起抢课；今晚早点关机也算胜利。' },
  { tag: '彩蛋签', line: '你点击这一下，服务器在千里之外为你随机了一行字 ✦' },
]

const campusDraw = ref<CampusDraw | null>(null)
const campusDrawKey = ref(0)

function drawCampusSign() {
  const pool = campusDrawPool
  let next = pool[Math.floor(Math.random() * pool.length)]!
  if (campusDraw.value && pool.length > 1) {
    let guard = 0
    while (next.tag === campusDraw.value.tag && next.line === campusDraw.value.line && guard < 12) {
      next = pool[Math.floor(Math.random() * pool.length)]!
      guard++
    }
  }
  campusDraw.value = next
  campusDrawKey.value += 1
}

const moodChips = [
  { k: 'rush' as const, emoji: '⚡', label: '冲一把' },
  { k: 'chill' as const, emoji: '🌿', label: '慢慢来' },
  { k: 'coffee' as const, emoji: '☕', label: '续命中' },
]
const campusMood = ref<(typeof moodChips)[number]['k'] | null>(null)

function toggleCampusMood(k: (typeof moodChips)[number]['k']) {
  campusMood.value = campusMood.value === k ? null : k
}

/** 互动区页脚：每次完整刷新页面随机一条（纯本地、不上传） */
const homeFooterFamousQuotes: { text: string; author: string }[] = [
  { text: '千里之行，始于足下。', author: '《道德经》' },
  { text: '学而时习之，不亦说乎？', author: '《论语》' },
  { text: '己所不欲，勿施于人。', author: '《论语》' },
  { text: '锲而不舍，金石可镂。', author: '荀子' },
  { text: '博观而约取，厚积而薄发。', author: '苏轼' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
  { text: '少壮不努力，老大徒伤悲。', author: '《长歌行》' },
  { text: '非淡泊无以明志，非宁静无以致远。', author: '诸葛亮' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白' },
  { text: '欲穷千里目，更上一层楼。', author: '王之涣' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '横眉冷对千夫指，俯首甘为孺子牛。', author: '鲁迅' },
  { text: '时间就像海绵里的水，只要愿挤，总还是有的。', author: '鲁迅' },
  { text: '读书好，多读书，读好书。', author: '冰心' },
  { text: '你的问题主要在于读书不多而想得太多。', author: '杨绛' },
  { text: '人生如逆旅，我亦是行人。', author: '苏轼' },
  { text: '穷且益坚，不坠青云之志。', author: '王勃' },
]

const footerFamousQuote =
  homeFooterFamousQuotes[Math.floor(Math.random() * homeFooterFamousQuotes.length)]!

/** 封面轮播（public/hero 本地图，444 为首屏） */
const heroSlides = [
  '/hero/444.jpg',
  '/hero/111.jpg',
  '/hero/222.jpg',
  '/hero/333.jpg',
  '/hero/555.jpg',
] as const

const heroSlideIndex = ref(0)
let heroCarouselTimer: number | undefined

function nextHeroSlide() {
  heroSlideIndex.value = (heroSlideIndex.value + 1) % heroSlides.length
}

function prevHeroSlide() {
  heroSlideIndex.value = (heroSlideIndex.value - 1 + heroSlides.length) % heroSlides.length
}

function goHeroSlide(i: number) {
  heroSlideIndex.value = i
}

function restartHeroCarousel() {
  if (heroCarouselTimer !== undefined) {
    window.clearInterval(heroCarouselTimer)
    heroCarouselTimer = undefined
  }
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  heroCarouselTimer = window.setInterval(nextHeroSlide, 6000)
}

function onHeroPrev() {
  prevHeroSlide()
  restartHeroCarousel()
}

function onHeroNext() {
  nextHeroSlide()
  restartHeroCarousel()
}

function onHeroDot(i: number) {
  goHeroSlide(i)
  restartHeroCarousel()
}

/** 封面主标题区：悬停随指针 3D 倾斜；离开后先平滑归位再恢复摇摆 */
const heroHeadlineHover = ref(false)
/** 指针已离开，但仍在用 transition 把 transform 收束到中性，此期间不启动 sway，避免与内联 transform 打架 */
const headlineSettling = ref(false)
let headlineSettleTimer: ReturnType<typeof setTimeout> | undefined
const heroHeadlineTiltX = ref(0)
const heroHeadlineTiltY = ref(0)

function onHeroHeadlineMove(e: MouseEvent) {
  if (headlineSettleTimer !== undefined) {
    clearTimeout(headlineSettleTimer)
    headlineSettleTimer = undefined
  }
  headlineSettling.value = false
  heroHeadlineHover.value = true
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  const w = Math.max(1, r.width)
  const h = Math.max(1, r.height)
  const nx = (e.clientX - r.left) / w - 0.5
  const ny = (e.clientY - r.top) / h - 0.5
  heroHeadlineTiltX.value = nx * 14
  heroHeadlineTiltY.value = ny * -10
}

function onHeroHeadlineLeave() {
  heroHeadlineHover.value = false
  heroHeadlineTiltX.value = 0
  heroHeadlineTiltY.value = 0
  headlineSettling.value = true
  if (headlineSettleTimer !== undefined) clearTimeout(headlineSettleTimer)
  headlineSettleTimer = setTimeout(() => {
    headlineSettling.value = false
    headlineSettleTimer = undefined
  }, 700)
}

const heroHeadlineInnerStyle = computed(() => {
  const hover = heroHeadlineHover.value
  const settling = headlineSettling.value
  if (!hover && !settling) return {}
  const tx = heroHeadlineTiltX.value
  const ty = heroHeadlineTiltY.value
  const scale = hover ? 1.03 : 1
  return {
    transform: `perspective(560px) rotateY(${tx}deg) rotateX(${ty}deg) scale3d(${scale}, ${scale}, 1)`,
    transition: hover
      ? 'transform 0.11s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'transform 0.68s cubic-bezier(0.33, 1, 0.26, 1)',
  }
})

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
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
const loadError = ref('')
const loading = ref(true)

// 首页动效：强制开启（避免系统“减少动态效果”把动画全部关掉，导致看起来没变化）
const motionOK = typeof window !== 'undefined'
const supportsScrollTimeline = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: scroll()')
const heroScale = ref('1')
const heroBright = ref('1')
let heroScrollRaf = 0

const heroTips = [
  '向下滚动进入主页',
  '试试搜索区快捷标签，一键搜索',
  '二手/失物/通知都能搜到',
  '进入消息中心，统一查看会话',
] as const
const heroTipIndex = ref(0)
let heroTipTimer: number | undefined
let revealObserver: IntersectionObserver | null = null

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

const latestNews = computed(() => news.posts.slice(0, 4))
const latestMarket = computed(() => market.items.slice(0, 4))
const latestLostFound = computed(() => lostFound.items.slice(0, 4))
const homeKpis = computed(() => [
  { label: '通知', value: String(news.posts.length) },
  { label: '二手', value: String(market.items.length) },
  { label: '失物', value: String(lostFound.items.length) },
  { label: '搜索词库', value: String(corpus.value.length) },
])

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
  void nextTick(() => syncDropdownPosition())
}

function closePanel() {
  panelOpen.value = false
}

function syncDropdownPosition() {
  if (!panelOpen.value) return
  const root = searchRootRef.value
  if (!root) return
  const rect = root.getBoundingClientRect()
  dropdownStyle.value = {
    left: `${Math.round(rect.left)}px`,
    top: `${Math.round(rect.bottom + 6)}px`,
    width: `${Math.round(rect.width)}px`,
  }
}

function syncHeroScrollFx() {
  if (!motionOK) return
  if (supportsScrollTimeline) return
  if (heroScrollRaf) return
  heroScrollRaf = window.requestAnimationFrame(() => {
    heroScrollRaf = 0
    const y = window.scrollY || document.documentElement.scrollTop || 0
    const vh = window.innerHeight || 800
    const t = Math.min(1, Math.max(0, y / (vh * 0.9)))
    const scale = 1 + 0.04 * t
    const bright = 1 - 0.07 * t
    heroScale.value = scale.toFixed(3)
    heroBright.value = bright.toFixed(3)
  })
}

function setupRevealObserver() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
  if (revealObserver) revealObserver.disconnect()
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement
        if (entry.isIntersecting) el.classList.add('is-visible')
        else el.classList.remove('is-visible')
      }
    },
    {
      root: null,
      threshold: 0.14,
      rootMargin: '0px 0px -8% 0px',
    },
  )

  const nodes = document.querySelectorAll<HTMLElement>('.home-reveal')
  nodes.forEach((el, idx) => {
    const stagger = Math.min(280, idx * 45)
    el.style.setProperty('--reveal-delay', `${stagger}ms`)
    revealObserver?.observe(el)
  })
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
  const dd = dropdownRef.value
  const target = e.target as Node
  if (!root) return
  if (root.contains(target)) return
  if (dd && dd.contains(target)) return
  closePanel()
}

watch(
  () => route.query.q,
  (q) => {
    if (typeof q === 'string' && q.trim()) {
      searchQuery.value = q.trim()
      void nextTick(() => {
        panelOpen.value = true
        syncDropdownPosition()
      })
    }
  },
  { immediate: true },
)

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', syncDropdownPosition, { passive: true })
  window.addEventListener('resize', syncDropdownPosition, { passive: true })
  window.addEventListener('scroll', syncHeroScrollFx, { passive: true })
  window.addEventListener('resize', syncHeroScrollFx, { passive: true })
  syncHeroScrollFx()
  restartHeroCarousel()
  await nextTick()
  setupRevealObserver()
  if (motionOK) {
    heroTipTimer = window.setInterval(() => {
      heroTipIndex.value = (heroTipIndex.value + 1) % heroTips.length
    }, 3200)
  }
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
  window.removeEventListener('scroll', syncDropdownPosition)
  window.removeEventListener('resize', syncDropdownPosition)
  window.removeEventListener('scroll', syncHeroScrollFx)
  window.removeEventListener('resize', syncHeroScrollFx)
  if (heroScrollRaf) window.cancelAnimationFrame(heroScrollRaf)
  if (heroTipTimer) window.clearInterval(heroTipTimer)
  if (heroCarouselTimer !== undefined) {
    window.clearInterval(heroCarouselTimer)
    heroCarouselTimer = undefined
  }
  if (revealObserver) {
    revealObserver.disconnect()
    revealObserver = null
  }
  if (headlineSettleTimer !== undefined) {
    clearTimeout(headlineSettleTimer)
    headlineSettleTimer = undefined
  }
})
</script>

<template>
  <div class="home-scroll home-motion-force">
    <section class="home-hero" aria-label="首页封面">
      <div class="home-hero__stage" :style="{ '--home-hero-scale': heroScale }">
        <div class="home-hero__carousel" :style="{ '--home-hero-bright': heroBright }">
          <div
            v-for="(src, i) in heroSlides"
            :key="i"
            class="home-hero__slide"
            :class="{ 'home-hero__slide--active': i === heroSlideIndex }"
            :style="{ '--home-hero-img': `url(${src})` }"
            :aria-hidden="i !== heroSlideIndex"
          />
        </div>
        <div class="home-hero__glow" aria-hidden="true" />
        <div class="home-hero__veil" aria-hidden="true" />
        <div class="home-hero__content">
        <header class="home-hero__top">
          <div class="home-hero__headline">
            <div
              class="home-hero__headline-inner"
              :class="{
                'home-hero__headline--hover': heroHeadlineHover,
                'home-hero__headline--sway': !heroHeadlineHover && !headlineSettling,
              }"
              :style="heroHeadlineInnerStyle"
              @mousemove="onHeroHeadlineMove"
              @mouseleave="onHeroHeadlineLeave"
            >
              <h1 class="home-hero__title">校园e站</h1>
              <p class="home-hero__lead">一站式校园服务入口</p>
            </div>
          </div>
        </header>
        <footer class="home-hero__bottom">
          <p class="home-hero__hint" aria-hidden="true">
            <span class="home-hero__hint-fade" :key="heroTipIndex">{{ heroTips[heroTipIndex] }}</span>
          </p>
          <nav class="home-hero__carousel-nav" aria-label="封面图片轮播">
          <button type="button" class="home-hero__carousel-btn" aria-label="上一张" @click="onHeroPrev">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <div class="home-hero__dots">
            <button
              v-for="(_, i) in heroSlides"
              :key="i"
              type="button"
              :aria-label="`第 ${i + 1} 张，共 ${heroSlides.length} 张`"
              :aria-current="i === heroSlideIndex ? 'true' : undefined"
              class="home-hero__dot"
              :class="{ 'home-hero__dot--active': i === heroSlideIndex }"
              @click="onHeroDot(i)"
            />
          </div>
          <button type="button" class="home-hero__carousel-btn" aria-label="下一张" @click="onHeroNext">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </nav>
        </footer>
        </div>
      </div>
    </section>

    <div class="home-hero__sheet">
      <div class="home-hero__sheet-inner">
        <div class="page home-lite home-lite--hero-follow">
          <header class="home-lite__head home-lite__head--compact home-scroll-reveal home-scroll-scrub home-scroll-scrub--s1">
            <p class="home-lite__eyebrow">来玩一下</p>
            <p class="home-hero__sublead">抽一支校园签、点个今日状态，再往下搜索也不迟</p>
          </header>

          <section class="home-lite__panel home-reveal">
            <div
              class="home-play home-scroll-reveal home-scroll-scrub home-scroll-scrub--s2"
              :class="{
                'home-play--mood-rush': campusMood === 'rush',
                'home-play--mood-chill': campusMood === 'chill',
                'home-play--mood-coffee': campusMood === 'coffee',
              }"
              aria-label="校园签与今日状态"
            >
              <div class="home-play__col home-play__col--cta">
                <p class="home-play__kicker">今日灵感</p>
                <button
                  type="button"
                  class="btn btn--primary home-play__draw"
                  @click="drawCampusSign"
                >
                  {{ campusDraw ? '再抽一支' : '抽一支校园签' }}
                </button>
              </div>
              <div class="home-play__col home-play__col--out" aria-live="polite">
                <div v-if="campusDraw" :key="campusDrawKey" class="home-play__reveal">
                  <span class="home-play__tag">{{ campusDraw.tag }}</span>
                  <p class="home-play__line">{{ campusDraw.line }}</p>
                </div>
                <p v-else class="home-play__placeholder">点按钮，随机解锁一句「校园生存小抄」～</p>
              </div>
              <div class="home-play__moods" role="group" aria-label="今日状态">
                <button
                  v-for="m in moodChips"
                  :key="m.k"
                  type="button"
                  class="home-play__mood"
                  :class="{ 'home-play__mood--on': campusMood === m.k }"
                  :aria-pressed="campusMood === m.k ? 'true' : 'false'"
                  @click="toggleCampusMood(m.k)"
                >
                  <span class="home-play__mood-emoji" aria-hidden="true">{{ m.emoji }}</span>
                  {{ m.label }}
                </button>
              </div>
              <p class="home-play__hint" aria-label="随机名人名言">
                <span class="home-play__hint-q">「{{ footerFamousQuote.text }}」</span>
                <span class="home-play__hint-by">—— {{ footerFamousQuote.author }}</span>
              </p>
            </div>

            <div ref="searchRootRef" class="home-search">
              <div class="home-search__surface home-scroll-reveal home-scroll-scrub home-scroll-scrub--s5 home-reveal">
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
                    placeholder="搜通知、二手、失物…"
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
            </div>
          </section>

          <section class="home-lite__banner home-reveal">
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

          <section class="home-feed home-scroll-reveal home-scroll-scrub home-scroll-scrub--s8 home-reveal" aria-label="最新动态">
            <header class="home-feed__head home-reveal">
              <div>
                <p class="home-feed__eyebrow">最新动态</p>
                <h2 class="home-feed__title">校园实时动态</h2>
              </div>
              <RouterLink to="/news" class="home-feed__more link-inline">查看全部 →</RouterLink>
            </header>

            <div class="home-feed__grid">
              <article class="home-feed__col home-reveal" v-hover-spotlight>
                <header class="home-feed__col-head">
                  <strong>通知公告</strong>
                  <RouterLink to="/news" class="home-feed__col-more">更多</RouterLink>
                </header>
                <div v-if="latestNews.length" class="home-feed__list" role="list">
                  <RouterLink
                    v-for="n in latestNews"
                    :key="String(n.id)"
                    to="/news"
                    class="home-feed__row"
                    role="listitem"
                  >
                    <span class="home-feed__row-title">{{ n.title }}</span>
                    <span class="home-feed__row-meta">{{ n.tag }} · {{ n.date }}</span>
                  </RouterLink>
                </div>
                <p v-else class="home-feed__empty">暂时没有可展示的通知</p>
              </article>

              <article class="home-feed__col home-reveal" v-hover-spotlight>
                <header class="home-feed__col-head">
                  <strong>二手市集</strong>
                  <RouterLink to="/market" class="home-feed__col-more">去逛逛</RouterLink>
                </header>
                <div v-if="latestMarket.length" class="home-feed__list" role="list">
                  <RouterLink
                    v-for="m in latestMarket"
                    :key="String(m.id)"
                    :to="{ path: '/market', query: { keyword: String(m.title).slice(0, 48) } }"
                    class="home-feed__row"
                    role="listitem"
                  >
                    <span class="home-feed__row-title">{{ m.title }}</span>
                    <span class="home-feed__row-meta">{{ m.campus }} · ¥{{ m.price.toFixed(0) }} · {{ m.seller }}</span>
                  </RouterLink>
                </div>
                <p v-else class="home-feed__empty">还没有商品，先去发布一个吧</p>
                <RouterLink to="/market/sell" class="home-lite__service home-feed__service-tile" v-hover-spotlight>
                  <span class="home-lite__service-icon" aria-hidden="true">¥</span>
                  <strong>发布闲置</strong>
                </RouterLink>
              </article>

              <article class="home-feed__col home-reveal" v-hover-spotlight>
                <header class="home-feed__col-head">
                  <strong>失物招领</strong>
                  <RouterLink to="/lost-found" class="home-feed__col-more">查看</RouterLink>
                </header>
                <div v-if="latestLostFound.length" class="home-feed__list" role="list">
                  <RouterLink
                    v-for="x in latestLostFound"
                    :key="String(x.id)"
                    :to="{ path: '/lost-found', query: { keyword: String(x.title).slice(0, 48) } }"
                    class="home-feed__row"
                    role="listitem"
                  >
                    <span class="home-feed__row-title">{{ x.title }}</span>
                    <span class="home-feed__row-meta">{{ x.kind ?? '启事' }} · {{ x.place }} · {{ x.status }}</span>
                  </RouterLink>
                </div>
                <p v-else class="home-feed__empty">暂时没有启事，随时可发布</p>
                <RouterLink to="/lost-found/publish" class="home-lite__service home-feed__service-tile" v-hover-spotlight>
                  <span class="home-lite__service-icon" aria-hidden="true">※</span>
                  <strong>发布启事</strong>
                </RouterLink>
              </article>
            </div>

            <footer class="home-footer home-reveal">
              <section class="home-data-band home-reveal" aria-label="校园服务概览">
                <div class="home-data-band__grid">
                  <article v-for="k in homeKpis" :key="k.label" class="home-data-band__item">
                    <span class="home-data-band__value">{{ k.value }}</span>
                    <span class="home-data-band__label">{{ k.label }}</span>
                  </article>
                </div>
              </section>

              <div class="home-footer__links home-reveal">
                <RouterLink to="/messages" class="home-footer__link">消息中心</RouterLink>
                <RouterLink to="/booking" class="home-footer__link">场馆预约</RouterLink>
                <RouterLink to="/profile" class="home-footer__link">个人中心</RouterLink>
              </div>
              <p class="home-footer__meta">校园e站 · 一站式校园服务入口</p>
            </footer>
          </section>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-show="panelOpen && searchQuery.trim()"
      ref="dropdownRef"
      id="home-search-results"
      class="home-search__dropdown home-search__dropdown--teleport"
      role="listbox"
      :style="dropdownStyle"
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
  </Teleport>
</template>

<style scoped>
.home-scroll {
  position: relative;
  /* 与 App.vue `.main-shell--home { padding-bottom: 40px }` 对消，使首页 sheet 下缘贴齐视口底 */
  margin-bottom: -40px;
}

.home-hero {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.home-hero__stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transform-origin: center center;
  transform: scale(var(--home-hero-scale, 1));
  pointer-events: none;
}

.home-hero__carousel {
  position: absolute;
  inset: 0;
  overflow: hidden;
  filter: brightness(var(--home-hero-bright, 1)) saturate(1.02);
}

.home-hero__slide {
  position: absolute;
  inset: 0;
  background-image: var(--home-hero-img);
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 1s ease-in-out;
  pointer-events: none;
  z-index: 0;
}

.home-hero__slide--active {
  opacity: 1;
  z-index: 1;
}

.home-hero__carousel-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 0;
  flex-wrap: wrap;
}

.home-hero__carousel-btn {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid rgba(200, 225, 255, 0.42);
  background: rgba(28, 38, 58, 0.38);
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.15s ease;
}

.home-hero__carousel-btn:hover {
  background: rgba(35, 48, 72, 0.52);
  border-color: rgba(220, 235, 255, 0.55);
}

.home-hero__carousel-btn:active {
  transform: scale(0.96);
}

.home-hero__carousel-btn:focus-visible {
  outline: 2px solid rgba(200, 225, 255, 0.75);
  outline-offset: 3px;
}

.home-hero__dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.home-hero__dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.home-hero__dot:hover {
  background: rgba(255, 255, 255, 0.58);
}

.home-hero__dot--active {
  background: rgba(255, 255, 255, 0.95);
  transform: scale(1.35);
}

.home-hero__dot:focus-visible {
  outline: 2px solid rgba(200, 225, 255, 0.75);
  outline-offset: 3px;
}

.home-hero__glow {
  position: absolute;
  inset: -30%;
  pointer-events: none;
  background:
    radial-gradient(circle at 22% 18%, rgba(96, 165, 250, 0.22), transparent 40%),
    radial-gradient(circle at 78% 28%, rgba(59, 130, 246, 0.16), transparent 42%),
    radial-gradient(circle at 55% 92%, rgba(148, 163, 184, 0.12), transparent 44%);
  mix-blend-mode: screen;
  opacity: 0.78;
  filter: blur(10px) saturate(108%);
  animation: home-hero-glow 12s ease-in-out infinite;
  will-change: transform, opacity;
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

/* 首屏铺满：上主标题 / 下提示与轮播 */
.home-hero__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: var(--max, 1100px);
  margin: 0 auto;
  min-height: 100%;
  padding: 0 20px max(20px, env(safe-area-inset-bottom));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(12px, 3vh, 28px);
  pointer-events: auto;
  text-align: center;
}

.home-hero__top {
  flex-shrink: 0;
  padding-top: calc(env(safe-area-inset-top, 0px) + var(--header-h, 72px) + 12px);
}

/* 仅包住标题文字宽度，避免整行空白区也触发 3D 倾斜 */
.home-hero__headline {
  margin: 0 auto;
  display: block;
  width: fit-content;
  max-width: 100%;
  perspective: 720px;
  cursor: default;
}

.home-hero__headline-inner {
  display: block;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto;
  transform-origin: 50% 55%;
  transform-style: preserve-3d;
  will-change: transform;
  /* 具体时长由内联 style 覆盖；无内联时给兜底 */
  transition: transform 0.68s cubic-bezier(0.33, 1, 0.26, 1);
  cursor: default;
}

.home-hero__headline-inner.home-hero__headline--sway {
  animation: home-headline-sway 5.2s ease-in-out infinite;
}

.home-hero__bottom {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding-bottom: max(4px, env(safe-area-inset-bottom, 0px));
}

/* 首屏互动：校园签 + 心情标签 */
.home-play {
  --home-play-accent: rgba(59, 130, 246, 0.55);
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 200px) minmax(0, 1fr);
  gap: 16px 18px;
  align-items: start;
  padding: 16px 14px;
  border: 1px solid rgba(205, 220, 238, 0.95);
  border-radius: 18px;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.99), rgba(246, 250, 255, 0.94));
  box-shadow: 0 6px 22px rgba(45, 85, 120, 0.05);
  transition:
    border-color 0.28s ease,
    box-shadow 0.28s ease;
}

.home-play--mood-rush {
  --home-play-accent: rgba(37, 99, 235, 0.65);
  border-color: rgba(147, 197, 253, 0.85);
  box-shadow: 0 8px 26px rgba(37, 99, 235, 0.1);
}

.home-play--mood-chill {
  --home-play-accent: rgba(5, 150, 105, 0.55);
  border-color: rgba(167, 243, 208, 0.95);
  box-shadow: 0 8px 26px rgba(5, 150, 105, 0.08);
}

.home-play--mood-coffee {
  --home-play-accent: rgba(146, 64, 14, 0.55);
  border-color: rgba(253, 230, 138, 0.95);
  box-shadow: 0 8px 26px rgba(146, 64, 14, 0.08);
}

.home-play::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(96, 165, 250, 0.12) 45%,
    rgba(59, 130, 246, 0.08) 55%,
    transparent 100%
  );
  transform: translateX(-28%) rotate(14deg);
  opacity: 0.32;
  animation: home-card-sheen 10.5s ease-in-out infinite;
  pointer-events: none;
}

.home-play__col {
  position: relative;
  z-index: 1;
}

.home-play__col--cta {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.home-play__kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--brand-dark) 72%, var(--muted) 28%);
}

.home-play__draw {
  width: 100%;
  justify-content: center;
}

.home-play__col--out {
  min-height: 4.5rem;
  display: flex;
  align-items: center;
}

.home-play__placeholder {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--muted);
}

.home-play__reveal {
  animation: home-play-pop 0.48s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.home-play__tag {
  display: inline-block;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--brand-dark);
  background: linear-gradient(165deg, rgba(239, 246, 255, 0.98), rgba(219, 234, 254, 0.75));
  border: 1px solid rgba(191, 219, 254, 0.95);
}

.home-play__line {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.5;
  font-weight: 600;
  color: var(--text);
}

.home-play__moods {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.home-play__mood {
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.95);
  background: rgba(255, 255, 255, 0.88);
  color: var(--text);
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.15s ease,
    box-shadow 0.18s ease;
}

.home-play__mood:hover {
  border-color: color-mix(in srgb, var(--home-play-accent) 55%, var(--border));
  box-shadow: 0 4px 14px rgba(45, 85, 120, 0.07);
}

.home-play__mood:active {
  transform: scale(0.97);
}

.home-play__mood:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--home-play-accent) 65%, var(--brand));
  outline-offset: 2px;
}

.home-play__mood--on {
  border-color: color-mix(in srgb, var(--home-play-accent) 70%, white);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.99), rgba(239, 246, 255, 0.88));
  box-shadow: 0 6px 18px rgba(45, 95, 150, 0.1);
}

.home-play__mood-emoji {
  margin-right: 4px;
}

.home-play__hint {
  grid-column: 1 / -1;
  margin: 6px 0 0;
  padding: 0 4px;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--muted);
  text-align: center;
  position: relative;
  z-index: 1;
}

.home-play__hint-q {
  color: color-mix(in srgb, var(--text) 72%, var(--muted) 28%);
}

.home-play__hint-by {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--brand-dark) 45%, var(--muted) 55%);
}

@keyframes home-play-pop {
  0% {
    opacity: 0;
    transform: scale(0.94) translateY(8px);
  }
  55% {
    opacity: 1;
    transform: scale(1.02) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 620px) {
  .home-play {
    grid-template-columns: 1fr;
  }

  .home-play__col--cta {
    align-items: center;
  }

  .home-play__draw {
    max-width: 280px;
  }

  .home-play__hint {
    text-align: left;
  }
}

/* 给服务入口补一点“呼吸感”，不改全局样式，只影响首页 */
:deep(.home-lite__service-icon) {
  display: inline-block;
  transform: translateZ(0);
  animation: home-float 5.8s ease-in-out infinite;
  will-change: transform, filter;
}

:deep(.home-lite__service:nth-child(2) .home-lite__service-icon) {
  animation-delay: -1.4s;
}

:deep(.home-lite__service:nth-child(3) .home-lite__service-icon) {
  animation-delay: -2.6s;
}

@keyframes home-float {
  0%,
  100% {
    transform: translateY(0);
    filter: drop-shadow(0 6px 14px rgba(45, 95, 150, 0.12));
  }
  50% {
    transform: translateY(-5px);
    filter: drop-shadow(0 10px 20px rgba(45, 95, 150, 0.18));
  }
}

/* 服务入口卡片：常驻细微流光 + 悬停轻微倾斜 */
:deep(.home-lite__service) {
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
}

:deep(.home-lite__service)::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(96, 165, 250, 0.14) 45%,
    rgba(59, 130, 246, 0.1) 55%,
    transparent 100%
  );
  transform: translateX(-28%) rotate(14deg);
  opacity: 0.35;
  animation: home-card-sheen 10.5s ease-in-out infinite;
  pointer-events: none;
}

:deep(.home-lite__service):hover {
  transform: translateY(-6px) rotateX(4deg) rotateY(-4deg);
}

@keyframes home-card-sheen {
  0%,
  100% {
    transform: translateX(-28%) rotate(14deg);
    opacity: 0.22;
  }
  50% {
    transform: translateX(28%) rotate(14deg);
    opacity: 0.55;
  }
}

/* Banner：微弱呼吸描边（更“新”但不花） */
:deep(.home-lite__banner-item) {
  position: relative;
}

:deep(.home-lite__banner-item)::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 0 0 0 rgba(90, 150, 220, 0), 0 10px 26px rgba(45, 85, 120, 0.06);
  animation: home-border-breathe 4.8s ease-in-out infinite;
  pointer-events: none;
}

:deep(.home-lite__banner-item--fresh)::after {
  animation-delay: -1.6s;
}

:deep(.home-lite__banner-item--market)::after {
  animation-delay: -3.2s;
}

@keyframes home-border-breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(90, 150, 220, 0), 0 10px 26px rgba(45, 85, 120, 0.06);
  }
  50% {
    box-shadow: 0 0 0 2px rgba(140, 190, 240, 0.35), 0 16px 38px rgba(45, 85, 120, 0.09);
  }
}

.home-hero__title {
  margin: 0 0 12px;
  font-size: clamp(3.1rem, 10.5vw, 5.25rem);
  letter-spacing: -0.04em;
  line-height: 1.08;
  font-weight: 800;
  color: #eef5fb;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.22),
    0 1px 3px rgba(0, 0, 0, 0.55),
    0 6px 26px rgba(0, 0, 0, 0.42);
}

.home-hero__lead {
  margin: 0;
  font-size: clamp(1.12rem, 2.8vw, 1.35rem);
  font-weight: 500;
  letter-spacing: 0.03em;
  color: rgba(241, 245, 249, 0.94);
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 4px 18px rgba(0, 0, 0, 0.38);
}

@keyframes home-headline-sway {
  0%,
  100% {
    transform: rotate(-0.55deg) translateY(0);
  }
  25% {
    transform: rotate(0.4deg) translateY(-2px);
  }
  50% {
    transform: rotate(-0.2deg) translateY(1px);
  }
  75% {
    transform: rotate(0.5deg) translateY(-1px);
  }
}

.home-hero__hint {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.62);
  letter-spacing: 0.12em;
  animation: home-hero-hint 2.2s ease-in-out infinite;
}

.home-hero__hint-fade {
  display: inline-block;
  animation: home-hero-hint-fade 3.2s ease-in-out both;
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

@keyframes home-hero-hint-fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes home-hero-glow {
  0%,
  100% {
    opacity: 0.78;
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    opacity: 0.92;
    transform: translate3d(2%, -2%, 0) scale(1.03);
  }
}

.home-hero__sheet {
  position: relative;
  z-index: 1;
  margin-top: 100vh;
  margin-top: 100dvh;
  /* 不强制占满一整屏，避免内容较多时出现额外留白 */
  min-height: auto;
}

.home-hero__sheet-inner {
  border-radius: calc(var(--radius, 16px) + 8px) calc(var(--radius, 16px) + 8px) 0 0;
  padding: 0 env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
  /* 自上而下：承接 hero 深色边缘 → 白/浅蓝灰（简约白蓝） */
  background:
    linear-gradient(
      180deg,
      rgba(22, 33, 52, 0.58) 0px,
      rgba(241, 245, 249, 0.96) min(170px, 24vh),
      color-mix(in srgb, var(--bg) 88%, #e2e8f0 12%) 100%
    ),
    radial-gradient(circle at 82% 8%, rgba(59, 130, 246, 0.1), rgba(148, 163, 184, 0.05), transparent 38%);
  border-top: 1px solid rgba(203, 213, 225, 0.65);
  box-shadow: var(--shadow-soft);
}

/* 去掉全局 .page 底部 padding，避免 sheet 内再留一截空白 */
.home-hero__sheet-inner > .page.home-lite {
  padding-bottom: 0;
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
  /* 下拉面板需要压在后续模块之上（banner/feed 在 hover 时会产生叠层效果） */
  z-index: 2000;
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
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
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
  position: relative;
  will-change: transform, box-shadow;
}

.home-search__tag::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: radial-gradient(circle at var(--hs-x, 50%) var(--hs-y, 50%), rgba(59, 130, 246, 0.14), transparent 55%);
  opacity: 0;
  transition: opacity 0.18s ease;
  pointer-events: none;
}

.home-search__tag:hover::after {
  opacity: 1;
}

.home-search__tag:hover {
  border-color: rgba(191, 219, 254, 0.85);
  background: linear-gradient(180deg, #ffffff, rgba(239, 246, 255, 0.96));
  box-shadow: 0 3px 12px rgba(45, 85, 120, 0.06);
  transform: translateY(-1px);
}

.home-search__tag:active {
  transform: translateY(0) scale(0.97);
}

.home-search__tag:focus-visible {
  outline: none;
  animation: home-focus-ring 1.1s ease-out 1;
  box-shadow: 0 0 0 3px rgba(125, 175, 235, 0.28);
}

.home-search__form {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0;
  border: 1px solid rgba(210, 225, 242, 0.75);
  border-radius: 14px;
  overflow: visible;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.75));
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
  font-size: 0.84rem;
  letter-spacing: -0.02em;
  color: color-mix(in srgb, var(--muted) 85%, #94a3b8);
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
    box-shadow 0.15s ease,
    transform 0.15s ease;
  will-change: transform, box-shadow;
  animation: home-cta-breathe 3.4s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.home-search__submit:hover {
  background: linear-gradient(180deg, rgba(232, 242, 255, 1), rgba(218, 232, 250, 0.96));
  border-color: rgba(165, 198, 235, 0.95);
  box-shadow: 0 4px 14px rgba(45, 95, 140, 0.09);
  transform: translateY(-1px);
}

.home-search__submit:focus {
  outline: none;
}

.home-search__submit:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--brand) 38%, transparent);
  outline-offset: 2px;
}

.home-search__submit:active {
  transform: translateY(0) scale(0.98);
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
  z-index: 9999;
  max-height: min(320px, 50vh);
  overflow-y: auto;
  border-radius: 14px;
  border: 1px solid rgba(210, 225, 242, 0.85);
  background: linear-gradient(180deg, rgba(255, 254, 252, 0.995), rgba(248, 251, 255, 0.97));
  box-shadow: 0 10px 32px rgba(45, 75, 110, 0.07);
}

.home-search__dropdown--teleport {
  position: fixed;
  left: 0;
  top: 0;
  right: auto;
  z-index: 99999;
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

/* 下滑时跟随滚动“擦出来”（scrub）；白底 + 蓝色点缀 */
.home-lite--hero-follow :deep(.home-lite__panel) {
  overflow: visible;
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.99), rgba(241, 245, 249, 0.96));
  border-color: var(--border);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.home-lite--hero-follow :deep(.home-lite__panel)::before {
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(148, 163, 184, 0.06) 42%, transparent 68%);
}

.home-lite--hero-follow .home-lite__eyebrow {
  color: var(--brand-dark);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.92));
  border-color: rgba(191, 219, 254, 0.85);
}

.home-lite--hero-follow .home-hero__sublead {
  color: color-mix(in srgb, var(--text) 70%, var(--brand-dark) 30%);
}

.home-lite--hero-follow .home-play {
  border-color: rgba(226, 232, 240, 0.95);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.95));
}

.home-lite--hero-follow .home-play__tag {
  color: var(--brand);
}

.home-lite--hero-follow .home-lite__banner {
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.92));
  border-color: var(--border);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.home-lite--hero-follow .home-search__label {
  color: color-mix(in srgb, var(--brand-dark) 55%, var(--muted) 45%);
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
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@supports (animation-timeline: scroll()) {
  .home-hero__stage {
    animation: home-hero-parallax linear forwards;
    animation-timeline: scroll(root block);
    animation-range: 0vh 90vh;
  }

  /* 不在滚动时间轴上动画整屏 filter（合成成本极高，易导致上滑掉帧） */

  .home-hero__veil {
    animation: home-hero-veil linear forwards;
    animation-timeline: scroll(root block);
    animation-range: 0vh 90vh;
  }
}

@keyframes home-hero-parallax {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.04);
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

  .home-hero__glow {
    animation: none;
    opacity: 0.82;
    transform: none;
  }

  .home-hero__hint-fade {
    animation: none;
  }

  .home-hero__headline-inner {
    animation: none !important;
  }

  :deep(.home-lite__service-icon) {
    animation: none;
    filter: none;
  }

  :deep(.home-lite__service)::after,
  .home-play::after {
    animation: none;
    opacity: 0;
  }

  :deep(.home-lite__service):hover {
    transform: none;
  }

  .home-play__reveal {
    animation: none;
  }

  :deep(.home-lite__banner-item)::after {
    animation: none;
    box-shadow: none;
  }

  .home-search__submit {
    animation: none;
  }

  .home-search__tag:focus-visible,
  .home-footer__link:focus-visible {
    animation: none;
    box-shadow: 0 0 0 2px rgba(125, 175, 235, 0.3);
  }

  .home-feed__row:hover::after,
  .home-footer__link:hover::after {
    animation: none;
  }

  .home-feed__col::before {
    animation: none;
    opacity: 0.5;
    transform: none;
  }

  .home-feed__col:hover {
    transform: none;
  }

  .home-scroll-scrub {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }

  .home-reveal,
  .home-reveal.is-visible {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    transition: none !important;
  }

  .home-hero__slide {
    transition: none;
  }

  @supports (animation-timeline: scroll()) {
    .home-hero__stage,
    .home-hero__veil {
      animation: none;
    }
  }
}

/* 强制动效兜底：即便系统开启“减少动态效果”，首页也保持新颖动效 */
.home-motion-force .home-hero__headline-inner.home-hero__headline--sway {
  animation: home-headline-sway 5.2s ease-in-out infinite !important;
}

.home-motion-force :deep(.home-lite__service-icon) {
  animation: home-float 5.8s ease-in-out infinite !important;
}

.home-motion-force :deep(.home-lite__service)::after,
.home-motion-force .home-play::after {
  animation: home-card-sheen 10.5s ease-in-out infinite !important;
  opacity: 0.35 !important;
}

.home-motion-force :deep(.home-lite__banner-item)::after {
  animation: home-border-breathe 4.8s ease-in-out infinite !important;
}

.home-motion-force .home-feed__title {
  animation: home-feed-title 6.8s ease-in-out infinite !important;
  color: transparent !important;
}

/* —— 首页下半屏：动态信息流 —— */
.home-feed {
  margin-top: 18px;
  padding: 18px 4px 0;
  /* 让高度完全由内容决定，避免底部被撑出大块空白 */
  display: block;
  position: relative;
}

.home-feed::before {
  content: none;
}

/* 滚动进入后再缓慢显现（模块级） */
.home-reveal {
  opacity: 0;
  transform: translate3d(0, 20px, 0) scale(0.992);
  transition:
    opacity 0.7s ease,
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--reveal-delay, 0ms);
}

.home-reveal.is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

.home-feed > * {
  position: relative;
  z-index: 1;
}

.home-feed__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin: 4px 0 14px;
}

.home-feed__eyebrow {
  margin: 0 0 6px;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brand-dark);
}

.home-feed__title {
  margin: 0;
  font-size: 1.2rem;
  letter-spacing: -0.02em;
  background: linear-gradient(90deg, #1e40af 0%, #2563eb 45%, #3b82f6 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: home-feed-title 6.8s ease-in-out infinite;
}

@keyframes home-feed-title {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.home-feed__more {
  white-space: nowrap;
}

.home-feed__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.home-feed__col {
  border-radius: 20px;
  border: 1px solid var(--border);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.04);
  padding: 14px 14px 12px;
  display: grid;
  gap: 10px;
  align-content: start;
  position: relative;
  overflow: hidden;
}

.home-feed__col::before {
  content: '';
  position: absolute;
  inset: -40% -60%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(96, 165, 250, 0.1) 45%,
    rgba(59, 130, 246, 0.08) 55%,
    transparent 100%
  );
  transform: rotate(8deg) translateX(-20%);
  opacity: 0.75;
  animation: home-shimmer 9s ease-in-out infinite;
  pointer-events: none;
}

.home-feed__col:hover {
  transform: translateY(-2px);
  transition: transform 0.18s ease;
}

@keyframes home-shimmer {
  0%,
  100% {
    transform: rotate(8deg) translateX(-22%);
    opacity: 0.5;
  }
  50% {
    transform: rotate(8deg) translateX(22%);
    opacity: 0.85;
  }
}

.home-feed__col-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.home-feed__col-head strong {
  font-size: 0.98rem;
  letter-spacing: -0.01em;
}

.home-feed__col-more {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--link);
  font-weight: 700;
  transition:
    color 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    text-shadow 0.22s ease,
    letter-spacing 0.2s ease;
}

.home-feed__col-more:hover {
  color: var(--brand-dark);
  transform: translateX(3px);
  text-shadow: 0 0 16px rgba(59, 130, 246, 0.25);
  letter-spacing: 0.03em;
}

.home-feed__col-more:active {
  transform: translateX(1px) scale(0.98);
}

.home-feed__list {
  display: grid;
  gap: 10px;
}

.home-feed__row {
  display: grid;
  gap: 4px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.88);
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  position: relative;
  overflow: hidden;
  will-change: transform, box-shadow;
}

.home-feed__row:hover {
  text-decoration: none;
  transform: translateY(-1px);
  border-color: rgba(175, 205, 238, 0.95);
  box-shadow: 0 10px 22px rgba(45, 85, 120, 0.07);
}

.home-feed__row::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: linear-gradient(90deg, transparent 0%, rgba(120, 175, 240, 0.2) 48%, transparent 100%);
  transform: translateX(-26%) rotate(10deg);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.home-feed__row:hover::after {
  opacity: 1;
  animation: home-row-sheen 1.2s ease;
}

.home-feed__row::before {
  content: '';
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.45), rgba(59, 130, 246, 0.4), rgba(148, 163, 184, 0.35));
  opacity: 0.35;
}

.home-feed__row:hover::before {
  opacity: 0.65;
}

.home-feed__row-title {
  font-weight: 700;
  color: var(--text);
  font-size: 0.92rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.home-feed__row-meta {
  font-size: 0.78rem;
  color: var(--muted);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-feed__empty {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.88rem;
}

/* 与首屏卡片共用 .home-lite__service 色系与圆角；feed 内缩小为横向紧凑条 */
.home-feed__service-tile.home-lite__service {
  width: 100%;
  margin-top: 2px;
  box-sizing: border-box;
  min-height: 0;
  padding: 7px 12px;
  gap: 8px;
  border-radius: 14px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.home-feed__service-tile .home-lite__service-icon {
  font-size: 1.2rem;
}

.home-feed__service-tile.home-lite__service strong {
  font-size: 0.84rem;
  font-weight: 700;
}

.home-footer {
  margin-top: 14px;
  padding: 14px 12px 8px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94));
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  display: grid;
  gap: 10px;
}

.home-data-band {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: linear-gradient(150deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.96));
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.9),
    0 8px 20px rgba(15, 23, 42, 0.05);
  padding: 10px;
}

.home-data-band__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.home-data-band__item {
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.92));
  padding: 8px 6px;
  display: grid;
  justify-items: center;
  gap: 2px;
}

.home-data-band__value {
  font-size: 1.08rem;
  font-weight: 800;
  color: var(--brand-dark);
  letter-spacing: -0.02em;
}

.home-data-band__label {
  font-size: 0.76rem;
  color: var(--muted);
}

.home-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.home-footer__link {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(191, 219, 254, 0.95);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.92));
  font-weight: 700;
  color: var(--brand-dark);
  font-size: 0.85rem;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
  will-change: transform, box-shadow;
}

.home-footer__link:hover {
  text-decoration: none;
  border-color: rgba(147, 197, 253, 0.98);
  background: linear-gradient(165deg, rgba(255, 255, 255, 1), rgba(239, 246, 255, 0.98));
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.home-footer__link:active {
  transform: translateY(0) scale(0.98);
}

.home-footer__link:focus-visible {
  outline: none;
  animation: home-focus-ring 1.1s ease-out 1;
  box-shadow: 0 0 0 3px rgba(125, 175, 235, 0.28);
}

.home-footer__link::after {
  content: '';
  position: absolute;
  inset: -45%;
  background: linear-gradient(90deg, transparent 0%, rgba(120, 175, 240, 0.2) 48%, transparent 100%);
  transform: translateX(-32%) rotate(12deg);
  opacity: 0;
  pointer-events: none;
}

.home-footer__link:hover::after {
  opacity: 1;
  animation: home-row-sheen 1.05s ease;
}

@keyframes home-row-sheen {
  from {
    transform: translateX(-32%) rotate(12deg);
  }
  to {
    transform: translateX(32%) rotate(12deg);
  }
}

@keyframes home-cta-breathe {
  0%,
  100% {
    box-shadow: 0 2px 10px rgba(45, 85, 120, 0.06);
  }
  50% {
    box-shadow: 0 8px 22px rgba(45, 105, 155, 0.16);
  }
}

@keyframes home-focus-ring {
  from {
    box-shadow: 0 0 0 0 rgba(125, 175, 235, 0.35);
  }
  to {
    box-shadow: 0 0 0 8px rgba(125, 175, 235, 0);
  }
}

.home-footer__meta {
  margin: 0;
  text-align: center;
  font-size: 0.82rem;
  color: var(--muted);
}

/* —— 科技感强化：简约白蓝 —— */
.home-motion-force {
  --tech-cyan: #2563eb;
  --tech-blue: #1d4ed8;
  --tech-violet: #3b82f6;
  --tech-border: rgba(148, 163, 184, 0.45);
  --tech-border-strong: rgba(100, 116, 139, 0.55);
  --tech-glow: rgba(37, 99, 235, 0.2);
  --tech-glow-violet: rgba(59, 130, 246, 0.16);
  --tone-base-bg: linear-gradient(180deg, rgba(30, 41, 59, 0.32) 0px, rgba(248, 250, 252, 0.98) min(170px, 24vh), #ffffff 100%);
  --tone-surface-bg: linear-gradient(160deg, rgba(255, 255, 255, 0.99), rgba(241, 245, 249, 0.97));
  --tone-surface-bg-hover: linear-gradient(160deg, rgba(255, 255, 255, 1), rgba(239, 246, 255, 0.98));
  --tone-border: rgba(226, 232, 240, 0.95);
  --tone-border-strong: rgba(203, 213, 225, 0.98);
  --tone-text-strong: #1e40af;
  --tone-text-muted: #64748b;
  --tone-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  --tone-shadow-hover: 0 14px 28px rgba(15, 23, 42, 0.1);
}

/* 极简统一配色：仅保留“基底+表面”两套主色 */
.home-motion-force .home-hero__sheet-inner {
  background: var(--tone-base-bg), radial-gradient(circle at 85% 6%, rgba(59, 130, 246, 0.1), transparent 34%);
  border-top-color: rgba(203, 213, 225, 0.65);
}

.home-motion-force .home-feed__col,
.home-motion-force :deep(.home-lite__panel),
.home-motion-force .home-footer,
.home-motion-force .home-data-band,
.home-motion-force .home-data-band__item,
.home-motion-force .home-search__tag,
.home-motion-force .home-search__submit,
.home-motion-force :deep(.home-lite__service),
.home-motion-force .home-play,
.home-motion-force :deep(.home-lite__banner-item),
.home-motion-force .home-feed__row,
.home-motion-force .home-footer__link {
  background: var(--tone-surface-bg);
  border-color: var(--tone-border);
  box-shadow: var(--tone-shadow), 0 0 0 1px rgba(226, 232, 240, 0.85) inset;
}

.home-motion-force .home-search__tag:hover,
.home-motion-force .home-search__submit:hover,
.home-motion-force :deep(.home-lite__service):hover,
.home-motion-force .home-play:hover,
.home-motion-force :deep(.home-lite__banner-item):hover,
.home-motion-force .home-feed__row:hover,
.home-motion-force .home-footer__link:hover {
  background: var(--tone-surface-bg-hover);
  border-color: var(--tone-border-strong);
  box-shadow: var(--tone-shadow-hover), 0 0 0 1px rgba(165, 188, 235, 0.46) inset, 0 0 14px rgba(66, 124, 215, 0.2);
}

.home-motion-force .home-data-band__value,
.home-motion-force .home-footer__link,
.home-motion-force .home-search__submit {
  color: var(--tone-text-strong);
}

.home-motion-force .home-data-band__label,
.home-motion-force .home-footer__meta {
  color: var(--tone-text-muted);
}

.home-motion-force :deep(.home-lite__panel),
.home-motion-force .home-feed__col {
  border-color: var(--tech-border-strong);
  box-shadow:
    0 14px 30px rgba(11, 24, 56, 0.2),
    0 0 0 1px rgba(77, 102, 176, 0.22) inset;
}

.home-motion-force .home-search__form,
.home-motion-force .home-search__dropdown {
  border-color: var(--tech-border-strong);
}

.home-motion-force .home-search__hit {
  border-bottom-color: rgba(73, 96, 165, 0.42);
}

.home-motion-force .home-feed__col-head {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(73, 96, 165, 0.36);
}

.home-motion-force .home-search__tag,
.home-motion-force .home-search__submit,
.home-motion-force :deep(.home-lite__service),
.home-motion-force .home-play,
.home-motion-force :deep(.home-lite__banner-item),
.home-motion-force .home-feed__row,
.home-motion-force .home-footer__link {
  border-color: var(--tech-border);
  box-shadow:
    0 10px 22px rgba(8, 19, 48, 0.28),
    0 0 0 1px rgba(84, 103, 177, 0.32) inset;
}

.home-motion-force .home-search__tag:hover,
.home-motion-force .home-search__submit:hover,
.home-motion-force :deep(.home-lite__service):hover,
.home-motion-force .home-play:hover,
.home-motion-force :deep(.home-lite__banner-item):hover,
.home-motion-force .home-feed__row:hover,
.home-motion-force .home-footer__link:hover {
  box-shadow:
    0 16px 34px rgba(8, 19, 48, 0.38),
    0 0 0 1px rgba(145, 160, 232, 0.46) inset,
    0 0 18px var(--tech-glow),
    0 0 12px var(--tech-glow-violet);
}

.home-motion-force .home-search__tag,
.home-motion-force .home-feed__row,
.home-motion-force .home-footer__link,
.home-motion-force :deep(.home-lite__service),
.home-motion-force .home-play {
  background-image:
    linear-gradient(155deg, rgba(217, 231, 249, 0.99), rgba(186, 205, 229, 0.97) 52%, rgba(188, 205, 233, 0.95)),
    repeating-linear-gradient(
      0deg,
      rgba(39, 72, 148, 0.14) 0px,
      rgba(39, 72, 148, 0.14) 1px,
      transparent 1px,
      transparent 6px
    );
  background-blend-mode: normal, overlay;
}

.home-motion-force .home-search__submit {
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(59, 130, 246, 0.22) 55%, rgba(148, 163, 184, 0.12)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(241, 245, 249, 0.98));
  color: #1e3a8a;
}

.home-motion-force .home-search__submit::after,
.home-motion-force :deep(.home-lite__service)::before,
.home-motion-force .home-play::before,
.home-motion-force .home-feed__row::after,
.home-motion-force .home-footer__link::after {
  content: '';
  position: absolute;
  inset: -48%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(147, 197, 253, 0.22) 36%,
    rgba(59, 130, 246, 0.2) 56%,
    transparent 100%
  );
  transform: translateX(-34%) rotate(12deg);
  pointer-events: none;
  opacity: 0;
}

.home-motion-force .home-search__submit:hover::after,
.home-motion-force :deep(.home-lite__service):hover::before,
.home-motion-force .home-play:hover::before,
.home-motion-force .home-feed__row:hover::after,
.home-motion-force .home-footer__link:hover::after {
  opacity: 1;
  animation: tech-sweep 1.05s ease;
}

.home-motion-force .home-search__tag:focus-visible,
.home-motion-force .home-search__submit:focus-visible,
.home-motion-force .home-footer__link:focus-visible {
  box-shadow:
    0 0 0 2px rgba(96, 165, 250, 0.55),
    0 0 0 6px rgba(59, 130, 246, 0.18),
    0 0 14px rgba(37, 99, 235, 0.15);
}

@keyframes tech-sweep {
  from {
    transform: translateX(-36%) rotate(12deg);
  }
  to {
    transform: translateX(36%) rotate(12deg);
  }
}

/* 最终收敛：所有主要板块边框与底色统一，避免漏网样式 */
.home-motion-force .home-feed,
.home-motion-force .home-feed__head,
.home-motion-force .home-feed__grid,
.home-motion-force .home-search__surface,
.home-motion-force .home-lite__banner,
.home-motion-force .home-footer__links {
  border-radius: 14px;
}

.home-motion-force .home-feed {
  border: 1px solid var(--tone-border-strong);
  background: var(--tone-surface-bg);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(226, 232, 240, 0.9) inset;
  padding: 16px 12px 10px;
}

.home-motion-force .home-feed__head,
.home-motion-force .home-search__surface,
.home-motion-force .home-lite__banner,
.home-motion-force .home-footer__links {
  border: 1px solid var(--tone-border) !important;
  background: var(--tone-surface-bg) !important;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(226, 232, 240, 0.95) inset !important;
  padding: 10px 12px;
}

.home-motion-force .home-feed__head {
  margin-bottom: 12px;
  /* 最新动态标题区不要做成独立“块”，避免视觉突兀 */
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
  border-radius: 0;
}

.home-motion-force .home-feed__grid {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
}

.home-motion-force .home-lite__banner {
  border-color: var(--tone-border-strong) !important;
}

.home-motion-force .home-search__form,
.home-motion-force .home-search__dropdown,
.home-motion-force .home-feed__col,
.home-motion-force .home-footer,
.home-motion-force .home-data-band,
.home-motion-force .home-data-band__item,
.home-motion-force .home-feed__row,
.home-motion-force .home-footer__link,
.home-motion-force :deep(.home-lite__service),
.home-motion-force .home-play,
.home-motion-force :deep(.home-lite__banner-item),
.home-motion-force :deep(.home-lite__panel) {
  border-color: var(--tone-border-strong) !important;
}

.home-motion-force .home-feed__col-head,
.home-motion-force .home-search__hit,
.home-motion-force .home-footer {
  border-color: rgba(92, 118, 172, 0.42) !important;
}

@media (max-width: 900px) {
  .home-feed__grid {
    grid-template-columns: 1fr;
  }

  .home-data-band__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
