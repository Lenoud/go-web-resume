import type { InterviewInfo } from '@/client'
import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { message } from 'ant-design-vue'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { interviewInterviewList, interviewInterviewCreate, interviewInterviewUpdate } from '@/client'

export type { InterviewInfo }

export function useInterviewList(postId: string) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: queryKeys.interviews.list(postId),
    queryFn: async () => {
      const result = await interviewInterviewList({ query: { postId } })
      return (result.data?.data ?? []) as InterviewInfo[]
    },
    enabled: !!postId,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      interviewInterviewCreate({ body: body as Parameters<typeof interviewInterviewCreate>[0]['body'] }),
    onSuccess: () => {
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(postId) })
    },
    onError: (err: Error) => message.error(err.message || '创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      interviewInterviewUpdate({ body: body as Parameters<typeof interviewInterviewUpdate>[0]['body'] }),
    onSuccess: () => {
      message.success('更新成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(postId) })
    },
    onError: (err: Error) => message.error(err.message || '更新失败'),
  })

  return {
    list: computed(() => listQuery.data?.value ?? []),
    loading: computed(() => listQuery.isLoading.value),
    createMutation,
    updateMutation,
  }
}
