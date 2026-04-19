import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { offerOfferList, offerOfferCreate, offerOfferUpdate, offerOfferDelete } from '@/client'

export interface OfferItem {
  id?: string
  postId: string
  salary?: string
  level?: string
  joinDate?: string
  probationPeriod?: string
  contractPeriod?: string
  workLocation?: string
  status?: string
  createTime?: string
}

export function useOfferTable() {
  return useCrudTable<OfferItem>({
    queryKey: queryKeys.offers.all,
    listFn: (params) => offerOfferList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => offerOfferCreate({ body: body as Parameters<typeof offerOfferCreate>[0]['body'] }),
    updateFn: (body) => offerOfferUpdate({ body: body as Parameters<typeof offerOfferUpdate>[0]['body'] }),
    deleteFn: (ids) => offerOfferDelete({ body: { ids } }),
  })
}
