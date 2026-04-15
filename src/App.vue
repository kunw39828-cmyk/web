<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useMarketChatNotifyStore } from './stores/marketChatNotify'

const auth = useAuthStore()
const chatNotify = useMarketChatNotifyStore()
const route = useRoute()
const isAuthenticated = computed(() => auth.isAuthenticated)
const user = computed(() => auth.user)
const isHome = computed(() => route.path === '/')

const menuOpen = ref(false)
const onHero = ref(false)

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

watch(
  () => auth.isAuthenticated,
  (loggedIn) => {
    if (loggedIn) chatNotify.startPolling()
    else {
      chatNotify.stopPolling()
      void chatNotify.refresh()
    }
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => closeMenu(),
)

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeMenu()
}

function recomputeHeroState() {
  if (!isHome.value) {
    onHero.value = false
    return
  }
  // 首页：仅在首屏顶部时把顶栏融入封面图片
  const y = window.scrollY || document.documentElement.scrollTop || 0
  onHero.value = y < 120
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  recomputeHeroState()
  window.addEventListener('scroll', recomputeHeroState, { passive: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', recomputeHeroState)
  chatNotify.stopPolling()
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="shell">
    <div class="shell-bg" aria-hidden="true">
      <span class="shell-bg__blob shell-bg__blob--one" />
      <span class="shell-bg__blob shell-bg__blob--two" />
      <span class="shell-bg__blob shell-bg__blob--three" />
    </div>

    <!-- 整条顶栏即「菜单」入口，无独立 Logo / 登录条 -->
    <header class="topbar topbar--menu-bar" :class="{ 'topbar--hero': onHero }">
      <button
        type="button"
        class="topbar__menu-strip"
        :class="{ 'topbar__menu-strip--hero': onHero }"
        :aria-expanded="menuOpen"
        aria-controls="main-nav-drawer"
        @click="toggleMenu"
      >
        <span
          class="topbar__burger"
          :class="{ 'topbar__burger--open': menuOpen, 'topbar__burger--hero': onHero }"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </span>
        <span class="topbar__menu-label" :class="{ 'topbar__menu-label--hero': onHero }">菜单</span>
        <span class="topbar__menu-hint" :class="{ 'topbar__menu-hint--hero': onHero }">全站导航 · 账户</span>
      </button>
    </header>

    <Transition name="nav-fade">
      <button
        v-if="menuOpen"
        type="button"
        class="nav-backdrop"
        aria-label="关闭菜单"
        tabindex="-1"
        @click="closeMenu"
      />
    </Transition>
    <aside
      id="main-nav-drawer"
      class="nav-drawer"
      :class="{ 'nav-drawer--open': menuOpen }"
      :aria-hidden="!menuOpen"
    >
      <div class="nav-drawer__head">
        <span class="nav-drawer__title">校园服务</span>
        <button type="button" class="nav-drawer__close" aria-label="关闭菜单" @click="closeMenu">×</button>
      </div>

      <div class="nav-drawer__body">
        <RouterLink to="/" class="nav-drawer__brand" @click="closeMenu">
          <span class="nav-drawer__brand-mark" aria-hidden="true" />
          <span class="nav-drawer__brand-text">
            <strong>校园综合服务平台</strong>
            <span>Campus IM</span>
          </span>
        </RouterLink>

        <div class="nav-drawer__account">
          <template v-if="isAuthenticated && user">
            <div class="nav-drawer__user">
              <strong>{{ user.name }}</strong>
              <span>{{ user.studentId }} · {{ user.department }}</span>
            </div>
            <div class="nav-drawer__account-actions">
              <RouterLink to="/profile" class="btn btn--ghost btn--block" @click="closeMenu">个人中心</RouterLink>
              <button type="button" class="btn btn--ghost btn--block" @click="auth.logout(); closeMenu()">
                退出登录
              </button>
            </div>
          </template>
          <template v-else>
            <div class="nav-drawer__account-actions">
              <RouterLink to="/login" class="btn btn--primary btn--block" @click="closeMenu">登录</RouterLink>
            </div>
          </template>
        </div>

        <p class="nav-drawer__section-label">功能导航</p>
        <nav class="nav-drawer__nav" aria-label="主导航">
          <RouterLink to="/" class="nav-drawer__link" v-hover-spotlight @click="closeMenu">首页</RouterLink>
          <RouterLink to="/ai-assistant" class="nav-drawer__link" v-hover-spotlight @click="closeMenu">AI 服务助手</RouterLink>
          <RouterLink to="/news" class="nav-drawer__link" v-hover-spotlight @click="closeMenu">通知公告</RouterLink>
          <RouterLink to="/lost-found" class="nav-drawer__link" v-hover-spotlight @click="closeMenu">失物招领</RouterLink>
          <RouterLink to="/market" class="nav-drawer__link" v-hover-spotlight @click="closeMenu">二手市集</RouterLink>
          <RouterLink
            v-if="isAuthenticated"
            to="/messages"
            class="nav-drawer__link nav-drawer__link--messages"
            v-hover-spotlight
            @click="closeMenu"
          >
            消息
            <span v-if="chatNotify.unreadTotal > 0" class="nav-badge" aria-label="未读消息">{{
              chatNotify.unreadTotal > 99 ? '99+' : chatNotify.unreadTotal
            }}</span>
          </RouterLink>
          <RouterLink to="/booking" class="nav-drawer__link" v-hover-spotlight @click="closeMenu">场馆预约</RouterLink>
          <RouterLink
            v-if="isAuthenticated && auth.isTeacher"
            to="/approval"
            class="nav-drawer__link"
            v-hover-spotlight
            @click="closeMenu"
            >老师审批</RouterLink
          >
        </nav>
      </div>
    </aside>

    <main class="main">
      <div class="main__inner">
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="route-fade" mode="out-in">
            <component :is="Component" :key="r.fullPath" />
          </Transition>
        </RouterView>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 整条顶栏 = 菜单条 */
.topbar--menu-bar {
  padding: 0;
}

.topbar--hero {
  background: transparent;
  border-bottom-color: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.topbar__menu-strip {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  padding-top: max(12px, env(safe-area-inset-top));
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background 0.15s ease;
}

.topbar__menu-strip--hero {
  /* 取自首页封面 veil 的深色系，做成轻薄玻璃感 */
  background: linear-gradient(
    180deg,
    rgba(35, 48, 72, 0.42) 0%,
    rgba(40, 55, 75, 0.18) 55%,
    rgba(35, 48, 72, 0.02) 100%
  );
  border-bottom: 1px solid rgba(180, 210, 245, 0.18);
  backdrop-filter: blur(14px) saturate(118%);
  -webkit-backdrop-filter: blur(14px) saturate(118%);
}

.topbar__menu-strip:hover {
  background: color-mix(in srgb, var(--brand) 7%, rgba(255, 252, 248, 0.92));
}

.topbar__menu-strip--hero:hover {
  background: linear-gradient(
    180deg,
    rgba(35, 48, 72, 0.5) 0%,
    rgba(40, 55, 75, 0.22) 55%,
    rgba(35, 48, 72, 0.04) 100%
  );
}

.topbar__menu-strip:focus {
  outline: none;
}

.topbar__menu-strip:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--brand) 42%, transparent);
  outline-offset: -2px;
}

.topbar__menu-strip--hero:focus-visible {
  outline: 2px solid rgba(200, 225, 255, 0.35);
  outline-offset: -2px;
}

.topbar__burger {
  display: grid;
  gap: 4px;
  width: 20px;
  flex-shrink: 0;
}

.topbar__burger > span {
  display: block;
  height: 2px;
  border-radius: 2px;
  background: var(--brand-dark);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.topbar__burger--hero > span {
  background: rgba(255, 252, 248, 0.92);
}

.topbar__burger--open > span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.topbar__burger--open > span:nth-child(2) {
  opacity: 0;
}

.topbar__burger--open > span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.topbar__menu-label {
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--text);
  letter-spacing: 0.02em;
}

.topbar__menu-label--hero {
  color: rgba(255, 250, 245, 0.96);
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.22);
}

.topbar__menu-hint {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 500;
}

.topbar__menu-hint--hero {
  color: rgba(255, 250, 245, 0.7);
}

.nav-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  margin: 0;
  padding: 0;
  border: none;
  /* 与正文 --text 同色相的暖褐遮罩，避免冷灰浮在暖纸背景上 */
  background: color-mix(in srgb, var(--text) 38%, transparent);
  cursor: pointer;
  appearance: none;
}

.nav-fade-enter-active,
.nav-fade-leave-active {
  transition: opacity 0.22s ease;
}

.nav-fade-enter-from,
.nav-fade-leave-to {
  opacity: 0;
}

.nav-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100;
  width: min(340px, 92vw);
  height: 100vh;
  height: 100dvh;
  padding: 0 0 env(safe-area-inset-bottom, 0);
  /* 对齐首页 .home-lite__panel：暖白 + 极淡青蓝高光 */
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(248, 252, 255, 0.94));
  border-left: 1px solid rgba(210, 225, 242, 0.88);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px) saturate(108%);
  -webkit-backdrop-filter: blur(12px) saturate(108%);
  transform: translateX(100%);
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.nav-drawer--open {
  transform: translateX(0);
  pointer-events: auto;
}

.nav-drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  padding-top: max(12px, env(safe-area-inset-top));
  flex-shrink: 0;
}

.nav-drawer__title {
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.nav-drawer__close {
  width: 40px;
  height: 40px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: var(--line-subtle);
  color: var(--text);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.nav-drawer__close:hover {
  background: color-mix(in srgb, var(--brand) 12%, var(--surface));
  border-color: rgba(195, 215, 238, 0.65);
}

.nav-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nav-drawer__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(210, 225, 242, 0.9);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 255, 0.92));
  text-decoration: none;
  color: inherit;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.nav-drawer__brand:hover {
  text-decoration: none;
  border-color: rgba(120, 170, 220, 0.5);
  background: linear-gradient(165deg, rgba(255, 255, 255, 1), rgba(242, 248, 255, 0.96));
  box-shadow: 0 8px 22px rgba(60, 120, 180, 0.1);
}

.nav-drawer__brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #4f8ad4 0%, #3d7cc8 42%, #3aa89a 100%);
  box-shadow:
    0 8px 18px rgba(45, 100, 160, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.35) inset;
}

.nav-drawer__brand-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.nav-drawer__brand-text strong {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.nav-drawer__brand-text span {
  font-size: 0.68rem;
  color: var(--muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.nav-drawer__account {
  padding: 0 4px;
}

.nav-drawer__user {
  margin-bottom: 10px;
  padding: 0 8px;
}

.nav-drawer__user strong {
  display: block;
  font-size: 0.92rem;
}

.nav-drawer__user span {
  font-size: 0.78rem;
  color: var(--muted);
}

.nav-drawer__account-actions {
  display: grid;
  gap: 8px;
}

.nav-drawer__section-label {
  margin: 4px 0 0;
  padding: 0 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.nav-drawer__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-drawer__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  color: var(--text);
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  border: 1px solid transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.nav-drawer__link:hover {
  text-decoration: none;
  background: color-mix(in srgb, var(--brand) 10%, transparent);
  border-color: rgba(180, 205, 235, 0.55);
}

.nav-drawer__link.router-link-active,
.nav-drawer__link.router-link-exact-active {
  color: var(--brand-dark);
  background: color-mix(in srgb, var(--brand) 14%, transparent);
  border-color: rgba(160, 195, 235, 0.72);
}

.nav-drawer__link--messages {
  position: relative;
}

.nav-badge {
  display: inline-block;
  min-width: 1.25rem;
  padding: 0 6px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.25rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #e85d7a, #d9466a);
  color: #fff;
  box-shadow: 0 2px 8px rgba(200, 70, 100, 0.25);
}
</style>
