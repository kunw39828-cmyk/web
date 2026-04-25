import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './index.css'
import { registerServiceWorker } from './utils/webPush'
import { vHoverSpotlight } from './directives/hoverSpotlight'

void registerServiceWorker()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('hover-spotlight', vHoverSpotlight)
app.mount('#root')
