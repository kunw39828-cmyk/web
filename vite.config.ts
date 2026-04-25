import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 本地 API：Express 默认 3001（见 server/index.js）。`npm run dev` 与 `npm run preview` 均需代理 /api，否则会落到 SPA HTML → 聊天发消息报「返回了网页而非 JSON」。
const apiProxy = {
  '/api': { target: 'http://localhost:3001', changeOrigin: true },
} as const

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 须另开终端：npm run dev:server，再 npm run dev
      ...apiProxy,
    },
  },
  preview: {
    proxy: {
      ...apiProxy,
    },
  },
})
