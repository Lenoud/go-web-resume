import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { userUserLogin } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'

export function useAdminLogin() {
  const router = useRouter()
  const auth = useAuthStore()

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const result = await userUserLogin({ body: credentials })
      if (result.error) {
        throw new Error((result.error as Record<string, unknown>)?.msg as string ?? '登录失败')
      }
      return result.data
    },
    onSuccess: (data) => {
      if (!data?.data) {
        message.error('登录失败：服务器未返回数据')
        return
      }
      if (data.code !== 0 && data.code !== 200) {
        message.error(data.msg ?? '登录失败')
        return
      }
      const { token, id, username } = data.data
      auth.setAdminAuth({ token, userId: id, username })
      message.success('登录成功')
      const redirect = router.currentRoute.value.query.redirect as string
      router.push(redirect ?? '/admin/job')
    },
    onError: (err: Error) => {
      message.error(err.message || '登录失败')
    },
  })
}
