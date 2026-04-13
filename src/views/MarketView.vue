<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMarketStore } from '../stores/market'

const auth = useAuthStore()
const market = useMarketStore()
const route = useRoute()
const notice = ref((route.query.created as string) ? '商品创建成功，已发布到二手市集。' : '')

function formatPrice(value: number) {
  return `¥${value.toFixed(0)}`
}

function buy(title: string) {
  if (!auth.isAuthenticated || !auth.user) return (notice.value = '请先登录后再购买商品。')
  notice.value = `下单成功：${auth.user.name} 已购买「${title}」。`
}
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
      <article v-for="m in market.items" :key="m.id" class="market-card">
        <div class="market-card__top"><h2>{{ m.title }}</h2><p class="price">{{ formatPrice(m.price) }}</p></div>
        <p class="muted">{{ m.seller }} · {{ m.campus }}</p>
        <button type="button" class="btn btn--ghost btn--block" @click="buy(m.title)">立即购买</button>
      </article>
    </div>
  </div>
</template>
