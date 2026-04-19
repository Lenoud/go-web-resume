<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { jobJobList, jobJobCategoryList } from '@/client'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { normalizePaginated } from '@/infrastructure/api/normalize'
import JobCard from '../components/JobCard.vue'

const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const category = ref<string | undefined>(undefined)

// 分类列表
const categoryQuery = useQuery({
  queryKey: queryKeys.jobs.categories,
  queryFn: async () => {
    const result = await jobJobCategoryList()
    return result.data?.data?.categories ?? []
  },
})

// 职位列表
const listQuery = useQuery({
  queryKey: computed(() => [...queryKeys.jobs.list({}), { page: page.value, pageSize: pageSize.value, keyword: keyword.value, category: category.value }]),
  queryFn: async () => {
    const result = await jobJobList({
      query: {
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value || undefined,
        category: category.value || undefined,
      } as Record<string, unknown>,
    })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return normalizePaginated<{ id: string; title: string; companyTitle: string; location: string; education: string; workExpe: string; minSalary: number; maxSalary: number; salaryShow: string; category: string; createTime: string; status: number }>(resp.data)
  },
})

const list = computed(() => listQuery.data?.value?.list ?? [])
const total = computed(() => listQuery.data?.value?.total ?? 0)
const loading = computed(() => listQuery.isLoading.value)
const categories = computed(() => categoryQuery.data?.value ?? [])
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-center mb-6">热门职位</h1>

    <!-- 搜索栏 -->
    <div class="flex items-center gap-3 mb-6">
      <a-input
        v-model:value="keyword"
        placeholder="搜索职位、公司"
        class="flex-1"
        size="large"
        allow-clear
        @press-enter="page = 1"
      />
      <a-select
        v-model:value="category"
        placeholder="全部分类"
        allow-clear
        class="w-40"
        size="large"
        @change="page = 1"
      >
        <a-select-option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </a-select-option>
      </a-select>
    </div>

    <!-- 职位卡片列表 -->
    <div class="grid gap-4">
      <JobCard v-for="item in list" :key="item.id" :record="item" />
    </div>

    <a-empty v-if="!loading && list.length === 0" description="暂无职位" class="mt-12" />

    <!-- 分页 -->
    <div class="flex justify-center mt-6">
      <a-pagination
        v-model:current="page"
        v-model:page-size="pageSize"
        :total="total"
        show-size-changer
        :show-total="(t: number) => `共 ${t} 个职位`"
      />
    </div>
  </div>
</template>
