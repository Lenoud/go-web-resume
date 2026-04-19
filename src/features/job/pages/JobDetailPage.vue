<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { jobJobDetail } from '@/client'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { EnvironmentOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const jobId = computed(() => (route.query.id as string) ?? '')

const detailQuery = useQuery({
  queryKey: queryKeys.jobs.detail(jobId.value),
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

const detail = computed(() => detailQuery.data?.value)
const loading = computed(() => detailQuery.isLoading.value)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <a-spin :spinning="loading">
      <template v-if="detail">
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h1 class="text-2xl font-bold mb-4">{{ detail.title ?? '-' }}</h1>

          <div class="flex flex-wrap gap-4 mb-6 text-gray-500">
            <span class="flex items-center gap-1">
              <EnvironmentOutlined />
              {{ detail.location ?? detail.address ?? '-' }}
            </span>
            <span class="text-primary font-medium text-lg">
              {{ detail.salaryShow || (detail.minSalary && detail.maxSalary ? `${detail.minSalary}-${detail.maxSalary}K` : '面议') }}
            </span>
            <span v-if="detail.education">学历：{{ detail.education }}</span>
            <span v-if="detail.workExpe">经验：{{ detail.workExpe }}</span>
          </div>

          <div class="flex flex-wrap gap-2 mb-6">
            <a-tag v-if="detail.category">{{ detail.category }}</a-tag>
            <a-tag v-if="detail.jobNature">{{ detail.jobNature }}</a-tag>
            <a-tag v-if="detail.recruitType">{{ detail.recruitType }}</a-tag>
          </div>

          <a-divider />

          <div v-if="detail.description" class="mb-6">
            <h3 class="text-lg font-medium mb-3">职位描述</h3>
            <div class="text-gray-600 whitespace-pre-wrap">{{ detail.description }}</div>
          </div>

          <div v-if="detail.requirement">
            <h3 class="text-lg font-medium mb-3">任职要求</h3>
            <div class="text-gray-600 whitespace-pre-wrap">{{ detail.requirement }}</div>
          </div>
        </div>
      </template>

      <a-empty v-else-if="!loading" description="职位不存在" class="mt-12" />
    </a-spin>

    <div class="mt-4 text-center">
      <a-button @click="router.back()">返回</a-button>
    </div>
  </div>
</template>
