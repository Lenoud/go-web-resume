import type { JobInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { jobList, jobUserList, jobCreate, jobUpdate, jobDelete } from '@/client'

export type { JobInfo }

export function useJobTable() {
  return useCrudTable<JobInfo>({
    queryKey: queryKeys.jobs.all,
    listFn: (params) => jobList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => jobCreate({ body: body as Parameters<typeof jobCreate>[0]['body'] }),
    updateFn: (body) => jobUpdate({ body: body as Parameters<typeof jobUpdate>[0]['body'] }),
    deleteFn: (ids) => jobDelete({ body: { ids } }),
  })
}

export function useMyJobTable() {
  return useCrudTable<JobInfo>({
    queryKey: queryKeys.jobs.all,
    listFn: (params) => jobUserList({ query: params as { page?: number; pageSize?: number; keyword?: string } }),
    createFn: (body) => jobCreate({ body: body as Parameters<typeof jobCreate>[0]['body'] }),
    updateFn: (body) => jobUpdate({ body: body as Parameters<typeof jobUpdate>[0]['body'] }),
    deleteFn: (ids) => jobDelete({ body: { ids } }),
  })
}
