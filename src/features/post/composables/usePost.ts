import type { PostInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { postList, postCreate, postUpdate, postDelete } from '@/client'

export type { PostInfo }

export function usePostTable() {
  return useCrudTable<PostInfo>({
    queryKey: queryKeys.posts.all,
    listFn: (params) => postList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => postCreate({ body: body as Parameters<typeof postCreate>[0]['body'] }),
    updateFn: (body) => postUpdate({ body: body as Parameters<typeof postUpdate>[0]['body'] }),
    deleteFn: (ids) => postDelete({ body: { ids } }),
  })
}
