import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'ant-design-vue'

/** 业务规则冲突码 — 前端弹 warning 而非 error */
const BIZ_WARN_CODES = new Set([1001, 1002])

import { client } from '@/client/client.gen'
import { useAuthStore } from '@/infrastructure/store/auth'

/**
 * 请求拦截：Token 注入
 * 根据当前路径自动选择 admin token 或 user token
 */
export function attachRequestInterceptor() {
  client.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const auth = useAuthStore()
    const isAdminRoute = window.location.pathname.startsWith('/admin')
    const token = isAdminRoute ? auth.adminToken : auth.userToken

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })
}

/**
 * 响应拦截：业务码校验
 * 后端 code 非 0/200 视为业务错误
 */
export function attachResponseInterceptor() {
  client.instance.interceptors.response.use((response: AxiosResponse) => {
    const body = response.data as Record<string, unknown> | undefined
    if (body && typeof body.code === 'number' && body.code !== 0 && body.code !== 200) {
      const businessCode = body.code as number
      const error = new Error((body.msg as string) ?? '请求失败')
      ;(error as Error & { code: number }).code = businessCode
      if (BIZ_WARN_CODES.has(businessCode)) {
        message.warning(error.message)
      }
      throw error
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
  client.instance.interceptors.response.use(undefined, (error: AxiosError) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      const auth = useAuthStore()
      const isAdmin = window.location.pathname.startsWith('/admin')

      auth.logout(isAdmin)
      const loginPath = isAdmin ? '/admin/login' : '/index/login'
      window.location.href = `${loginPath}?redirect=${encodeURIComponent(window.location.pathname)}`
    }
    return Promise.reject(error)
  })
}
