import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { message } from 'ant-design-vue'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { interviewInterviewList, interviewInterviewCreate, interviewInterviewUpdate } from '@/client'

export interface InterviewItem {
  id?: string
  postId: string
  round?: string
  type?: string
  interviewerId?: string
  interviewerName?: string
  scheduledAt?: string
  location?: string
  score?: string
  result?: string
  evaluation?: string
  createTime?: string
}

export function useInterviewList(postId: string) {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: queryKeys.interviews.list(postId),
    queryFn: async () => {
      const result = await interviewInterviewList({ query: { postId } })
      const resp = result.data
      if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
        throw new Error(resp?.msg ?? '查询失败')
      }
      return (resp.data ?? []) as InterviewItem[]
    },
    enabled: !!postId,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      interviewInterviewCreate({ body: body as Parameters<typeof interviewInterviewCreate>[0]['body'] }),
    onSuccess: (result) => {
      const resp = result.data
      if (resp && resp.code !== undefined && resp.code !== 0 && resp.code !== 200) {
        message.error(resp.msg ?? '创建失败')
        return
      }
      message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.list(postId) })
    },
    onError: (err: Error) => message.error(err.message || '创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      interviewInterviewUpdate({ body: body as Parameters<typeof interviewInterviewUpdate>[0]['body'] }),
    onSuccess: (result) => {
      const resp = result.data
      if (resp && resp.code !== undefined && resp.code !== 0 && resp.code !== 200) {
        message.error(resp.msg ?? '更新失败')
        return
      }
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
