import type { OfferInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { offerList, offerCreate, offerUpdate, offerDelete } from '@/client'

export type { OfferInfo }

export function useOfferTable() {
  return useCrudTable<OfferInfo>({
    queryKey: queryKeys.offers.all,
    listFn: (params) => offerList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => offerCreate({ body: body as Parameters<typeof offerCreate>[0]['body'] }),
    updateFn: (body) => offerUpdate({ body: body as Parameters<typeof offerUpdate>[0]['body'] }),
    deleteFn: (ids) => offerDelete({ body: { ids } }),
  })
}
