import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { companyCompanyList, companyCompanyCreate, companyCompanyUpdate, companyCompanyDelete } from '@/client'

export interface CompanyItem {
  id?: string
  title: string
  guimo?: string
  hangye?: string
  description?: string
  location?: string
}

export function useCompanyTable() {
  return useCrudTable<CompanyItem>({
    queryKey: queryKeys.companies.all,
    listFn: (params) => companyCompanyList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => companyCompanyCreate({ body: body as Parameters<typeof companyCompanyCreate>[0]['body'] }),
    updateFn: (body) => companyCompanyUpdate({ body: body as Parameters<typeof companyCompanyUpdate>[0]['body'] }),
    deleteFn: (ids) => companyCompanyDelete({ body: { ids } }),
  })
}
