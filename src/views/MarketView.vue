<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMarketStore } from '../stores/market'

const auth = useAuthStore()
const market = useMarketStore()
const route = useRoute()
const router = useRouter()
const notice = ref((route.query.created as string) ? '商品创建成功，已发布到二手市集。' : '')
const keywordFilter = ref('')

const displayItems = computed(() => {
  const k = keywordFilter.value.trim().toLowerCase()
  if (!k) return market.items
  return market.items.filter(
    (m) =>
      m.title.toLowerCase().includes(k) ||
      m.campus.toLowerCase().includes(k) ||
      m.seller.toLowerCase().includes(k),
  )
})

function syncKeywordFromRoute() {
  const kw = route.query.keyword
  keywordFilter.value = typeof kw === 'string' ? kw.trim() : ''
}

function formatPrice(value: number) {
  return `¥${value.toFixed(0)}`
}

function contact(item: { id: string | number; title: string; seller: string; sellerId?: string }) {
  if (!auth.isAuthenticated || !auth.user) return (notice.value = '请先登录后再联系卖家。')
  if (item.seller.includes(auth.user.name)) {
    notice.value = '这是你自己发布的商品。'
    return
  }
  router.push({
    path: '/market/chat',
    query: {
      itemId: String(item.id),
      title: item.title,
      seller: item.seller,
      sellerId: item.sellerId || '',
    },
  })
}

onMounted(() => {
  syncKeywordFromRoute()
  market.loadItems().catch((error) => {
    notice.value = error instanceof Error ? error.message : '加载商品失败。'
  })
})

watch(
  () => route.query.keyword,
  () => syncKeywordFromRoute(),
)
</script>

<template>
  <div class="page">
    <header class="page-header"><h1>二手市集</h1><p>老师和学生均可发布、浏览、购买二手商品。</p></header>
    <section class="profile-card">
      <div class="section__head"><h2>交易入口</h2><span :class="auth.isAuthenticated ? 'pill pill--ok' : 'pill pill--warn'">{{ auth.isAuthenticated ? '已登录，可发布和购买' : '未登录，仅可浏览' }}</span></div>
      <div class="profile-actions"><RouterLink to="/market/sell" class="btn btn--primary">我要出售</RouterLink></div>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
    <div class="market-grid">
      <article v-for="m in displayItems" :key="m.id" class="market-card">
        <div class="market-card__top"><h2>{{ m.title }}</h2><p class="price">{{ formatPrice(m.price) }}</p></div>
        <p class="muted">{{ m.seller }} · {{ m.campus }}</p>
        <button type="button" class="btn btn--ghost btn--block" @click="contact(m)">立即联系</button>
      </article>
    </div>
  </div>
</template>
