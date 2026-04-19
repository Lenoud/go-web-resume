/** 后端统一响应信封 */
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data?: T
  timestamp?: number
  trace?: string
}

/** 分页数据结构 */
export interface PaginatedData<T> {
  list: T[]
  total: number
  page?: number
  pageSize?: number
}

/** 业务成功判断 */
export function isSuccess(resp: ApiResponse): boolean {
  return resp.code === 0 || resp.code === 200
}
