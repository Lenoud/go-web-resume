<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

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
</script>

<template>
  <div
    class="px-6 py-4 cursor-pointer transition-colors hover:bg-bg-hover"
    @click="record.id && router.push({ path: '/index/detail', query: { id: record.id } })"
  >
    <div class="flex items-center justify-between">
      <div class="flex-1 min-w-0">
        <h3
          class="text-xl font-semibold text-[rgb(31,35,41)] m-0 mb-2 overflow-hidden text-ellipsis whitespace-nowrap leading-8 transition-colors"
        >{{ record.title ?? '-' }}</h3>
        <div class="flex items-center flex-wrap gap-0">
          <span class="text-sm text-[rgb(100,106,115)] leading-[22px]">{{ record.location ?? '-' }}</span>
          <template v-if="record.workExpe">
            <span class="w-[3px] h-[3px] rounded-full bg-text-muted mx-2.5 shrink-0" />
            <span class="text-sm text-[rgb(100,106,115)] leading-[22px]">{{ record.workExpe }}</span>
          </template>
          <template v-if="record.education">
            <span class="w-[3px] h-[3px] rounded-full bg-text-muted mx-2.5 shrink-0" />
            <span class="text-sm text-[rgb(100,106,115)] leading-[22px]">{{ record.education }}</span>
          </template>
        </div>
      </div>
      <div class="shrink-0 ml-6">
        <span class="text-base font-semibold text-[rgb(51,112,255)] whitespace-nowrap">
          {{ record.salaryShow || (record.minSalary && record.maxSalary ? `${record.minSalary}-${record.maxSalary}` : '面议') }}
        </span>
      </div>
    </div>
  </div>
</template>
