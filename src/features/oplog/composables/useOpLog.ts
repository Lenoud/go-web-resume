import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { oplogOpLogList, oplogLoginLogList } from '@/client'
import { normalizePaginated } from '@/infrastructure/api/normalize'

export interface OpLogItem {
  id?: string
  accessTime?: string
  bizCode?: number
  bizMsg?: string
  reUrl?: string
  reMethod?: string
  reIp?: string
  reTime?: string
  reUa?: string
  reContent?: string
  requestId?: string
  success?: string
}

export function useOpLogTable() {
  const page = ref(1)
  const pageSize = ref(10)

  const listQuery = useQuery({
    queryKey: computed(() => [...queryKeys.opLogs.list({}), { page: page.value, pageSize: pageSize.value }]),
    queryFn: async () => {
      const result = await oplogOpLogList({ query: { page: page.value, pageSize: pageSize.value } })
      const resp = result.data
      if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
        throw new Error(resp?.msg ?? '查询失败')
      }
      return normalizePaginated<OpLogItem>(resp.data)
    },
  })

  return {
    page, pageSize,
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
      const resp = result.data
      if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
        throw new Error(resp?.msg ?? '查询失败')
      }
      return normalizePaginated<OpLogItem>(resp.data)
    },
  })

  return {
    page, pageSize,
    listQuery,
    list: computed(() => listQuery.data?.value?.list ?? []),
    total: computed(() => listQuery.data?.value?.total ?? 0),
    loading: computed(() => listQuery.isLoading.value),
  }
}
