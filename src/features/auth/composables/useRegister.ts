import { useMutation } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { userUserRegister } from '@/client'

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (payload: {
      username: string
      password: string
      rePassword: string
      email?: string
      mobile?: string
      nickname?: string
    }) => {
      const result = await userUserRegister({ body: payload })
      return result.data
    },
    onSuccess: () => {
      message.success('注册成功，请登录')
      router.push('/index/login')
    },
    onError: (err: Error) => {
      message.error(err.message || '注册失败')
    },
  })
}
