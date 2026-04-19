import { client } from '@/client/client.gen'
import { useAuthStore } from '@/infrastructure/store/auth'

/**
 * 请求拦截：Token 注入
 * 根据当前路径自动选择 admin token 或 user token
 */
export function attachRequestInterceptor() {
  client.interceptors.request.use((request) => {
    const auth = useAuthStore()
    const isAdminRoute = window.location.pathname.startsWith('/admin')
    const token = isAdminRoute ? auth.adminToken : auth.userToken

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  })
}

/**
 * 响应拦截：业务码校验
 * 后端 code 非 0/200 视为业务错误
 */
export function attachResponseInterceptor() {
  client.interceptors.response.use(async (response) => {
    // 克隆响应以便读取 body，同时保留原始响应供后续使用
    const cloned = response.clone()
    try {
      const body = await cloned.json() as Record<string, unknown> | undefined
      if (body && typeof body.code === 'number' && body.code !== 0 && body.code !== 200) {
        const error = new Error((body.msg as string) ?? '请求失败')
        ;(error as Error & { code: number }).code = body.code as number
        throw error
      }
    } catch (e) {
      // 如果是我们抛出的业务错误，继续抛出
      if (e instanceof Error && 'code' in e) {
        throw e
      }
      // JSON 解析失败不影响正常流程（如非 JSON 响应）
    }
    return response
  })
}

/**
 * 401 拦截器闭环：
 * 1. 捕获 401/403 → 清除 token → 跳转登录页
 * 2. 无自动刷新（当前后端 JWT 无 refresh token 机制）
 */
export function attachErrorInterceptor() {
  client.interceptors.error.use((error, response) => {
    if (response?.status === 401 || response?.status === 403) {
      const auth = useAuthStore()
      const isAdmin = window.location.pathname.startsWith('/admin')

      // 当前方案：直接清除 + 跳转
      auth.logout(isAdmin)
      const loginPath = isAdmin ? '/admin/login' : '/index/login'
      window.location.href = `${loginPath}?redirect=${encodeURIComponent(window.location.pathname)}`
    }
    return error
  })
}
