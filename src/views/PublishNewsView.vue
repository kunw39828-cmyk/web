<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNewsStore } from '../stores/news'

const auth = useAuthStore()
const news = useNewsStore()
const router = useRouter()
const title = ref('')
const summary = ref('')
const tag = ref('教务')
const imageUrls = ref<string[]>([])
const notice = ref('')
const canSubmit = computed(() => auth.user?.role === 'teacher' && title.value.trim().length >= 4 && summary.value.trim().length >= 8)

function onImageChange(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  if (files.length > 3) return (notice.value = '最多上传 3 张图片。')
  if (files.some((f) => !f.type.startsWith('image/'))) return (notice.value = '仅支持图片。')
  if (files.some((f) => f.size > 2 * 1024 * 1024)) return (notice.value = '单张不能超过 2MB。')
  imageUrls.value = files.map((f) => URL.createObjectURL(f))
  notice.value = ''
}

function submit() {
  if (!canSubmit.value || !auth.user) return (notice.value = '请完善表单后提交。')
  news.createPost({ title: title.value, summary: summary.value, tag: tag.value, author: auth.user.name, imageUrls: imageUrls.value })
  router.replace('/news?created=1')
}
</script>

<template>
  <div class="page">
    <header class="page-header"><h1>发布校园通知</h1><p>仅老师可发布，支持最多 3 张图片。</p></header>
    <section class="profile-card">
      <form class="login__form" @submit.prevent="submit">
        <label class="field"><span>标题</span><input v-model="title" type="text" /></label>
        <label class="field"><span>分类</span><select v-model="tag"><option>教务</option><option>学工</option><option>后勤</option><option>活动</option></select></label>
        <label class="field"><span>摘要</span><textarea v-model="summary" rows="3" /></label>
        <label class="field"><span>附件图片</span><input type="file" accept="image/*" multiple @change="onImageChange" /></label>
        <div v-if="imageUrls.length" class="upload-preview-grid"><div v-for="url in imageUrls" :key="url" class="upload-preview"><img :src="url" alt="预览" /></div></div>
        <div class="profile-actions"><button class="btn btn--primary" :disabled="!canSubmit">发布通知</button><button type="button" class="btn btn--ghost" @click="router.push('/news')">返回列表</button></div>
      </form>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
  </div>
</template>
