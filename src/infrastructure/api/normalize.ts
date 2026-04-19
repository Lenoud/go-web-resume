import { isSuccess, type ApiResponse, type PaginatedData } from './types'

/**
 * 后端 data 可能是：
 * 1. { list: T[], total: number } — 标准分页
 * 2. T[] — 裸数组
 * 3. null / undefined — 空值
 */
export function normalizePaginated<T>(raw: unknown): PaginatedData<T> {
  if (Array.isArray(raw)) {
    return { list: raw as T[], total: raw.length }
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return {
      list: (obj.list ?? []) as T[],
      total: (obj.total ?? 0) as number,
    }
  }
  return { list: [], total: 0 }
}

/** 安全提取 API 响应中的 data 字段 */
export function extractData<T>(response: ApiResponse<T>): T | undefined {
  if (!isSuccess(response)) {
    throw new Error(response.msg || '请求失败')
  }
  return response.data
}
