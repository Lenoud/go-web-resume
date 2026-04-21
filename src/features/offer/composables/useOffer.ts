import type { OfferInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { offerOfferList, offerOfferCreate, offerOfferUpdate, offerOfferDelete } from '@/client'

export type { OfferInfo }

export function useOfferTable() {
  return useCrudTable<OfferInfo>({
    queryKey: queryKeys.offers.all,
    listFn: (params) => offerOfferList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => offerOfferCreate({ body: body as Parameters<typeof offerOfferCreate>[0]['body'] }),
    updateFn: (body) => offerOfferUpdate({ body: body as Parameters<typeof offerOfferUpdate>[0]['body'] }),
    deleteFn: (ids) => offerOfferDelete({ body: { ids } }),
  })
}
