import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { talentpoolTalentPoolList, talentpoolTalentPoolAdd, talentpoolTalentPoolUpdate, talentpoolTalentPoolRemove } from '@/client'

export interface TalentPoolItem {
  id?: string
  name?: string
  education?: string
  email?: string
  mobile?: string
  rating?: number
  remark?: string
  resumeSnapshotId: string
  tags?: string
  createTime?: string
}

export function useTalentPoolTable() {
  return useCrudTable<TalentPoolItem>({
    queryKey: queryKeys.talentPool.all,
    listFn: (params) => talentpoolTalentPoolList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => talentpoolTalentPoolAdd({ body: body as Parameters<typeof talentpoolTalentPoolAdd>[0]['body'] }),
    updateFn: (body) => talentpoolTalentPoolUpdate({ body: body as Parameters<typeof talentpoolTalentPoolUpdate>[0]['body'] }),
    deleteFn: (ids) => talentpoolTalentPoolRemove({ body: { resumeSnapshotId: ids } }),
  })
}
