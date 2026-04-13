<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { newsItems } from '../data/content'

const latest = computed(() => newsItems.slice(0, 2))
const tiles = [
  { to: '/ai-assistant', title: 'AI 服务助手', desc: '智能咨询业务流程。', tone: 'tile--sky' },
  { to: '/news', title: '通知公告', desc: '校园官方消息统一查看。', tone: 'tile--sky' },
  { to: '/lost-found', title: '失物招领', desc: '发布和查看失物信息。', tone: 'tile--teal' },
  { to: '/market', title: '二手市集', desc: '师生二手交易。', tone: 'tile--amber' },
  { to: '/booking', title: '场馆预约', desc: '选择时间段并提交审批。', tone: 'tile--violet' },
]
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">Campus One-Stop</p>
        <h1 class="hero__title">把校园服务装进一个入口</h1>
        <p class="hero__lead">Vue 3 版本，保留通知、预约、交易、失物、登录和 AI 助手模块。</p>
      </div>
      <div class="hero__panel" aria-hidden="true">
        <div class="hero__stat">
          <span class="hero__stat-value">6</span>
          <span class="hero__stat-label">已接入核心模块</span>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="section__head"><h2>服务入口</h2></div>
      <div class="tile-grid">
        <RouterLink v-for="t in tiles" :key="t.to" :to="t.to" :class="`tile ${t.tone}`">
          <h3>{{ t.title }}</h3><p>{{ t.desc }}</p><span class="tile__more">进入</span>
        </RouterLink>
      </div>
    </section>
    <section class="section section--muted">
      <div class="section__head"><h2>近期动态</h2></div>
      <ul class="news-preview">
        <li v-for="n in latest" :key="n.id">
          <article class="news-preview__item">
            <time :datetime="n.date">{{ n.date }}</time><span class="tag">{{ n.tag }}</span>
            <h3><RouterLink to="/news">{{ n.title }}</RouterLink></h3><p>{{ n.summary }}</p>
          </article>
        </li>
      </ul>
    </section>
  </div>
</template>
