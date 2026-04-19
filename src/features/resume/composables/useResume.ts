import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { resumeResumeList, resumeResumeCreate, resumeResumeUpdate, resumeResumeDelete } from '@/client'

export interface ResumeItem {
  id?: string
  name: string
  sex?: string
  birthday?: string
  education?: string
  school?: string
  email?: string
  mobile?: string
  summary?: string
  skills?: string
  experience?: string
  projects?: string
  eduDetail?: string
  expectedSalary?: string
  jobIntention?: string
  source?: string
  cover?: string
  raw?: string
  userId?: string
  createTime?: string
}

export function useResumeTable() {
  return useCrudTable<ResumeItem>({
    queryKey: queryKeys.resumes.all,
    listFn: (params) => resumeResumeList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => resumeResumeCreate({ body: body as Parameters<typeof resumeResumeCreate>[0]['body'] }),
    updateFn: (body) => resumeResumeUpdate({ body: body as Parameters<typeof resumeResumeUpdate>[0]['body'] }),
    deleteFn: (ids) => resumeResumeDelete({ body: { ids } }),
  })
}
