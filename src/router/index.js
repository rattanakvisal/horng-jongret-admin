import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/session'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
      { path: 'kitchen', name: 'kitchen', component: () => import('@/views/KitchenView.vue') },
      { path: 'menu', name: 'menu', component: () => import('@/views/MenuView.vue') },
      { path: 'categories', name: 'categories', component: () => import('@/views/CategoriesView.vue') },
      { path: 'orders', name: 'orders', component: () => import('@/views/OrdersView.vue') },
      { path: 'messages', name: 'messages', component: () => import('@/views/MessagesView.vue') },
      { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const loggedIn = !!getToken()
  if (to.meta.requiresAuth && !loggedIn) return { name: 'login' }
  if (to.meta.guest && loggedIn) return { name: 'dashboard' }
  return true
})

export default router
