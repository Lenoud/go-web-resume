import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/infrastructure/store/auth'
import adminRoutes from './admin.js'
import frontendRoutes from './frontend.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [...frontendRoutes, ...adminRoutes],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智慧招聘系统`
  }

  // Admin 路由保护
  if (to.meta.requiresAdminAuth && !auth.isAdminLoggedIn) {
    return { path: '/admin/login', query: { redirect: to.fullPath } }
  }

  // 前台路由保护
  if (to.meta.requiresUserAuth && !auth.isUserLoggedIn) {
    return { path: '/index/login', query: { redirect: to.fullPath } }
  }

  // 角色检查
  const allowedRoles = to.meta.roles
  if (allowedRoles?.length && !allowedRoles.includes(auth.currentUserRole)) {
    // 角色不符时跳转到对应默认页
    return auth.currentUserRole === '2'
      ? { path: '/index/usercenter/myJobView' }
      : { path: '/index/usercenter/myPostView' }
  }
})

export default router
