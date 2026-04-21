import type { PostInfo } from '@/client'
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { postPostList, postPostCreate, postPostUpdate, postPostDelete } from '@/client'

export type { PostInfo }

export function usePostTable() {
  return useCrudTable<PostInfo>({
    queryKey: queryKeys.posts.all,
    listFn: (params) => postPostList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => postPostCreate({ body: body as Parameters<typeof postPostCreate>[0]['body'] }),
    updateFn: (body) => postPostUpdate({ body: body as Parameters<typeof postPostUpdate>[0]['body'] }),
    deleteFn: (ids) => postPostDelete({ body: { ids } }),
  })
}
