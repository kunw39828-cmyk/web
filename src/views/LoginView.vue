<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore, type WechatCapabilities } from '../stores/auth'

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
const wxCap = ref<WechatCapabilities | null>(null)
const wxOpenIframeUrl = ref('')
const wxOpenPollId = ref('')
let timer: number | null = null
let openPollTimer: number | null = null

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

watch(tab, (t) => {
  if (t === 'wechat') void loadWxCap()
})

async function loadWxCap() {
  try {
    wxCap.value = await auth.fetchWechatCapabilities()
  } catch {
    wxCap.value = { openQrEnabled: false, mockQrAvailable: true, vapidPublicKey: '' }
  }
}

function stopOpenPoll() {
  if (openPollTimer) window.clearInterval(openPollTimer)
  openPollTimer = null
}

onMounted(() => {
  void loadWxCap()
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  stopOpenPoll()
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

async function createOpenWechatQr() {
  const sid = studentId.value.trim()
  const pwd = password.value
  if ((sid && !pwd) || (!sid && pwd)) {
    notice.value = '首次绑定请同时填写学号与密码；若微信已绑定学号，请把学号、密码都留空再扫码。'
    return
  }
  try {
    isSubmitting.value = true
    stopOpenPoll()
    wxOpenIframeUrl.value = ''
    wxOpenPollId.value = ''
    const body = sid && pwd ? { studentId: sid, password: pwd } : {}
    const r = await auth.initWechatOpen(body)
    wxOpenPollId.value = r.pollId
    wxOpenIframeUrl.value = r.iframeUrl
    wxExpiresAt.value = r.expiresAt
    notice.value = '请使用微信扫描下方网页中的二维码。'
    openPollTimer = window.setInterval(async () => {
      if (!wxOpenPollId.value) return
      try {
        const st = await auth.pollWechatOpen(wxOpenPollId.value)
        if (st.status === 'success' && st.token && st.user) {
          stopOpenPoll()
          auth.completeWechatOpenLogin({ token: st.token, user: st.user })
          router.replace(from.value)
        } else if (st.status === 'failed' || st.status === 'expired') {
          stopOpenPoll()
          notice.value = st.message || '登录失败'
        }
      } catch {
        /* 轮询暂失败，继续 */
      }
    }, 1600)
  } catch (e) {
    notice.value = e instanceof Error ? e.message : '生成失败'
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
    wxExpiresAt.value = session.expiresAt as number
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
        <div>
          <h1>校园综合服务平台</h1>
          <p>学号密码 / 微信扫码（开放平台或演示）</p>
        </div>
      </div>
      <div class="login__card">
        <div class="login__tabs">
          <button type="button" class="login__tab" :class="{ 'login__tab--active': tab === 'password' }" @click="tab = 'password'">
            学号密码登录
          </button>
          <button type="button" class="login__tab" :class="{ 'login__tab--active': tab === 'wechat' }" @click="tab = 'wechat'">
            微信扫码登录
          </button>
        </div>
        <form v-if="tab === 'password'" class="login__form" @submit.prevent="submitPassword">
          <label class="field"><span>学号</span><input v-model="studentId" type="text" /></label>
          <label class="field"><span>密码</span><input v-model="password" type="password" /></label>
          <button class="btn btn--primary btn--block" :disabled="isSubmitting">{{ isSubmitting ? '登录中...' : '登录' }}</button>
        </form>
        <div v-else class="login__wechat">
          <template v-if="wxCap?.openQrEnabled">
            <p class="muted wx-hint">
              已启用<strong>微信开放平台</strong>网站应用扫码。首次绑定：填写学号与密码；仅登录：两项留空。
            </p>
            <label class="field"><span>学号（可选）</span><input v-model="studentId" type="text" autocomplete="username" /></label>
            <label class="field"><span>密码（可选）</span><input v-model="password" type="password" autocomplete="current-password" /></label>
            <div v-if="wxOpenIframeUrl" class="wx-iframe-wrap">
              <iframe :src="wxOpenIframeUrl" title="微信登录" class="wx-iframe" />
            </div>
            <button class="btn btn--primary btn--block" type="button" @click="createOpenWechatQr" :disabled="isSubmitting">
              打开微信扫码页
            </button>
          </template>
          <template v-else>
            <p class="muted wx-hint">演示模式：先在个人中心点「绑定微信」，再于此处输入学号生成示意码，并在手机上确认。</p>
            <label class="field"><span>绑定学号</span><input v-model="studentId" type="text" /></label>
            <div class="qrcode">
              <div class="qrcode__inner">{{ wxQrText || '点击生成二维码' }}</div>
            </div>
            <p v-if="wxSessionId" class="muted">
              状态：{{ wxStatus === 'pending' ? `待确认（${Math.max(0, Math.ceil((wxExpiresAt - Date.now()) / 1000))}s）` : '已过期' }}
            </p>
            <button class="btn btn--primary btn--block" type="button" @click="createWechatQr" :disabled="isSubmitting">生成二维码</button>
            <button
              class="btn btn--ghost btn--block"
              type="button"
              @click="confirmWechat"
              :disabled="isSubmitting || !wxSessionId || wxStatus !== 'pending'"
            >
              我已扫码并确认登录
            </button>
          </template>
        </div>
        <p v-if="notice" class="login__notice">{{ notice }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wx-hint {
  line-height: 1.55;
  margin: 0 0 12px;
}
.wx-iframe-wrap {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  margin: 12px 0;
  min-height: 200px;
  background: #fff;
}
.wx-iframe {
  width: 100%;
  height: 420px;
  border: 0;
}
</style>
