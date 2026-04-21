import type { TalentPoolInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { talentpoolTalentPoolList, talentpoolTalentPoolAdd, talentpoolTalentPoolUpdate, talentpoolTalentPoolRemove } from '@/client'

export type { TalentPoolInfo }

export function useTalentPoolTable() {
  return useCrudTable<TalentPoolInfo>({
    queryKey: queryKeys.talentPool.all,
    listFn: (params) => talentpoolTalentPoolList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => talentpoolTalentPoolAdd({ body: body as Parameters<typeof talentpoolTalentPoolAdd>[0]['body'] }),
    updateFn: (body) => talentpoolTalentPoolUpdate({ body: body as Parameters<typeof talentpoolTalentPoolUpdate>[0]['body'] }),
    deleteFn: (ids) => talentpoolTalentPoolRemove({ body: { resumeSnapshotId: ids } }),
  })
}
