import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { resumesnapshotResumeSnapshotList, resumesnapshotResumeSnapshotUpdate, resumesnapshotResumeSnapshotDelete } from '@/client'

export interface ResumeSnapshotItem {
  id?: string
  name?: string
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
  rating?: number
  remark?: string
  tags?: string
  resumeId?: string
  userId?: string
  createTime?: string
}

export function useResumeSnapshotTable() {
  return useCrudTable<ResumeSnapshotItem>({
    queryKey: queryKeys.resumeSnapshots.all,
    listFn: (params) => resumesnapshotResumeSnapshotList({ query: params as { page?: number; pageSize?: number } }),
    updateFn: (body) => resumesnapshotResumeSnapshotUpdate({ body: body as Parameters<typeof resumesnapshotResumeSnapshotUpdate>[0]['body'] }),
    deleteFn: (ids) => resumesnapshotResumeSnapshotDelete({ body: { ids } }),
  })
}
