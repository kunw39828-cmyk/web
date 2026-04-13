<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useLostFoundStore } from '../stores/lostFound'

const auth = useAuthStore()
const store = useLostFoundStore()
const route = useRoute()
const notice = ref((route.query.created as string) ? '失物招领发布成功，已展示在列表。' : '')
</script>

<template>
  <div class="page">
    <header class="page-header"><h1>失物招领</h1><p>支持独立发布页和图片上传。</p></header>
    <section class="profile-card">
      <div class="section__head"><h2>发布入口</h2><span :class="auth.isAuthenticated ? 'pill pill--ok' : 'pill pill--warn'">{{ auth.isAuthenticated ? '已登录，可发布' : '未登录，仅可浏览' }}</span></div>
      <div class="profile-actions"><RouterLink :to="auth.isAuthenticated ? '/lost-found/publish' : '/login'" class="btn btn--primary">我要发布</RouterLink></div>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
    <ul class="table-list">
      <li v-for="item in store.items" :key="item.id" class="table-list__row">
        <div>
          <strong>{{ item.title }}</strong><p class="muted">{{ item.place }}</p>
          <div v-if="item.imageUrl" class="table-list__thumb"><img :src="item.imageUrl" :alt="item.title" /></div>
        </div>
        <time :datetime="item.date">{{ item.date }}</time>
        <span :class="item.status === '已认领' ? 'pill pill--ok' : 'pill pill--warn'">{{ item.status }}</span>
      </li>
    </ul>
  </div>
</template>
