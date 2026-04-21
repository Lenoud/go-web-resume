import type { OpLogInfo } from '@/client'
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { oplogOpLogList, oplogLoginLogList } from '@/client'
import { normalizePaginated } from '@/infrastructure/api/normalize'

export type { OpLogInfo }

export function useOpLogTable() {
  const page = ref(1)
  const pageSize = ref(10)

  const listQuery = useQuery({
    queryKey: computed(() => [...queryKeys.opLogs.list({}), { page: page.value, pageSize: pageSize.value }]),
    queryFn: async () => {
      const result = await oplogOpLogList({ query: { page: page.value, pageSize: pageSize.value } })
      return normalizePaginated<OpLogInfo>(result.data?.data)
    },
  })

  function handlePageChange(pag: { current?: number; pageSize?: number }) {
    if (pag.current !== undefined) page.value = pag.current
    if (pag.pageSize !== undefined) pageSize.value = pag.pageSize
  }

  return {
    page, pageSize, handlePageChange,
    listQuery,
    list: computed(() => listQuery.data?.value?.list ?? []),
    total: computed(() => listQuery.data?.value?.total ?? 0),
    loading: computed(() => listQuery.isLoading.value),
  }
}

export function useLoginLogTable() {
  const page = ref(1)
  const pageSize = ref(10)

  const listQuery = useQuery({
    queryKey: computed(() => [...queryKeys.opLogs.loginLogs({}), { page: page.value, pageSize: pageSize.value }]),
    queryFn: async () => {
      const result = await oplogLoginLogList({ query: { page: page.value, pageSize: pageSize.value } })
      return normalizePaginated<OpLogInfo>(result.data?.data)
    },
  })

  function handlePageChange(pag: { current?: number; pageSize?: number }) {
    if (pag.current !== undefined) page.value = pag.current
    if (pag.pageSize !== undefined) pageSize.value = pag.pageSize
  }

  return {
    page, pageSize, handlePageChange,
    listQuery,
    list: computed(() => listQuery.data?.value?.list ?? []),
    total: computed(() => listQuery.data?.value?.total ?? 0),
    loading: computed(() => listQuery.isLoading.value),
  }
}
