/**
 * 后端 data 可能是：
 * 1. { list: T[], total: number } — 标准分页
 * 2. T[] — 裸数组
 * 3. null / undefined — 空值
 */
export function normalizePaginated<T>(raw: unknown): { list: T[]; total: number } {
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
