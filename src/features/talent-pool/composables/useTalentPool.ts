import type { TalentPoolInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { talentPoolList, talentPoolAdd, talentPoolUpdate, talentPoolRemove } from '@/client'

export type { TalentPoolInfo }

export function useTalentPoolTable() {
  return useCrudTable<TalentPoolInfo>({
    queryKey: queryKeys.talentPool.all,
    listFn: (params) => talentPoolList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => talentPoolAdd({ body: body as Parameters<typeof talentPoolAdd>[0]['body'] }),
    updateFn: (body) => talentPoolUpdate({ body: body as Parameters<typeof talentPoolUpdate>[0]['body'] }),
    deleteFn: (ids) => talentPoolRemove({ body: { resumeSnapshotId: ids } }),
  })
}
