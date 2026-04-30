import type { UserInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { userList, userCreate, userUpdate, userDelete } from '@/client'

export type { UserInfo }

export function useUserTable() {
  return useCrudTable<UserInfo>({
    queryKey: queryKeys.users.all,
    listFn: (params) => userList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => userCreate({ body: body as Parameters<typeof userCreate>[0]['body'] }),
    updateFn: (body) => userUpdate({ body: body as Parameters<typeof userUpdate>[0]['body'] }),
    deleteFn: (ids) => userDelete({ body: { ids } }),
  })
}
