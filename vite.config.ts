import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // Dev: browser calls same-origin /api → forwards to Spring Boot on 3000 (MySQL backend).
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
