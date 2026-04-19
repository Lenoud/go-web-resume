import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { postPostList, postPostCreate, postPostUpdate, postPostDelete } from '@/client'

export interface PostItem {
  id?: string
  userId?: string
  jobId?: string
  title?: string
  companyId?: string
  companyTitle?: string
  name?: string
  status?: string
  source?: string
  feedback?: string
  remark?: string
  resumeSnapshotId?: string
  raw?: string
  createTime?: string
}

export function usePostTable() {
  return useCrudTable<PostItem>({
    queryKey: queryKeys.posts.all,
    listFn: (params) => postPostList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => postPostCreate({ body: body as Parameters<typeof postPostCreate>[0]['body'] }),
    updateFn: (body) => postPostUpdate({ body: body as Parameters<typeof postPostUpdate>[0]['body'] }),
    deleteFn: (ids) => postPostDelete({ body: { ids } }),
  })
}
