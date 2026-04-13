<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const notice = ref('')

async function bindWechat() {
  try {
    await auth.bindUserWechat()
    notice.value = '微信绑定成功。'
  } catch (e) {
    notice.value = e instanceof Error ? e.message : '绑定失败'
  }
}
</script>

<template>
  <div v-if="auth.user" class="page">
    <header class="page-header"><h1>个人中心</h1></header>
    <section class="profile-hero">
      <div class="profile-card profile-card--primary">
        <div class="profile-card__avatar">{{ auth.user.name.slice(0,1) }}</div>
        <div class="profile-card__main">
          <h2>{{ auth.user.name }}</h2>
          <p>{{ auth.user.studentId }} · {{ auth.user.department }}</p>
          <div class="profile-badges">
            <span class="pill pill--ok">{{ auth.user.role === 'teacher' ? '教职工身份' : '学生身份' }}</span>
            <span :class="auth.user.wechatBound ? 'pill pill--ok' : 'pill pill--warn'">{{ auth.user.wechatBound ? '微信已绑定' : '微信未绑定' }}</span>
          </div>
        </div>
      </div>
    </section>
    <section class="profile-grid">
      <article class="profile-card">
        <h2>微信绑定</h2>
        <div class="profile-actions">
          <button type="button" class="btn btn--primary" :disabled="auth.user.wechatBound" @click="bindWechat">立即绑定微信</button>
          <button type="button" class="btn btn--ghost" @click="auth.logout">退出当前账号</button>
        </div>
        <p v-if="notice" class="login__notice">{{ notice }}</p>
      </article>
      <article class="profile-card">
        <h2>常用服务</h2>
        <div class="profile-shortcuts">
          <RouterLink to="/booking" class="tile tile--sky profile-shortcut"><h3>场馆预约</h3><span class="tile__more">进入</span></RouterLink>
          <RouterLink to="/news" class="tile tile--sky profile-shortcut"><h3>通知公告</h3><span class="tile__more">进入</span></RouterLink>
        </div>
      </article>
    </section>
  </div>
</template>
