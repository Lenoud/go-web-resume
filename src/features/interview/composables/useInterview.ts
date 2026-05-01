import type { InterviewInfo } from '@/client'
import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { message } from 'ant-design-vue'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { interviewList, interviewCreate, interviewUpdate } from '@/client'

export type { InterviewInfo }

export function useInterviewList(postId: string) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: queryKeys.interviews.list(postId),
    queryFn: async () => {
      const result = await interviewList({ query: { postId } })
      return (result.data?.data?.list ?? []) as InterviewInfo[]
    },
    enabled: !!postId,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      interviewCreate({ body: body as Parameters<typeof interviewCreate>[0]['body'] }),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(postId) })
    },
    onError: (err: Error & { handled?: boolean }) => { if (!err.handled) message.error(err.message || '创建失败') },
  })

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      interviewUpdate({ body: body as Parameters<typeof interviewUpdate>[0]['body'] }),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(postId) })
    },
    onError: (err: Error & { handled?: boolean }) => { if (!err.handled) message.error(err.message || '更新失败') },
  })

  return {
    list: computed(() => listQuery.data?.value ?? []),
    loading: computed(() => listQuery.isLoading.value),
    createMutation,
    updateMutation,
  }
}
