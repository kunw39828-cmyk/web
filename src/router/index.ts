import { createRouter, createWebHistory } from 'vue-router'
import AiAssistantView from '../views/AiAssistantView.vue'
import BookingView from '../views/BookingView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import LostFoundView from '../views/LostFoundView.vue'
import MarketView from '../views/MarketView.vue'
import NewsView from '../views/NewsView.vue'
import ProfileView from '../views/ProfileView.vue'
import PublishLostFoundView from '../views/PublishLostFoundView.vue'
import PublishNewsView from '../views/PublishNewsView.vue'
import SellProductView from '../views/SellProductView.vue'
import { useAuthStore } from '../stores/auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/ai-assistant', component: AiAssistantView },
    { path: '/login', component: LoginView },
    { path: '/news', component: NewsView },
    { path: '/news/publish', component: PublishNewsView, meta: { requiresAuth: true } },
    { path: '/lost-found', component: LostFoundView },
    { path: '/lost-found/publish', component: PublishLostFoundView, meta: { requiresAuth: true } },
    { path: '/market', component: MarketView },
    { path: '/market/sell', component: SellProductView, meta: { requiresAuth: true } },
    { path: '/booking', component: BookingView, meta: { requiresAuth: true } },
    { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { from: to.fullPath } }
  }
  return true
})
