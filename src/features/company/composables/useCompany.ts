import type { CompanyInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { companyList, companyCreate, companyUpdate, companyDelete } from '@/client'

export type { CompanyInfo }

export function useCompanyTable() {
  return useCrudTable<CompanyInfo>({
    queryKey: queryKeys.companies.all,
    listFn: (params) => companyList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => companyCreate({ body: body as Parameters<typeof companyCreate>[0]['body'] }),
    updateFn: (body) => companyUpdate({ body: body as Parameters<typeof companyUpdate>[0]['body'] }),
    deleteFn: (ids) => companyDelete({ body: { ids } }),
  })
}
