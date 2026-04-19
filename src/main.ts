import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './index.css'
import { registerServiceWorker } from './utils/webPush'
import { vHoverSpotlight } from './directives/hoverSpotlight'
import { initPetalTrail } from './utils/petalTrail'

void registerServiceWorker()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('hover-spotlight', vHoverSpotlight)
app.mount('#root')

// 鼠标花瓣拖尾（自动跳过触屏/减少动态效果）
initPetalTrail({ maxPerSecond: 60 })
