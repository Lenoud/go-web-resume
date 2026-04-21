import type { JobInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { jobJobList, jobJobUserList, jobJobCreate, jobJobUpdate, jobJobDelete } from '@/client'

export type { JobInfo }

export function useJobTable() {
  return useCrudTable<JobInfo>({
    queryKey: queryKeys.jobs.all,
    listFn: (params) => jobJobList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => jobJobCreate({ body: body as Parameters<typeof jobJobCreate>[0]['body'] }),
    updateFn: (body) => jobJobUpdate({ body: body as Parameters<typeof jobJobUpdate>[0]['body'] }),
    deleteFn: (ids) => jobJobDelete({ body: { ids } }),
  })
}

export function useMyJobTable() {
  return useCrudTable<JobInfo>({
    queryKey: queryKeys.jobs.all,
    listFn: (params) => jobJobUserList({ query: params as { page?: number; pageSize?: number; keyword?: string } }),
    createFn: (body) => jobJobCreate({ body: body as Parameters<typeof jobJobCreate>[0]['body'] }),
    updateFn: (body) => jobJobUpdate({ body: body as Parameters<typeof jobJobUpdate>[0]['body'] }),
    deleteFn: (ids) => jobJobDelete({ body: { ids } }),
  })
}
