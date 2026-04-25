<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { subscribeWebPush } from '../utils/webPush'

const auth = useAuthStore()
const { token } = storeToRefs(auth)
const route = useRoute()
const pushNotice = ref('')
const pushLoading = ref(false)

async function enableBrowserPush() {
  const bearer = token.value?.trim()
  if (!bearer) return (pushNotice.value = '请先登录。')
  pushLoading.value = true
  pushNotice.value = ''
  try {
    const r = await subscribeWebPush(bearer)
    pushNotice.value = r.ok ? '已开启浏览器推送（新二手消息将尝试通知本机）。' : r.message || '开启失败'
  } catch (e) {
    pushNotice.value = e instanceof Error ? e.message : '开启失败'
  } finally {
    pushLoading.value = false
  }
}
</script>

<template>
  <div class="page ph-page">
    <template v-if="auth.user">
      <header class="ph-heading">
        <span class="ph-heading__bar" aria-hidden="true" />
        <h1 class="ph-heading__title">个人主页</h1>
      </header>

      <div class="ph-layout">
        <aside class="ph-rail" aria-label="主页快捷导航">
          <RouterLink to="/" class="ph-rail__btn" title="首页">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"
              />
            </svg>
          </RouterLink>
          <RouterLink
            to="/profile"
            class="ph-rail__btn"
            :class="{ 'ph-rail__btn--active': route.path === '/profile' }"
            title="个人主页"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          </RouterLink>
          <RouterLink to="/messages" class="ph-rail__btn" title="消息中心">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
              />
            </svg>
          </RouterLink>
          <span class="ph-rail__rule" aria-hidden="true" />
          <RouterLink to="/market" class="ph-rail__btn" title="二手市场">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
              />
            </svg>
          </RouterLink>
          <RouterLink to="/lost-found" class="ph-rail__btn" title="失物招领">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"
              />
            </svg>
          </RouterLink>
        </aside>

        <div class="ph-sheet-wrap">
          <section class="ph-sheet">
            <div class="ph-avatar" aria-hidden="true">{{ auth.user.name.slice(0, 1) }}</div>
            <p class="ph-nick">{{ auth.user.name }}</p>
            <p class="ph-role">{{ auth.user.role === 'teacher' ? '教职工' : '学生' }} · {{ auth.user.department }}</p>

            <div class="ph-pair">
              <div class="ph-mini">
                <RouterLink to="/" class="ph-mini-row ph-mini-row--link">
                  <span class="ph-mini-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
                  </span>
                  <span class="ph-mini-txt">我的服务</span>
                  <span class="ph-mini-meta">入口</span>
                </RouterLink>
                <RouterLink to="/messages" class="ph-mini-row ph-mini-row--link">
                  <span class="ph-mini-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                  </span>
                  <span class="ph-mini-txt">消息通知</span>
                  <span class="ph-mini-meta">消息中心</span>
                </RouterLink>
                <RouterLink to="/change-password" class="ph-mini-row ph-mini-row--link ph-mini-row--last">
                  <span class="ph-mini-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                  </span>
                  <span class="ph-mini-txt">设置中心</span>
                  <span class="ph-mini-meta">安全</span>
                </RouterLink>
              </div>

              <div class="ph-mini">
                <div class="ph-mini-row">
                  <span class="ph-mini-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </span>
                  <span class="ph-mini-txt">姓名</span>
                  <span class="ph-mini-value">{{ auth.user.name }}</span>
                  <svg class="ph-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                </div>
                <div class="ph-mini-row">
                  <span class="ph-mini-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                  </span>
                  <span class="ph-mini-txt">学号</span>
                  <span class="ph-mini-value ph-mini-value--mono">{{ auth.user.studentId }}</span>
                  <svg class="ph-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                </div>
                <div class="ph-mini-row ph-mini-row--last">
                  <span class="ph-mini-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>
                  </span>
                  <span class="ph-mini-txt">学院</span>
                  <span class="ph-mini-value ph-mini-value--sm">{{ auth.user.department }}</span>
                </div>
              </div>
            </div>

            <section class="ph-block" aria-labelledby="ph-svc-title">
              <h2 id="ph-svc-title" class="ph-block__title">
                <span class="ph-block__bar" aria-hidden="true" />
                常用服务
              </h2>
              <div class="ph-services">
                <RouterLink to="/guide" class="ph-svc" title="平台指南">
                  <span class="ph-svc__icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"
                      />
                    </svg>
                  </span>
                  <span class="ph-svc__label">平台指南</span>
                </RouterLink>
                <RouterLink to="/booking" class="ph-svc" title="场馆预约">
                  <span class="ph-svc__icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                      <path fill="currentColor" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                    </svg>
                  </span>
                  <span class="ph-svc__label">图书馆预约</span>
                </RouterLink>
                <span class="ph-svc ph-svc--soon" title="功能开发中" aria-disabled="true">
                  <span class="ph-svc__icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.93c.1 1.05.82 1.84 2.67 1.84s2.47-.69 2.47-1.59c0-.83-.44-1.31-2.67-1.49-2.28-.2-4.08-1.16-4.08-3.13 0-1.89 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.52s4.73.73 4.73 3.44c-.01 1.83-1.38 2.83-3.12 3.16z"
                      />
                    </svg>
                  </span>
                  <span class="ph-svc__label">校园卡充值</span>
                  <span class="ph-svc__badge">敬请期待</span>
                </span>
              </div>
            </section>

            <section class="ph-push" aria-labelledby="ph-push-title">
              <h2 id="ph-push-title" class="ph-block__title ph-block__title--sub">
                <span class="ph-block__bar" aria-hidden="true" />
                消息推送（浏览器）
              </h2>
              <p class="ph-push__hint">开启后可接收二手聊天等新消息提醒，请允许本站通知权限。</p>
              <div class="ph-push__actions">
                <button type="button" class="btn btn--primary" :disabled="pushLoading" @click="enableBrowserPush">
                  {{ pushLoading ? '处理中…' : '开启本机推送' }}
                </button>
              </div>
              <p v-if="pushNotice" class="login__notice ph-push__notice">{{ pushNotice }}</p>
            </section>

            <footer class="ph-foot">
              <button type="button" class="btn btn--ghost ph-foot__logout" @click="auth.logout">退出当前账号</button>
            </footer>
          </section>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="ph-guest">
        <header class="ph-heading">
          <span class="ph-heading__bar" aria-hidden="true" />
          <h1 class="ph-heading__title">个人主页</h1>
        </header>
        <section class="ph-guest-card profile-card">
          <p class="muted">当前登录状态丢失，请先登录后再查看个人主页。</p>
          <div class="profile-actions">
            <RouterLink to="/login" class="btn btn--primary">去登录</RouterLink>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ph-page {
  max-width: 960px;
  background: linear-gradient(180deg, #e8f1ff 0%, #f1f5f9 38%, #ffffff 72%);
  border-radius: 0;
  margin: 0 auto;
  min-height: calc(100vh - var(--header-h, 72px) - 48px);
}

.ph-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
}

.ph-heading__bar {
  width: 4px;
  height: 22px;
  border-radius: 3px;
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  flex-shrink: 0;
}

.ph-heading__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.ph-layout {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.ph-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 22px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.ph-rail__btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #64748b;
  text-decoration: none;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.ph-rail__btn:hover {
  color: #2563eb;
  background: rgba(239, 246, 255, 0.95);
}

.ph-rail__btn--active {
  color: #fff;
  background: linear-gradient(145deg, #3b82f6, #2563eb);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

.ph-rail__btn--active:hover {
  color: #fff;
  background: linear-gradient(145deg, #3b82f6, #1d4ed8);
}

.ph-rail__rule {
  display: block;
  width: 28px;
  height: 1px;
  background: rgba(148, 163, 184, 0.45);
  margin: 4px 0;
}

.ph-sheet-wrap {
  min-width: 0;
}

.ph-sheet {
  position: relative;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 28px;
  padding: 52px 22px 22px;
  box-shadow:
    0 20px 50px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
}

.ph-avatar {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -42%);
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(145deg, #60a5fa, #2563eb);
  border: 4px solid #fff;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.35);
}

.ph-nick {
  margin: 0 0 4px;
  text-align: center;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.ph-role {
  margin: 0 0 20px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
}

.ph-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 22px;
}

.ph-mini {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 4px 4px;
  min-width: 0;
}

.ph-mini-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  color: inherit;
}

.ph-mini-row--last {
  border-bottom: none;
}

.ph-mini-row--link {
  text-decoration: none;
  color: inherit;
  border-radius: 14px;
  margin: 4px;
  padding: 10px 10px;
  border-bottom: none;
  transition: background 0.15s ease;
}

.ph-mini-row--link:hover {
  background: rgba(239, 246, 255, 0.85);
}

.ph-mini-ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.ph-mini-txt {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.ph-mini-meta {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.ph-mini-value {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  text-align: right;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ph-mini-value--mono {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.ph-mini-value--sm {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  white-space: normal;
  line-height: 1.35;
}

.ph-chevron {
  flex-shrink: 0;
  color: #cbd5e1;
}

.ph-block {
  margin-bottom: 18px;
}

.ph-block__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.ph-block__title--sub {
  font-size: 15px;
  margin-bottom: 10px;
}

.ph-block__bar {
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  flex-shrink: 0;
}

.ph-services {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.ph-svc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 8px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e8eef5;
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.ph-svc--soon {
  cursor: default;
  opacity: 0.88;
}

.ph-svc:not(.ph-svc--soon):hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.ph-svc__badge {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.ph-svc__icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(160deg, #eff6ff, #dbeafe);
  display: grid;
  place-items: center;
  color: #2563eb;
}

.ph-svc__label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  text-align: center;
  line-height: 1.35;
}

.ph-push {
  padding: 16px 16px 14px;
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(248, 250, 252, 0.98), rgba(239, 246, 255, 0.55));
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.ph-push__hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.55;
  color: #64748b;
}

.ph-push__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ph-push__notice {
  margin-top: 10px;
  margin-bottom: 0;
}

.ph-foot {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.ph-foot__logout {
  font-size: 14px;
}

.ph-guest {
  max-width: 480px;
  margin: 0 auto;
}

.ph-guest-card {
  border-radius: 22px;
}

@media (max-width: 720px) {
  .ph-layout {
    grid-template-columns: 1fr;
  }

  .ph-rail {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    padding: 12px;
  }

  .ph-rail__rule {
    width: 1px;
    height: 28px;
    margin: 0 6px;
  }

  .ph-pair {
    grid-template-columns: 1fr;
  }

  .ph-services {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ph-svc:not(.ph-svc--soon):hover {
    transform: none;
  }
}
</style>
