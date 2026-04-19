<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLostFoundStore, type LostFoundKind } from '../stores/lostFound'
import { fileToCompressedDataUrl } from '../utils/image'

const router = useRouter()
const store = useLostFoundStore()
const title = ref('')
const place = ref('')
const kind = ref<LostFoundKind>('寻物')
const status = ref<'寻找中' | '已认领'>('寻找中')
const imageUrl = ref('')
const notice = ref('')
const compressing = ref(false)
const canSubmit = computed(() => title.value.trim().length >= 2 && place.value.trim().length >= 2)

async function onImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return void (notice.value = '仅支持图片文件。')
  notice.value = ''
  compressing.value = true
  try {
    imageUrl.value = await fileToCompressedDataUrl(file, 960, 0.82)
  } catch {
    notice.value = '图片处理失败，请换一张较小的图片。'
  } finally {
    compressing.value = false
  }
}

async function submit() {
  if (!canSubmit.value) return (notice.value = '请完整填写物品名称和地点。')
  try {
    await store.createPost({
      title: title.value.trim(),
      place: place.value.trim(),
      status: status.value,
      kind: kind.value,
      imageUrl: imageUrl.value || undefined,
    })
    router.replace('/lost-found?created=1')
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '发布失败。'
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>发布失物招领</h1>
      <p>选择「寻物」或「招领」，建议上传清晰照片便于辨认。发布人固定为当前登录账号（须在用户库中可查）。</p>
    </header>
    <section class="profile-card">
      <form class="login__form" @submit.prevent="submit">
        <label class="field">
          <span>分类</span>
          <select v-model="kind">
            <option value="寻物">寻物（我丢失了物品）</option>
            <option value="招领">招领（我捡到物品）</option>
          </select>
        </label>
        <label class="field"><span>物品名称</span><input v-model="title" type="text" placeholder="简要描述物品" /></label>
        <label class="field"><span>地点</span><input v-model="place" type="text" placeholder="丢失/拾得的大致位置" /></label>
        <label class="field">
          <span>状态</span>
          <select v-model="status"><option value="寻找中">寻找中</option><option value="已认领">已认领</option></select>
        </label>
        <label class="field">
          <span>实物照片</span>
          <input type="file" accept="image/*" :disabled="compressing" @change="onImage" />
        </label>
        <p v-if="compressing" class="muted">正在压缩图片…</p>
        <div v-if="imageUrl" class="upload-preview"><img :src="imageUrl" alt="预览" /></div>
        <div class="profile-actions">
          <button type="submit" class="btn btn--primary" :disabled="!canSubmit || compressing">发布信息</button>
          <button type="button" class="btn btn--ghost" @click="router.push('/lost-found')">返回列表</button>
        </div>
      </form>
      <p v-if="notice" class="login__notice">{{ notice }}</p>
    </section>
  </div>
</template>
