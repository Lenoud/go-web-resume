import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { userUserList, userUserCreate, userUserUpdate, userUserDelete } from '@/client'

export interface UserItem {
  id?: string
  username: string
  password?: string
  nickname?: string
  email?: string
  mobile?: string
  role?: string
  status?: string
  avatar?: string
  createTime?: string
}

export function useUserTable() {
  return useCrudTable<UserItem>({
    queryKey: queryKeys.users.all,
    listFn: (params) => userUserList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => userUserCreate({ body: body as Parameters<typeof userUserCreate>[0]['body'] }),
    updateFn: (body) => userUserUpdate({ body: body as Parameters<typeof userUserUpdate>[0]['body'] }),
    deleteFn: (ids) => userUserDelete({ body: { ids } }),
  })
}
