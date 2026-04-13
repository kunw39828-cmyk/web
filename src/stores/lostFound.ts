import { defineStore } from 'pinia'
import { ref } from 'vue'
import { lostItems } from '../data/content'

export type LostFoundStatus = '寻找中' | '已认领'
export type LostFoundPost = {
  id: string
  title: string
  place: string
  date: string
  status: LostFoundStatus
  imageUrl?: string
}

export const useLostFoundStore = defineStore('lostFound', () => {
  const items = ref<LostFoundPost[]>([...lostItems])

  function createPost(input: Omit<LostFoundPost, 'id' | 'date'>) {
    items.value.unshift({ ...input, id: `${Date.now()}`, date: new Date().toISOString().slice(0, 10) })
  }

  return { items, createPost }
})
