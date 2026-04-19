import { defineStore } from 'pinia'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { apiRequest } from '../api/client'
import { useAuthStore } from './auth'

export type Product = {
  id: string | number
  title: string
  price: number
  seller: string
  sellerId?: string
  campus: string
}

export const useMarketStore = defineStore('market', () => {
  const items = ref<Product[]>([])

  async function loadItems() {
    items.value = await apiRequest('/market')
  }

  async function createProduct(input: Omit<Product, 'id' | 'seller'> & { seller?: string }) {
    const auth = useAuthStore()
    const { token } = storeToRefs(auth)
    const bearer = token.value?.trim()
    if (!bearer) throw new Error('请先登录后再操作（登录状态可能已过期，请重新登录）。')
    const created = await apiRequest('/market', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
      body: JSON.stringify(input),
    })
    items.value.unshift(created)
  }

  async function buyProduct(id: string | number) {
    const auth = useAuthStore()
    const { token } = storeToRefs(auth)
    const bearer = token.value?.trim()
    if (!bearer) throw new Error('请先登录后再购买（登录状态可能已过期，请重新登录）。')
    return apiRequest(`/market/${id}/buy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
    })
  }

  return { items, loadItems, createProduct, buyProduct }
})
