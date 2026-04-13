<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const from = computed(() => (route.query.from as string) || '/')
const tab = ref<'password' | 'wechat'>('password')
const studentId = ref('')
const password = ref('')
const notice = ref('')
const isSubmitting = ref(false)
const wxSessionId = ref('')
const wxQrText = ref('')
const wxExpiresAt = ref(0)
const wxStatus = ref<'idle' | 'pending' | 'expired'>('idle')
let timer: number | null = null

watch(
  () => auth.isAuthenticated,
  (v) => v && router.replace(from.value),
  { immediate: true },
)

watch(wxSessionId, async (id) => {
  if (timer) window.clearInterval(timer)
  if (!id) return
  timer = window.setInterval(async () => {
    const status = await auth.getWechatStatus(id)
    if (status === 'expired') {
      wxStatus.value = 'expired'
      notice.value = '二维码已过期，请重新生成。'
      if (timer) window.clearInterval(timer)
    }
  }, 2000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})

async function submitPassword() {
  if (!studentId.value || !password.value) return (notice.value = '请填写学号和密码。')
  try {
    isSubmitting.value = true
    await auth.passwordLogin(studentId.value, password.value)
    router.replace(from.value)
  } catch (e) {
    notice.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    isSubmitting.value = false
  }
}

async function createWechatQr() {
  if (!studentId.value.trim()) return (notice.value = '请输入已绑定微信的学号。')
  try {
    isSubmitting.value = true
    const session = await auth.createWechatSession(studentId.value)
    wxSessionId.value = session.sessionId
    wxQrText.value = session.qrCodeText
    wxExpiresAt.value = session.expiresAt
    wxStatus.value = 'pending'
    notice.value = '二维码已生成，请扫码确认。'
  } catch (e) {
    notice.value = e instanceof Error ? e.message : '生成失败'
  } finally {
    isSubmitting.value = false
  }
}

async function confirmWechat() {
  if (!wxSessionId.value) return
  try {
    isSubmitting.value = true
    await auth.confirmWechatSession(wxSessionId.value)
    router.replace(from.value)
  } catch (e) {
    notice.value = e instanceof Error ? e.message : '扫码登录失败'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page page--login">
    <div class="login-window">
      <div class="login-window__header">
        <div class="login-window__avatar" aria-hidden="true">校</div>
        <div><h1>校园综合服务平台</h1><p>学号密码 / 微信扫码</p></div>
      </div>
      <div class="login__card">
        <div class="login__tabs">
          <button type="button" class="login__tab" :class="{ 'login__tab--active': tab==='password' }" @click="tab='password'">学号密码登录</button>
          <button type="button" class="login__tab" :class="{ 'login__tab--active': tab==='wechat' }" @click="tab='wechat'">微信扫码登录</button>
        </div>
        <form v-if="tab==='password'" class="login__form" @submit.prevent="submitPassword">
          <label class="field"><span>学号</span><input v-model="studentId" type="text" /></label>
          <label class="field"><span>密码</span><input v-model="password" type="password" /></label>
          <button class="btn btn--primary btn--block" :disabled="isSubmitting">{{ isSubmitting ? '登录中...' : '登录' }}</button>
        </form>
        <div v-else class="login__wechat">
          <label class="field"><span>绑定学号</span><input v-model="studentId" type="text" /></label>
          <div class="qrcode"><div class="qrcode__inner">{{ wxQrText || '点击生成二维码' }}</div></div>
          <p v-if="wxSessionId" class="muted">状态：{{ wxStatus==='pending' ? `待确认（${Math.max(0, Math.ceil((wxExpiresAt-Date.now())/1000))}s）` : '已过期' }}</p>
          <button class="btn btn--primary btn--block" type="button" @click="createWechatQr" :disabled="isSubmitting">生成二维码</button>
          <button class="btn btn--ghost btn--block" type="button" @click="confirmWechat" :disabled="isSubmitting || !wxSessionId || wxStatus!=='pending'">我已扫码并确认登录</button>
        </div>
        <p v-if="notice" class="login__notice">{{ notice }}</p>
      </div>
    </div>
  </div>
</template>
