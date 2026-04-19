import { ref, computed, toValue, type MaybeRef } from 'vue'
import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/vue-query'
import { message } from 'ant-design-vue'
import { normalizePaginated } from '@/infrastructure/api/normalize'

/**
 * 通用 CRUD 表格逻辑封装
 *
 * @param options.queryKey   TanStack Query 缓存键
 * @param options.listFn     列表查询 SDK 函数
 * @param options.createFn   创建 SDK 函数
 * @param options.updateFn   更新 SDK 函数
 * @param options.deleteFn   删除 SDK 函数（接收 ids 字符串）
 */
export function useCrudTable<T extends { id?: string }>(options: {
  queryKey: MaybeRef<QueryKey>
  listFn: (params: Record<string, unknown>) => Promise<{ data?: { code?: number; msg?: string; data?: unknown } }>
  createFn?: (body: Record<string, unknown>) => Promise<{ data?: { code?: number; msg?: string } }>
  updateFn?: (body: Record<string, unknown>) => Promise<{ data?: { code?: number; msg?: string } }>
  deleteFn?: (ids: string) => Promise<{ data?: { code?: number; msg?: string } }>
}) {
  const queryClient = useQueryClient()

  // ── 分页参数 ──
  const page = ref(1)
  const pageSize = ref(10)
  const keyword = ref('')

  // ── 列表查询 ──
  const listQuery = useQuery({
    queryKey: computed(() => [
      ...toValue(options.queryKey),
      { page: page.value, pageSize: pageSize.value, keyword: keyword.value },
    ]),
    queryFn: async () => {
      const result = await options.listFn({
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value || undefined,
      })
      const resp = result.data
      if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
        throw new Error(resp?.msg ?? '列表查询失败')
      }
      return normalizePaginated<T>(resp.data)
    },
  })

  // ── 创建 ──
  const createMutation = options.createFn
    ? useMutation({
        mutationFn: (body: Record<string, unknown>) => options.createFn!(body),
        onSuccess: (result) => {
          const resp = result.data
          if (resp && resp.code !== undefined && resp.code !== 0 && resp.code !== 200) {
            message.error(resp.msg ?? '创建失败')
            return
          }
          message.success('创建成功')
          queryClient.invalidateQueries({ queryKey: toValue(options.queryKey) })
        },
        onError: (err: Error) => message.error(err.message || '创建失败'),
      })
    : undefined

  // ── 更新 ──
  const updateMutation = options.updateFn
    ? useMutation({
        mutationFn: (body: Record<string, unknown>) => options.updateFn!(body),
        onSuccess: (result) => {
          const resp = result.data
          if (resp && resp.code !== undefined && resp.code !== 0 && resp.code !== 200) {
            message.error(resp.msg ?? '更新失败')
            return
          }
          message.success('更新成功')
          queryClient.invalidateQueries({ queryKey: toValue(options.queryKey) })
        },
        onError: (err: Error) => message.error(err.message || '更新失败'),
      })
    : undefined

  // ── 删除 ──
  const deleteMutation = options.deleteFn
    ? useMutation({
        mutationFn: (ids: string) => options.deleteFn!(ids),
        onSuccess: (result) => {
          const resp = result.data
          if (resp && resp.code !== undefined && resp.code !== 0 && resp.code !== 200) {
            message.error(resp.msg ?? '删除失败')
            return
          }
          message.success('删除成功')
          queryClient.invalidateQueries({ queryKey: toValue(options.queryKey) })
        },
        onError: (err: Error) => message.error(err.message || '删除失败'),
      })
    : undefined

  // ── 批量删除 ──
  const selectedRowKeys = ref<(string | number)[]>([])

  function batchDelete() {
    if (selectedRowKeys.value.length === 0) {
      message.warning('请先选择要删除的项')
      return
    }
    deleteMutation?.mutate(selectedRowKeys.value.map(String).join(','))
    selectedRowKeys.value = []
  }

  // ── 导出 ──
  return {
    // 分页
    page, pageSize, keyword,
    // 列表
    listQuery,
    list: computed(() => listQuery.data?.value?.list ?? []),
    total: computed(() => listQuery.data?.value?.total ?? 0),
    loading: computed(() => listQuery.isLoading.value),
    // CRUD
    createMutation,
    updateMutation,
    deleteMutation,
    // 批量
    selectedRowKeys,
    batchDelete,
  }
}
