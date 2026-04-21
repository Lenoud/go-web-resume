import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { message } from 'ant-design-vue'
import { userUserUpdateUserInfo, userUserUpdatePwd, userUserDetail } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

export function useUserInfo() {
  const auth = useAuthStore()

  const query = useQuery({
    queryKey: queryKeys.users.detail(auth.userId),
    queryFn: async () => {
      const result = await userUserDetail({ query: { userId: auth.userId } })
      return result.data?.data
    },
    enabled: !!auth.userId,
  })

  return {
    userInfo: computed(() => query.data?.value),
    loading: computed(() => query.isLoading.value),
    refetch: () => query.refetch(),
  }
}

export function useUpdateUserInfo() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()

  return useMutation({
    mutationFn: (body: { id: string; nickname?: string; email?: string; mobile?: string; pushEmail?: string; pushSwitch?: string }) =>
      userUserUpdateUserInfo({ body }),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(auth.userId) })
    },
    onError: (err: Error) => message.error(err.message || '更新失败'),
  })
}

export function useUpdatePwd() {
  return useMutation({
    mutationFn: (body: { userId: string; oldPassword: string; newPassword: string }) =>
      userUserUpdatePwd({ body }),
    onSuccess: () => {
      message.success('密码修改成功')
    },
    onError: (err: Error) => message.error(err.message || '修改失败'),
  })
}
