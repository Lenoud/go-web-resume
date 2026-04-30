import type { DepartmentInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { departmentList, departmentCreate, departmentUpdate, departmentDelete } from '@/client'

export type { DepartmentInfo }

export function useDepartmentTable() {
  return useCrudTable<DepartmentInfo>({
    queryKey: queryKeys.departments.all,
    listFn: (params) => departmentList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => departmentCreate({ body: body as Parameters<typeof departmentCreate>[0]['body'] }),
    updateFn: (body) => departmentUpdate({ body: body as Parameters<typeof departmentUpdate>[0]['body'] }),
    deleteFn: (ids) => departmentDelete({ body: { ids } }),
  })
}
