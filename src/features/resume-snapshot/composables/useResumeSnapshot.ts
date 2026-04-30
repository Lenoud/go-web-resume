import type { ResumeSnapshotInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { resumeSnapshotList, resumeSnapshotUpdate, resumeSnapshotDelete } from '@/client'

export type { ResumeSnapshotInfo }

export function useResumeSnapshotTable() {
  return useCrudTable<ResumeSnapshotInfo>({
    queryKey: queryKeys.resumeSnapshots.all,
    listFn: (params) => resumeSnapshotList({ query: params as { page?: number; pageSize?: number } }),
    updateFn: (body) => resumeSnapshotUpdate({ body: body as Parameters<typeof resumeSnapshotUpdate>[0]['body'] }),
    deleteFn: (ids) => resumeSnapshotDelete({ body: { ids } }),
  })
}
