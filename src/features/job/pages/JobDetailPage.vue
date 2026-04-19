<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { jobJobDetail, jobJobList } from '@/client'
import { normalizePaginated } from '@/infrastructure/api/normalize'
import JobCard from '../components/JobCard.vue'

const route = useRoute()
const router = useRouter()
const jobId = computed(() => (route.query.id as string) ?? '')

const detailQuery = useQuery({
  queryKey: ['jobDetail', jobId],
  queryFn: async () => {
    const result = await jobJobDetail({ query: { id: jobId.value } })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return resp.data
  },
  enabled: !!jobId.value,
})

// 相关岗位
const recommendQuery = useQuery({
  queryKey: ['jobRecommend'],
  queryFn: async () => {
    const result = await jobJobList({ query: { page: 1, pageSize: 10 } as Record<string, unknown> })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) return []
    const paginated = normalizePaginated<{ id: string; title: string; companyTitle: string; location: string; education: string; workExpe: string; minSalary: number; maxSalary: number; salaryShow: string; category: string; status: number }>(resp.data)
    return paginated.list.filter(j => String(j.id) !== jobId.value).slice(0, 6)
  },
})

const detail = computed(() => detailQuery.data?.value)
const loading = computed(() => detailQuery.isLoading.value)
const recommendList = computed(() => recommendQuery.data?.value ?? [])

const statusLabel = (status: number | undefined) => {
  const map: Record<number, string> = { 0: '草稿', 1: '招聘中', 2: '已关闭', 3: '已删除', 4: '已招满' }
  return map[status ?? -1] ?? '--'
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto px-4 py-[72px]">
    <a-spin :spinning="loading">
      <template v-if="detail">
        <div class="flex gap-6 items-start">
          <!-- 左栏 -->
          <div class="flex-1 min-w-0">
            <!-- 基本信息卡片 -->
            <div class="bg-white border border-border rounded-md p-6 mb-4">
              <div class="flex items-center gap-2">
                <h1 class="m-0 text-[28px] font-semibold text-gray-800 leading-[42px]">{{ detail.title ?? '-' }}</h1>
                <span class="text-xs px-2 py-0.5 rounded-sm shrink-0 border"
                  :class="detail.status === 1 ? 'text-green-500 bg-green-50/80 border-green-200' : detail.status === 2 ? 'text-red-500 bg-red-50 border-red-200' : 'text-blue-500 bg-blue-50 border-blue-200'"
                >{{ statusLabel(detail.status) }}</span>
              </div>
              <div class="text-accent text-xl font-medium my-2">{{ detail.salaryShow || '--' }}</div>
              <div class="flex flex-wrap gap-2 mb-4">
                <span class="text-sm px-2.5 py-[3px] bg-bg-page rounded-sm text-[rgb(100,106,115)]">{{ detail.recruitType === 'experienced' ? '社招' : detail.recruitType === 'campus' ? '校招' : '--' }}</span>
                <span class="text-sm px-2.5 py-[3px] bg-bg-page rounded-sm text-[rgb(100,106,115)]">{{ detail.jobNature === 'fulltime' ? '全职' : detail.jobNature === 'parttime' ? '兼职' : detail.jobNature === 'intern' ? '实习' : '--' }}</span>
                <span class="text-sm px-2.5 py-[3px] bg-bg-page rounded-sm text-[rgb(100,106,115)]">{{ detail.education || '学历不限' }}</span>
                <span class="text-sm px-2.5 py-[3px] bg-bg-page rounded-sm text-[rgb(100,106,115)]">{{ detail.workExpe || '经验不限' }}</span>
                <span class="text-sm px-2.5 py-[3px] bg-primary-light rounded-sm text-primary">{{ detail.location || '--' }}</span>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[rgb(100,106,115)]">
                <span v-if="detail.departmentTitle">部门：{{ detail.departmentTitle }}</span>
                <span v-if="detail.category">分类：{{ detail.category }}</span>
                <span v-if="detail.address">地址：{{ detail.address }}</span>
              </div>
            </div>

            <!-- 岗位描述 -->
            <div v-if="detail.description" class="bg-white border border-border rounded-md p-6 mb-4">
              <div class="font-medium text-base text-gray-800 mb-4 pb-2 border-b border-border">岗位描述</div>
              <div class="text-[rgb(31,35,41)] text-sm leading-[22px] whitespace-pre-wrap break-words">{{ detail.description }}</div>
            </div>

            <!-- 岗位要求 -->
            <div v-if="detail.requirement" class="bg-white border border-border rounded-md p-6 mb-4">
              <div class="font-medium text-base text-gray-800 mb-4 pb-2 border-b border-border">岗位要求</div>
              <div class="text-[rgb(31,35,41)] text-sm leading-[22px] whitespace-pre-wrap break-words">{{ detail.requirement }}</div>
            </div>
          </div>

          <!-- 右栏：相关岗位 -->
          <div class="w-[280px] shrink-0 sticky top-16 max-h-[calc(100vh-80px)] overflow-y-auto">
            <div class="font-medium text-base text-gray-800 mb-4 pb-2 border-b border-border">相关岗位</div>
            <div class="flex flex-col gap-4">
              <JobCard v-for="item in recommendList" :key="item.id" :record="item" />
            </div>
          </div>
        </div>
      </template>

      <div v-else-if="!loading" class="flex flex-col items-center py-20">
        <p class="text-text-muted">职位不存在</p>
      </div>
    </a-spin>

    <div class="mt-4 text-center">
      <a-button @click="router.back()">返回</a-button>
    </div>
  </div>
</template>
