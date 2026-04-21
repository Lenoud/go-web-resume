import type { DepartmentInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { departmentDepartmentList, departmentDepartmentCreate, departmentDepartmentUpdate, departmentDepartmentDelete } from '@/client'

export type { DepartmentInfo }

export function useDepartmentTable() {
  return useCrudTable<DepartmentInfo>({
    queryKey: queryKeys.departments.all,
    listFn: (params) => departmentDepartmentList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => departmentDepartmentCreate({ body: body as Parameters<typeof departmentDepartmentCreate>[0]['body'] }),
    updateFn: (body) => departmentDepartmentUpdate({ body: body as Parameters<typeof departmentDepartmentUpdate>[0]['body'] }),
    deleteFn: (ids) => departmentDepartmentDelete({ body: { ids } }),
  })
}
