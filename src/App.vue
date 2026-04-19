<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useMarketChatNotifyStore } from './stores/marketChatNotify'
import AppBreadcrumbs from './components/AppBreadcrumbs.vue'

const auth = useAuthStore()
const chatNotify = useMarketChatNotifyStore()
const route = useRoute()
const router = useRouter()
const isAuthenticated = computed(() => auth.isAuthenticated)
const user = computed(() => auth.user)
const isHome = computed(() => route.path === '/')

const menuOpen = ref(false)
const onHero = ref(false)
const globalSearch = ref('')
const headerSearchRef = ref<HTMLInputElement | null>(null)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const aiPaletteOpen = ref(false)

const showBreadcrumb = computed(() => !route.meta.hideBreadcrumb)

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeUserMenu() {
  userMenuOpen.value = false
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function toggleAiPalette() {
  aiPaletteOpen.value = !aiPaletteOpen.value
}

function submitHeaderSearch() {
  const q = globalSearch.value.trim()
  if (!q) return
  void router.push({ path: '/', query: { q } })
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
  () => {
    closeMenu()
    closeUserMenu()
    aiPaletteOpen.value = false
  },
)

/** 从首页带 ?q= 进入时，把关键词带到顶栏（不在无 q 时清空，以免覆盖用户正在输入） */
watch(
  () => [route.path, route.query.q] as const,
  ([path, q]) => {
    if (path !== '/' || typeof q !== 'string') return
    globalSearch.value = q
  },
  { immediate: true },
)

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

function onDocClick(e: MouseEvent) {
  const el = userMenuRef.value
  if (!el) return
  if (!el.contains(e.target as Node)) closeUserMenu()
}

function onKeydown(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  const tag = t?.tagName
  const inField = tag === 'INPUT' || tag === 'TEXTAREA' || t?.isContentEditable

  if (e.key === 'Escape') {
    closeMenu()
    closeUserMenu()
    aiPaletteOpen.value = false
    return
  }

  if (e.key === '/' && !inField && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    void nextTick(() => headerSearchRef.value?.focus())
    return
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    toggleAiPalette()
  }
}

function recomputeHeroState() {
  if (!isHome.value) {
    onHero.value = false
    return
  }
  const y = window.scrollY || document.documentElement.scrollTop || 0
  onHero.value = y < 120
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('click', onDocClick)
  recomputeHeroState()
  window.addEventListener('scroll', recomputeHeroState, { passive: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onDocClick)
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

    <header
      class="desktop-header"
      :class="{ 'desktop-header--hero': onHero && isHome }"
    >
      <div class="desktop-header__inner">
        <div class="desktop-header__left">
          <button
            type="button"
            class="desktop-header__burger"
            :class="{ 'desktop-header__burger--open': menuOpen }"
            :aria-expanded="menuOpen"
            aria-controls="main-nav-drawer"
            aria-label="打开菜单"
            @click="toggleMenu"
          >
            <span /><span /><span />
          </button>
          <RouterLink to="/" class="desktop-header__brand" @click="closeMenu">
            <span class="desktop-header__mark" aria-hidden="true" />
            <span class="desktop-header__titles">
              <strong>校园综合服务平台</strong>
              <span>Campus Services</span>
            </span>
          </RouterLink>
        </div>

        <nav class="desktop-header__nav" aria-label="一级导航">
          <RouterLink to="/" class="nav-pill" activeClass="nav-pill--active">首页</RouterLink>
          <RouterLink to="/market" class="nav-pill" activeClass="nav-pill--active">二手市场</RouterLink>
          <RouterLink to="/lost-found" class="nav-pill" activeClass="nav-pill--active">失物寻找</RouterLink>
          <RouterLink to="/ai-assistant" class="nav-pill" activeClass="nav-pill--active">AI 助手</RouterLink>
          <RouterLink
            :to="isAuthenticated ? '/profile' : { path: '/login', query: { from: '/profile' } }"
            class="nav-pill"
            activeClass="nav-pill--active"
            >个人中心</RouterLink
          >
        </nav>

        <div class="desktop-header__right">
          <form class="header-search" role="search" @submit.prevent="submitHeaderSearch">
            <label class="sr-only" for="header-q">全局搜索</label>
            <input
              id="header-q"
              ref="headerSearchRef"
              v-model="globalSearch"
              type="search"
              autocomplete="off"
              placeholder="搜通知、二手、失物、场馆等"
            />
            <button type="submit" class="header-search__btn" aria-label="搜索">⌕</button>
          </form>

          <RouterLink
            v-if="isAuthenticated"
            to="/messages"
            class="header-icon-btn"
            aria-label="消息中心"
            @click="closeMenu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 01-3.46 0"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span v-if="chatNotify.unreadTotal > 0" class="header-icon-btn__dot" />
          </RouterLink>

          <div v-if="isAuthenticated && user" ref="userMenuRef" class="user-menu">
            <button type="button" class="user-menu__trigger" aria-haspopup="true" :aria-expanded="userMenuOpen" @click="toggleUserMenu">
              <span class="user-menu__avatar">{{ user.name.slice(0, 1) }}</span>
              <span class="user-menu__chev" aria-hidden="true">▾</span>
            </button>
            <div v-show="userMenuOpen" class="user-menu__panel" role="menu">
              <RouterLink to="/profile" class="user-menu__item" role="menuitem" @click="closeUserMenu">个人中心</RouterLink>
              <RouterLink to="/messages" class="user-menu__item" role="menuitem" @click="closeUserMenu">消息中心</RouterLink>
              <RouterLink to="/booking" class="user-menu__item" role="menuitem" @click="closeUserMenu">场馆预约</RouterLink>
              <button type="button" class="user-menu__item user-menu__item--danger" role="menuitem" @click="auth.logout(); closeUserMenu()">
                退出登录
              </button>
            </div>
          </div>
          <RouterLink v-else to="/login" class="btn btn--primary header-login">登录</RouterLink>
        </div>
      </div>
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
        <span class="nav-drawer__title">菜单</span>
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
        <nav class="nav-drawer__nav" aria-label="抽屉导航">
          <RouterLink to="/" class="nav-drawer__link" @click="closeMenu">首页</RouterLink>
          <RouterLink to="/market" class="nav-drawer__link" @click="closeMenu">二手市场</RouterLink>
          <RouterLink to="/lost-found" class="nav-drawer__link" @click="closeMenu">失物寻找</RouterLink>
          <RouterLink to="/ai-assistant" class="nav-drawer__link" @click="closeMenu">AI 助手</RouterLink>
          <RouterLink to="/news" class="nav-drawer__link" @click="closeMenu">通知公告</RouterLink>
          <RouterLink
            v-if="isAuthenticated"
            to="/messages"
            class="nav-drawer__link nav-drawer__link--messages"
            @click="closeMenu"
          >
            消息
            <span v-if="chatNotify.unreadTotal > 0" class="nav-badge" aria-label="未读消息">{{
              chatNotify.unreadTotal > 99 ? '99+' : chatNotify.unreadTotal
            }}</span>
          </RouterLink>
          <RouterLink to="/booking" class="nav-drawer__link" @click="closeMenu">场馆预约</RouterLink>
          <RouterLink
            v-if="isAuthenticated && auth.isTeacher"
            to="/approval"
            class="nav-drawer__link"
            @click="closeMenu"
            >老师审批</RouterLink
          >
        </nav>
      </div>
    </aside>

    <Teleport to="body">
      <Transition name="nav-fade">
        <div v-if="aiPaletteOpen" class="ai-palette-backdrop" @click="aiPaletteOpen = false">
          <div
            class="ai-palette"
            role="dialog"
            aria-modal="true"
            aria-label="AI 快捷指令"
            @click.stop
          >
            <header class="ai-palette__head">
              <strong>AI 快捷指令</strong>
              <button type="button" class="ai-palette__x" aria-label="关闭" @click="aiPaletteOpen = false">×</button>
            </header>
            <p class="ai-palette__hint">选择后跳转 AI 助手（需登录）</p>
            <div class="ai-palette__grid">
              <RouterLink to="/ai-assistant" class="ai-palette__chip" @click="aiPaletteOpen = false">场馆预约说明</RouterLink>
              <RouterLink to="/ai-assistant" class="ai-palette__chip" @click="aiPaletteOpen = false">二手发布流程</RouterLink>
              <RouterLink to="/ai-assistant" class="ai-palette__chip" @click="aiPaletteOpen = false">失物招领规则</RouterLink>
              <RouterLink to="/ai-assistant" class="ai-palette__chip" @click="aiPaletteOpen = false">登录与账号</RouterLink>
            </div>
            <p class="ai-palette__kbd">关闭：Esc · 打开：Ctrl/⌘ + K</p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <main class="main">
      <div
        class="main-shell"
        :class="{ 'app-page-skin': route.path !== '/', 'main-shell--home': route.path === '/' }"
      >
        <AppBreadcrumbs v-if="showBreadcrumb" />
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="route-fade">
            <component :is="Component" :key="r.fullPath" />
          </Transition>
        </RouterView>
      </div>
    </main>
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

.desktop-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: var(--header-h, 72px);
  box-sizing: border-box;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);
}

.desktop-header--hero {
  background: linear-gradient(180deg, rgba(35, 48, 72, 0.35), rgba(35, 48, 72, 0.08));
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.desktop-header__inner {
  max-width: var(--max);
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 max(20px, env(safe-area-inset-left)) 0 max(20px, env(safe-area-inset-right));
  padding-top: env(safe-area-inset-top, 0px);
}

.desktop-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.desktop-header__burger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn, 8px);
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.desktop-header__burger > span {
  display: block;
  height: 2px;
  width: 18px;
  margin: 0 auto;
  border-radius: 2px;
  background: var(--text);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.desktop-header--hero .desktop-header__burger > span {
  background: #fff;
}

.desktop-header__burger--open > span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.desktop-header__burger--open > span:nth-child(2) {
  opacity: 0;
}
.desktop-header__burger--open > span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

@media (min-width: 1024px) {
  .desktop-header__burger {
    display: none;
  }
}

.desktop-header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.desktop-header__brand:hover {
  text-decoration: none;
}

.desktop-header__mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #5b82f0, var(--brand), var(--brand-dark));
  box-shadow: 0 6px 16px rgba(65, 105, 226, 0.25);
}

.desktop-header__titles {
  display: none;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

@media (min-width: 640px) {
  .desktop-header__titles {
    display: flex;
  }
}

.desktop-header__titles strong {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.desktop-header--hero .desktop-header__titles strong {
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.desktop-header__titles span {
  font-size: 0.65rem;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.desktop-header--hero .desktop-header__titles span {
  color: rgba(255, 255, 255, 0.75);
}

.desktop-header__nav {
  display: none;
  flex: 1;
  justify-content: center;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  min-width: 0;
}

@media (min-width: 1024px) {
  .desktop-header__nav {
    display: flex;
  }
}

.nav-pill {
  position: relative;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted);
  text-decoration: none;
  border-radius: var(--radius-btn, 8px);
  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.desktop-header--hero .nav-pill {
  color: rgba(255, 255, 255, 0.85);
}

.nav-pill::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 4px;
  height: 2px;
  border-radius: 2px;
  background: var(--brand);
  transform: scaleX(0);
  transition: transform 0.22s ease;
}

.nav-pill:hover {
  color: var(--brand);
  text-decoration: none;
  background: color-mix(in srgb, var(--brand) 8%, transparent);
}

.desktop-header--hero .nav-pill:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.nav-pill--active {
  color: var(--brand);
  font-weight: 800;
}

.desktop-header--hero .nav-pill--active {
  color: #fff;
}

.nav-pill--active::after,
.nav-pill:hover::after {
  transform: scaleX(1);
}

.desktop-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.header-search {
  display: none;
  align-items: center;
  width: 320px;
  max-width: 36vw;
  border: 1px solid var(--border);
  border-radius: var(--radius-btn, 8px);
  background: #fff;
  overflow: hidden;
}

@media (min-width: 1024px) {
  .header-search {
    display: flex;
  }
}

.header-search input {
  flex: 1;
  min-width: 0;
  border: none;
  padding: 12px 16px;
  font: inherit;
  font-size: 0.88rem;
  height: 48px;
  box-sizing: border-box;
}

.header-search input:focus {
  outline: none;
}

.header-search__btn {
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  color: var(--brand);
  font-size: 1.1rem;
  cursor: pointer;
}

.header-icon-btn {
  position: relative;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-btn, 8px);
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.header-icon-btn:hover {
  text-decoration: none;
  border-color: var(--brand);
  color: var(--brand);
}

.header-icon-btn__dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid #fff;
}

.header-login {
  padding: 10px 18px !important;
  font-size: 0.86rem !important;
}

.user-menu {
  position: relative;
}

.user-menu__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  font: inherit;
}

.user-menu__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--brand-dark));
}

.user-menu__chev {
  font-size: 0.7rem;
  color: var(--muted);
  padding-right: 4px;
}

.user-menu__panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 200px;
  padding: 8px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: #fff;
  box-shadow: var(--shadow-modal, 0 20px 40px rgba(0, 0, 0, 0.12));
  z-index: 60;
}

.user-menu__item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius-btn, 8px);
  background: transparent;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
  cursor: pointer;
}

.user-menu__item:hover {
  background: #f1f5f9;
}

.user-menu__item--danger {
  color: #b91c1c;
}

.main {
  flex: 1;
  padding-top: var(--header-h, 72px);
}

.main-shell {
  max-width: var(--max);
  margin: 0 auto;
  padding: 16px var(--content-pad, 24px) 48px;
  width: 100%;
  box-sizing: border-box;
}

.main-shell--home {
  padding-top: 10px;
  padding-bottom: 40px;
}

.nav-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  margin: 0;
  padding: 0;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
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

.ai-palette-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.ai-palette {
  width: 100%;
  max-width: 480px;
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow-modal, 0 20px 40px rgba(0, 0, 0, 0.12));
  border: 1px solid var(--border);
  padding: 0 0 12px;
}

.ai-palette__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}

.ai-palette__x {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-btn, 8px);
  background: #f1f5f9;
  font-size: 1.25rem;
  cursor: pointer;
}

.ai-palette__hint {
  margin: 12px 18px 0;
  font-size: 0.86rem;
  color: var(--muted);
}

.ai-palette__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 18px;
}

.ai-palette__chip {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #f8fafc;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.ai-palette__chip:hover {
  text-decoration: none;
  border-color: var(--brand);
  color: var(--brand);
}

.ai-palette__kbd {
  margin: 8px 18px 0;
  font-size: 0.75rem;
  color: var(--muted);
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
    background 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.2s ease,
    box-shadow 0.22s ease,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-drawer__brand:hover {
  text-decoration: none;
  border-color: rgba(120, 170, 220, 0.5);
  background: linear-gradient(165deg, rgba(255, 255, 255, 1), rgba(242, 248, 255, 0.96));
  box-shadow: 0 10px 26px rgba(60, 120, 180, 0.14);
  transform: translateY(-2px) scale(1.01);
}

.nav-drawer__brand:active {
  transform: translateY(0) scale(0.995);
}

.nav-drawer__brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #5b82f0, var(--brand), var(--brand-dark));
  box-shadow: 0 6px 16px rgba(65, 105, 226, 0.25);
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
    background 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.2s ease,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s ease,
    color 0.18s ease;
}

.nav-drawer__link:hover {
  text-decoration: none;
  background: color-mix(in srgb, var(--brand) 10%, transparent);
  border-color: rgba(180, 205, 235, 0.55);
  transform: translateX(4px);
  box-shadow:
    -4px 0 0 rgba(65, 105, 226, 0.12),
    0 6px 18px rgba(45, 95, 150, 0.08);
  color: var(--brand-dark);
}

.nav-drawer__link:active {
  transform: translateX(2px) scale(0.99);
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
