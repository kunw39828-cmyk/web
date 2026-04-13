import { defineStore } from 'pinia'
import { ref } from 'vue'
import { marketItems } from '../data/content'

export type Product = {
  id: string
  title: string
  price: number
  seller: string
  campus: string
}

export const useMarketStore = defineStore('market', () => {
  const items = ref<Product[]>([...marketItems])

  function createProduct(input: Omit<Product, 'id'>) {
    items.value.unshift({ ...input, id: `${Date.now()}` })
  }

  return { items, createProduct }
})
