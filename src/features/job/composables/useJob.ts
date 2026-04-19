import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { jobJobList, jobJobCreate, jobJobUpdate, jobJobDelete } from '@/client'

export interface JobItem {
  id?: string
  title: string
  category?: string
  companyId?: string
  companyTitle?: string
  departmentId?: string
  departmentTitle?: string
  description?: string
  requirement?: string
  address?: string
  location?: string
  education?: string
  workExpe?: string
  jobNature?: string
  recruitType?: string
  jobCode?: string
  minSalary?: number
  maxSalary?: number
  salaryShow?: string
  salaryUnit?: number
  status?: number
  pv?: number
  createTime?: string
  updateTime?: string
}

export function useJobTable() {
  return useCrudTable<JobItem>({
    queryKey: queryKeys.jobs.all,
    listFn: (params) => jobJobList({ query: params as { page?: number; pageSize?: number } }),
    createFn: (body) => jobJobCreate({ body: body as Parameters<typeof jobJobCreate>[0]['body'] }),
    updateFn: (body) => jobJobUpdate({ body: body as Parameters<typeof jobJobUpdate>[0]['body'] }),
    deleteFn: (ids) => jobJobDelete({ body: { ids } }),
  })
}
