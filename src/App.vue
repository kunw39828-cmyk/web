<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const isAuthenticated = computed(() => auth.isAuthenticated)
const user = computed(() => auth.user)
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="topbar__inner">
        <RouterLink to="/" class="brand">
          <span class="brand__mark" aria-hidden="true" />
          <span class="brand__text">校园综合服务平台</span>
        </RouterLink>
        <nav class="nav" aria-label="主导航">
          <RouterLink to="/" class="nav__link">首页</RouterLink>
          <RouterLink to="/ai-assistant" class="nav__link">AI 服务助手</RouterLink>
          <RouterLink to="/news" class="nav__link">通知公告</RouterLink>
          <RouterLink to="/lost-found" class="nav__link">失物招领</RouterLink>
          <RouterLink to="/market" class="nav__link">二手市集</RouterLink>
          <RouterLink to="/booking" class="nav__link">场馆预约</RouterLink>
          <RouterLink v-if="isAuthenticated" to="/profile" class="nav__link">个人中心</RouterLink>
        </nav>
        <div class="topbar__actions">
          <template v-if="isAuthenticated && user">
            <div class="topbar__user">
              <strong>{{ user.name }}</strong>
              <span>{{ user.studentId }} · {{ user.department }}</span>
            </div>
            <RouterLink to="/profile" class="btn btn--ghost">个人中心</RouterLink>
            <button type="button" class="btn btn--ghost" @click="auth.logout">退出登录</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="btn btn--ghost">登录</RouterLink>
            <RouterLink to="/login" class="btn btn--primary">统一认证</RouterLink>
          </template>
        </div>
      </div>
    </header>
    <main class="main">
      <RouterView />
    </main>
    <footer class="footer">
      <p>演示数据为静态占位，后续可对接学校统一身份认证与业务 API。</p>
    </footer>
  </div>
</template>
