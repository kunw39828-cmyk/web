import { defineStore } from 'pinia'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { apiRequest } from '../api/client'
import { useAuthStore } from './auth'

export type LostFoundStatus = '寻找中' | '已认领'
/** 寻物=丢失寻找；招领=捡到招领 */
export type LostFoundKind = '寻物' | '招领'
export type LostFoundPost = {
  id: string | number
  title: string
  place: string
  date: string
  status: LostFoundStatus
  kind?: LostFoundKind
  imageUrl?: string
  /** 发布者学号（服务端从登录账号写入，对应数据库 user_account） */
  publisherId?: string
  publisherName?: string
}

export const useLostFoundStore = defineStore('lostFound', () => {
  const items = ref<LostFoundPost[]>([])

  async function loadItems(keyword?: string, kind?: LostFoundKind | '') {
    const q = new URLSearchParams()
    if (keyword?.trim()) q.set('keyword', keyword.trim())
    if (kind) q.set('kind', kind)
    const qs = q.toString()
    items.value = await apiRequest<LostFoundPost[]>(`/lost-found${qs ? `?${qs}` : ''}`)
  }

  async function createPost(input: Omit<LostFoundPost, 'id' | 'date'>) {
    const auth = useAuthStore()
    const { token } = storeToRefs(auth)
    const bearer = token.value?.trim()
    if (!bearer) {
      throw new Error('请先登录后再发布（登录状态可能已过期，请重新登录）。')
    }
    const created = await apiRequest<LostFoundPost>('/lost-found', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
      body: JSON.stringify(input),
    })
    items.value.unshift(created)
  }

  return { items, loadItems, createPost }
})
