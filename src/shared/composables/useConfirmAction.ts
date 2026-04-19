import { message } from 'ant-design-vue'
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/vue-query'
import { toValue, type MaybeRef } from 'vue'

interface ConfirmActionOptions {
  /** 成功提示 */
  successMsg?: string
  /** 失败提示 */
  errorMsg?: string
  /** 执行操作的函数 */
  mutationFn: () => Promise<unknown>
  /** 成功后需要失效的 queryKey */
  invalidateKeys?: MaybeRef<QueryKey>[]
  /** 成功后回调 */
  onSuccess?: () => void
}

/**
 * 带二次确认的操作封装
 * 用于删除、状态变更等需要 Popconfirm 确认的场景
 */
export function useConfirmAction(options: ConfirmActionOptions) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: options.mutationFn,
    onSuccess: () => {
      message.success(options.successMsg ?? '操作成功')
      options.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: toValue(key) })
      })
      options.onSuccess?.()
    },
    onError: (err: Error) => {
      message.error(options.errorMsg ?? err.message ?? '操作失败')
    },
  })

  function execute() {
    mutation.mutate()
  }

  return { execute, mutation }
}
