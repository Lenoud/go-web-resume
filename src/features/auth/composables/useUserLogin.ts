import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { userUserUserLogin } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'

export function useUserLogin() {
  const router = useRouter()
  const auth = useAuthStore()

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const result = await userUserUserLogin({ body: credentials })
      return result.data
    },
    onSuccess: (data) => {
      const inner = data?.data
      if (!inner) {
        message.error('登录失败：服务器未返回数据')
        return
      }
      const { token, id, username, role } = inner
      auth.setUserAuth({ token, userId: id, username, role })
      message.success('登录成功')
      const redirect = router.currentRoute.value.query.redirect as string
      router.push(redirect ?? '/index/home')
    },
    onError: (err: Error) => {
      message.error(err.message || '登录失败')
    },
  })
}
