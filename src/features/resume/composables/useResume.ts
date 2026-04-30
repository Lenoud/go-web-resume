import type { ResumeInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { resumeList, resumeCreate, resumeUpdate, resumeDelete } from '@/client'

export type { ResumeInfo }

export function useResumeTable() {
  return useCrudTable<ResumeInfo>({
    queryKey: queryKeys.resumes.all,
    listFn: (params) => resumeList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => resumeCreate({ body: body as Parameters<typeof resumeCreate>[0]['body'] }),
    updateFn: (body) => resumeUpdate({ body: body as Parameters<typeof resumeUpdate>[0]['body'] }),
    deleteFn: (ids) => resumeDelete({ body: { ids } }),
  })
}
