import type { ResumeSnapshotInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { resumesnapshotResumeSnapshotList, resumesnapshotResumeSnapshotUpdate, resumesnapshotResumeSnapshotDelete } from '@/client'

export type { ResumeSnapshotInfo }

export function useResumeSnapshotTable() {
  return useCrudTable<ResumeSnapshotInfo>({
    queryKey: queryKeys.resumeSnapshots.all,
    listFn: (params) => resumesnapshotResumeSnapshotList({ query: params as { page?: number; pageSize?: number } }),
    updateFn: (body) => resumesnapshotResumeSnapshotUpdate({ body: body as Parameters<typeof resumesnapshotResumeSnapshotUpdate>[0]['body'] }),
    deleteFn: (ids) => resumesnapshotResumeSnapshotDelete({ body: { ids } }),
  })
}
