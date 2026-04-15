import { createRouter, createWebHistory } from 'vue-router'
import AiAssistantView from '../views/AiAssistantView.vue'
import ApprovalView from '../views/ApprovalView.vue'
import BookingView from '../views/BookingView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import LostFoundView from '../views/LostFoundView.vue'
import MarketView from '../views/MarketView.vue'
import MarketChatView from '../views/MarketChatView.vue'
import MessagesHubView from '../views/MessagesHubView.vue'
import LostFoundChatView from '../views/LostFoundChatView.vue'
import NewsView from '../views/NewsView.vue'
import ProfileView from '../views/ProfileView.vue'
import PublishLostFoundView from '../views/PublishLostFoundView.vue'
import PublishNewsView from '../views/PublishNewsView.vue'
import SellProductView from '../views/SellProductView.vue'
import ChangePasswordView from '../views/ChangePasswordView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import { useAuthStore } from '../stores/auth'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.path !== from.path) {
      return { top: 0, behavior: 'smooth' }
    }
    return { top: 0 }
  },
  routes: [
    { path: '/', component: HomeView },
    { path: '/ai-assistant', component: AiAssistantView, meta: { requiresAuth: true } },
    { path: '/login', component: LoginView },
    { path: '/forgot-password', component: ForgotPasswordView },
    { path: '/change-password', component: ChangePasswordView, meta: { requiresAuth: true } },
    { path: '/news', component: NewsView },
    { path: '/news/publish', component: PublishNewsView, meta: { requiresAuth: true } },
    { path: '/lost-found', component: LostFoundView },
    { path: '/lost-found/publish', component: PublishLostFoundView, meta: { requiresAuth: true } },
    { path: '/lost-found/chat', component: LostFoundChatView, meta: { requiresAuth: true } },
    { path: '/market', component: MarketView },
    { path: '/market/sell', component: SellProductView, meta: { requiresAuth: true } },
    { path: '/messages', component: MessagesHubView, meta: { requiresAuth: true } },
    { path: '/market/chat', component: MarketChatView, meta: { requiresAuth: true } },
    { path: '/booking', component: BookingView, meta: { requiresAuth: true } },
    { path: '/approval', component: ApprovalView, meta: { requiresAuth: true, teacherOnly: true } },
    { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { from: to.fullPath } }
  }
  if (
    auth.isAuthenticated &&
    auth.user?.mustChangePassword &&
    !['/change-password', '/login'].includes(to.path)
  ) {
    return { path: '/change-password', query: { from: to.fullPath } }
  }
  if (to.meta.teacherOnly && !auth.isTeacher) {
    return { path: '/' }
  }
  return true
})
