import type { ResumeInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { resumeResumeList, resumeResumeCreate, resumeResumeUpdate, resumeResumeDelete } from '@/client'

export type { ResumeInfo }

export function useResumeTable() {
  return useCrudTable<ResumeInfo>({
    queryKey: queryKeys.resumes.all,
    listFn: (params) => resumeResumeList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => resumeResumeCreate({ body: body as Parameters<typeof resumeResumeCreate>[0]['body'] }),
    updateFn: (body) => resumeResumeUpdate({ body: body as Parameters<typeof resumeResumeUpdate>[0]['body'] }),
    deleteFn: (ids) => resumeResumeDelete({ body: { ids } }),
  })
}
