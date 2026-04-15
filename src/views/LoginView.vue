<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const from = computed(() => (route.query.from as string) || '/')
const studentId = ref('')
const password = ref('')
const notice = ref('')
const isSubmitting = ref(false)

watch(
  () => auth.isAuthenticated,
  (v) => {
    if (!v) return
    if (auth.user?.mustChangePassword) {
      router.replace({ path: '/change-password', query: { from: from.value } })
      return
    }
    router.replace(from.value)
  },
  { immediate: true },
)

onMounted(() => {
})

onBeforeUnmount(() => {
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
</script>

<template>
  <div class="page page--login">
    <div class="login-window">
      <div class="login-window__glow" aria-hidden="true" />
      <div class="login-window__header">
        <div class="login-window__avatar" aria-hidden="true">校</div>
        <div>
          <h1>校园综合服务平台</h1>
          <p>学号密码登录</p>
        </div>
      </div>
      <div class="login__card">
        <form class="login__form" @submit.prevent="submitPassword">
          <label class="field"><span>学号</span><input v-model="studentId" type="text" /></label>
          <label class="field"><span>密码</span><input v-model="password" type="password" /></label>
          <button class="btn btn--primary btn--block" :disabled="isSubmitting">{{ isSubmitting ? '登录中...' : '登录' }}</button>
        </form>
        <div class="profile-actions">
          <RouterLink :to="{ path: '/forgot-password', query: { from: route.fullPath } }" class="btn btn--ghost">忘记密码</RouterLink>
        </div>
        <p v-if="notice" class="login__notice">{{ notice }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-window {
  position: relative;
  overflow: hidden;
}

.login-window__glow {
  position: absolute;
  width: 280px;
  height: 280px;
  right: -90px;
  top: -130px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(107, 146, 255, 0.35), rgba(107, 146, 255, 0));
  pointer-events: none;
}
</style>
