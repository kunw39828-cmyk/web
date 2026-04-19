import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 本地 Express 默认端口 3001（见 server/index.js）。须先起后端，否则终端会刷 ECONNREFUSED：
      //   另开终端执行：npm run dev:server
      // 再执行：npm run dev
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
