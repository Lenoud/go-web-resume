import type { UserInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { userUserList, userUserCreate, userUserUpdate, userUserDelete } from '@/client'

export type { UserInfo }

export function useUserTable() {
  return useCrudTable<UserInfo>({
    queryKey: queryKeys.users.all,
    listFn: (params) => userUserList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => userUserCreate({ body: body as Parameters<typeof userUserCreate>[0]['body'] }),
    updateFn: (body) => userUserUpdate({ body: body as Parameters<typeof userUserUpdate>[0]['body'] }),
    deleteFn: (ids) => userUserDelete({ body: { ids } }),
  })
}
