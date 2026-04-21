/** 分页数据结构 */
export interface PaginatedData<T> {
  list: T[]
  total: number
  page?: number
  pageSize?: number
}
