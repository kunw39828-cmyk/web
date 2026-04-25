<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNewsStore } from '../stores/news'

const auth = useAuthStore()
const news = useNewsStore()
const route = useRoute()
const notice = ref((route.query.created as string) ? '通知发布成功，已展示在公告列表。' : '')
const canPublish = computed(() => auth.isTeacher)

onMounted(() => {
  news.loadPosts().catch((error) => {
    notice.value = error instanceof Error ? error.message : '加载通知失败。'
  })
})
</script>

<template>
  <div class="page">
    <header class="page-header"><h1>通知公告</h1><p>仅老师可发布，师生都可查看。</p></header>
    <nav class="profile-actions news-page__nav" aria-label="页面导航">
      <RouterLink to="/" class="btn btn--primary">返回首页</RouterLink>
      <RouterLink to="/contact" class="btn btn--ghost">联系我们</RouterLink>
      <RouterLink to="/guide" class="btn btn--ghost">平台指南</RouterLink>
      <RouterLink to="/feedback" class="btn btn--ghost">意见反馈</RouterLink>
    </nav>
    <section class="profile-card">
      <div class="section__head">
        <h2>发布入口</h2>
        <span :class="canPublish ? 'pill pill--ok' : 'pill pill--warn'">{{ canPublish ? '老师可发布' : '当前无发布权限' }}</span>
      </div>
      <div class="profile-actions">
        <RouterLink :to="auth.isAuthenticated ? '/news/publish' : '/login'" class="btn btn--primary">我要发布</RouterLink>
      </div>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
    <ul class="list-cards">
      <li v-for="n in news.posts" :key="n.id">
        <article class="list-card">
          <div class="list-card__meta"><time :datetime="n.date">{{ n.date }}</time><span class="tag">{{ n.tag }}</span></div>
          <h2>{{ n.title }}</h2><p>{{ n.summary }}</p>
          <div v-if="n.imageUrls?.length" class="news-cover-grid">
            <div v-for="url in n.imageUrls" :key="url" class="news-cover"><img :src="url" :alt="`${n.title} 配图`" /></div>
          </div>
          <p class="muted">发布人：{{ n.author }}</p>
        </article>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.news-page__nav {
  margin-bottom: 16px;
}
</style>