<script setup lang="ts">
import { useRouter } from 'vue-router'
import { EnvironmentOutlined } from '@ant-design/icons-vue'

defineProps<{
  record: {
    id?: string
    title?: string
    companyTitle?: string
    location?: string
    education?: string
    workExpe?: string
    minSalary?: number
    maxSalary?: number
    salaryShow?: string
    category?: string
    createTime?: string
    status?: number
  }
}>()

const router = useRouter()
</script>

<template>
  <div
    class="p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
    @click="record.id && router.push({ path: '/index/detail', query: { id: record.id } })"
  >
    <div class="flex justify-between items-start mb-2">
      <h3 class="text-base font-medium text-gray-900 m-0">{{ record.title ?? '-' }}</h3>
      <span class="text-primary font-medium whitespace-nowrap ml-4">
        {{ record.salaryShow || (record.minSalary && record.maxSalary ? `${record.minSalary}-${record.maxSalary}K` : '面议') }}
      </span>
    </div>

    <div class="flex items-center gap-4 text-sm text-gray-500 mb-2">
      <span>{{ record.companyTitle ?? '-' }}</span>
      <span class="flex items-center gap-1">
        <EnvironmentOutlined />
        {{ record.location ?? '-' }}
      </span>
    </div>

    <div class="flex items-center gap-3 text-xs text-gray-400">
      <a-tag v-if="record.category" size="small">{{ record.category }}</a-tag>
      <span v-if="record.education">{{ record.education }}</span>
      <span v-if="record.workExpe">{{ record.workExpe }}</span>
    </div>
  </div>
</template>
