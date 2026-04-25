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
import ContactUsView from '../views/ContactUsView.vue'
import PlatformGuideView from '../views/PlatformGuideView.vue'
import FeedbackView from '../views/FeedbackView.vue'
import ProfileView from '../views/ProfileView.vue'
import PublishLostFoundView from '../views/PublishLostFoundView.vue'
import PublishNewsView from '../views/PublishNewsView.vue'
import SellProductView from '../views/SellProductView.vue'
import ChangePasswordView from '../views/ChangePasswordView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import { useAuthStore } from '../stores/auth'

const homeCrumb = { label: '首页', to: '/' } as const

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.path !== from.path) {
      return { top: 0, left: 0, behavior: 'auto' }
    }
    return { top: 0, left: 0 }
  },
  routes: [
    { path: '/', component: HomeView, meta: { breadcrumb: [{ label: '首页' }] } },
    {
      path: '/ai-assistant',
      component: AiAssistantView,
      meta: {
        requiresAuth: true,
        breadcrumb: [homeCrumb, { label: 'AI 助手' }],
      },
    },
    { path: '/login', component: LoginView, meta: { hideBreadcrumb: true } },
    { path: '/forgot-password', component: ForgotPasswordView, meta: { hideBreadcrumb: true } },
    {
      path: '/change-password',
      component: ChangePasswordView,
      meta: {
        requiresAuth: true,
        breadcrumb: [homeCrumb, { label: '安全设置', to: '/profile' }, { label: '修改密码' }],
      },
    },
    { path: '/news', component: NewsView, meta: { breadcrumb: [homeCrumb, { label: '通知公告' }] } },
    { path: '/contact', component: ContactUsView, meta: { breadcrumb: [homeCrumb, { label: '联系我们' }] } },
    { path: '/guide', component: PlatformGuideView, meta: { breadcrumb: [homeCrumb, { label: '平台指南' }] } },
    { path: '/feedback', component: FeedbackView, meta: { breadcrumb: [homeCrumb, { label: '意见反馈' }] } },
    {
      path: '/news/publish',
      component: PublishNewsView,
      meta: {
        requiresAuth: true,
        breadcrumb: [homeCrumb, { label: '通知公告', to: '/news' }, { label: '发布公告' }],
      },
    },
    { path: '/lost-found', component: LostFoundView, meta: { breadcrumb: [homeCrumb, { label: '失物寻找' }] } },
    {
      path: '/lost-found/publish',
      component: PublishLostFoundView,
      meta: {
        requiresAuth: true,
        breadcrumb: [homeCrumb, { label: '失物寻找', to: '/lost-found' }, { label: '发布启事' }],
      },
    },
    {
      path: '/lost-found/chat',
      component: LostFoundChatView,
      meta: {
        requiresAuth: true,
        breadcrumb: [homeCrumb, { label: '消息中心', to: '/messages' }, { label: '失物会话' }],
      },
    },
    { path: '/market', component: MarketView, meta: { breadcrumb: [homeCrumb, { label: '二手市场' }] } },
    {
      path: '/market/sell',
      component: SellProductView,
      meta: {
        requiresAuth: true,
        breadcrumb: [homeCrumb, { label: '二手市场', to: '/market' }, { label: '发布闲置' }],
      },
    },
    { path: '/messages', component: MessagesHubView, meta: { requiresAuth: true, breadcrumb: [homeCrumb, { label: '消息中心' }] } },
    {
      path: '/market/chat',
      component: MarketChatView,
      meta: {
        requiresAuth: true,
        breadcrumb: [homeCrumb, { label: '消息中心', to: '/messages' }, { label: '二手会话' }],
      },
    },
    { path: '/booking', component: BookingView, meta: { requiresAuth: true, breadcrumb: [homeCrumb, { label: '场馆预约' }] } },
    {
      path: '/approval',
      component: ApprovalView,
      meta: {
        requiresAuth: true,
        teacherOnly: true,
        breadcrumb: [homeCrumb, { label: '老师审批' }],
      },
    },
    { path: '/profile', component: ProfileView, meta: { requiresAuth: true, breadcrumb: [homeCrumb, { label: '个人中心' }] } },
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
