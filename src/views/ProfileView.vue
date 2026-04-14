<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { subscribeWebPush } from '../utils/webPush'

const auth = useAuthStore()
const { token } = storeToRefs(auth)
const notice = ref('')
const pushNotice = ref('')
const pushLoading = ref(false)

async function bindWechat() {
  try {
    await auth.bindUserWechat()
    notice.value = '微信绑定成功。'
  } catch (e) {
    notice.value = e instanceof Error ? e.message : '绑定失败'
  }
}

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
  <div class="page">
    <header class="page-header"><h1>个人中心</h1></header>

    <template v-if="auth.user">
      <section class="profile-hero">
        <div class="profile-card profile-card--primary">
          <div class="profile-card__avatar">{{ auth.user.name.slice(0, 1) }}</div>
          <div class="profile-card__main">
            <h2>{{ auth.user.name }}</h2>
            <p>{{ auth.user.studentId }} · {{ auth.user.department }}</p>
            <div class="profile-badges">
              <span class="pill pill--ok">{{ auth.user.role === 'teacher' ? '教职工身份' : '学生身份' }}</span>
              <span :class="auth.user.wechatBound ? 'pill pill--ok' : 'pill pill--warn'">{{
                auth.user.wechatBound ? '微信已绑定' : '微信未绑定'
              }}</span>
            </div>
          </div>
        </div>
      </section>
      <section class="profile-grid">
        <article class="profile-card">
          <h2>微信绑定</h2>
          <p class="muted">演示：一键标记已绑定。生产环境请在登录页使用「微信开放平台」扫码完成首次绑定（需配置 WECHAT_OPEN_*）。</p>
          <div class="profile-actions">
            <button type="button" class="btn btn--primary" :disabled="auth.user.wechatBound" @click="bindWechat">立即绑定微信</button>
            <button type="button" class="btn btn--ghost" @click="auth.logout">退出当前账号</button>
          </div>
          <p v-if="notice" class="login__notice">{{ notice }}</p>
        </article>
        <article class="profile-card">
          <h2>消息推送（浏览器）</h2>
          <p class="muted">基于 Web Push：服务端需配置 VAPID 密钥；请允许本站通知权限。用于二手聊天新消息提醒（非微信内模板消息）。</p>
          <div class="profile-actions">
            <button type="button" class="btn btn--primary" :disabled="pushLoading" @click="enableBrowserPush">
              {{ pushLoading ? '处理中…' : '开启本机推送' }}
            </button>
          </div>
          <p v-if="pushNotice" class="login__notice">{{ pushNotice }}</p>
        </article>
        <article class="profile-card">
          <h2>常用服务</h2>
          <div class="profile-shortcuts">
            <RouterLink to="/booking" class="tile tile--sky profile-shortcut"><h3>场馆预约</h3><span class="tile__more">进入</span></RouterLink>
            <RouterLink to="/news" class="tile tile--sky profile-shortcut"><h3>通知公告</h3><span class="tile__more">进入</span></RouterLink>
          </div>
        </article>
      </section>
    </template>

    <section v-else class="profile-card">
      <p class="muted">当前登录状态丢失，请先登录后再查看个人中心。</p>
      <div class="profile-actions">
        <RouterLink to="/login" class="btn btn--primary">去登录</RouterLink>
      </div>
    </section>
  </div>
</template>
