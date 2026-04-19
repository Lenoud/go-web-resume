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
      if (result.error) {
        throw new Error((result.error as Record<string, unknown>)?.msg as string ?? '注册失败')
      }
      return result.data
    },
    onSuccess: (data) => {
      if (data?.code !== undefined && data.code !== 0 && data.code !== 200) {
        message.error(data.msg ?? '注册失败')
        return
      }
      message.success('注册成功，请登录')
      router.push('/index/login')
    },
    onError: (err: Error) => {
      message.error(err.message || '注册失败')
    },
  })
}
