<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { postPostUserInterviewList, type InterviewWithJobInfo } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'

const auth = useAuthStore()
const page = ref(1)
const pageSize = ref(10)

const listQuery = useQuery({
  queryKey: ['userInterviews', { page, pageSize }],
  queryFn: async () => {
    const result = await postPostUserInterviewList({
      query: { page: page.value, pageSize: pageSize.value },
    })
    return (result.data?.data ?? []) as InterviewWithJobInfo[]
  },
  enabled: !!auth.userId,
})

const list = computed(() => listQuery.data?.value ?? [])
const total = computed(() => list.value.length)
const loading = computed(() => listQuery.isLoading.value)

const roundLabel: Record<string, string> = {
  interview_1: '一面', interview_2: '二面', interview_3: '三面', interview_final: '终面',
  '1': '一面', '2': '二面', '3': '三面', final: '终面',
}
const typeLabel: Record<string, string> = {
  onsite: '现场', phone: '电话', video: '视频',
}
const resultLabel: Record<string, string> = {
  pass: '通过', fail: '未通过', pending: '待定',
}
const resultColor: Record<string, string> = {
  pass: '#52c41a', fail: '#ff4d4f', pending: '#faad14',
}
</script>

<template>
  <div class="max-w-[800px] mx-auto">
    <div class="mb-6">
      <h2 class="text-[22px] font-semibold text-text-primary m-0 mb-1">面试通知</h2>
      <p class="text-[13px] text-text-muted m-0">共 {{ total }} 条面试记录</p>
    </div>

    <a-spin :spinning="loading" style="min-height: 200px">
      <div class="flex flex-col gap-3">
        <div
          v-for="item in list" :key="item.id"
          class="bg-white rounded-xl p-5 border border-border-light transition-shadow hover:shadow-md"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-base font-semibold text-text-primary">{{ item.jobTitle || '未知岗位' }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-medium">
                {{ roundLabel[item.round] || `第${item.round}轮` }}
              </span>
            </div>
            <span
              v-if="item.result"
              class="text-xs font-medium px-2.5 py-0.5 rounded-full"
              :style="{ color: resultColor[item.result] ?? '#8c8c8c', background: (resultColor[item.result] ?? '#8c8c8c') + '14' }"
            >{{ resultLabel[item.result] || item.result }}</span>
          </div>

          <div class="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-text-secondary">
            <span>公司：{{ item.companyTitle || '-' }}</span>
            <span v-if="item.location">地点：{{ item.location }}</span>
            <span v-if="item.type">方式：{{ typeLabel[item.type] || item.type }}</span>
            <span v-if="item.interviewerName">面试官：{{ item.interviewerName }}</span>
          </div>

          <div v-if="item.scheduledAt" class="flex items-center gap-1.5 mt-2 text-[13px] text-text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{{ item.scheduledAt }}</span>
          </div>

          <div
            v-if="item.evaluation"
            class="mt-2 p-2 px-3 bg-bg-page rounded-md text-[13px] text-text-secondary leading-relaxed"
          >{{ item.evaluation }}</div>
        </div>

        <!-- Empty -->
        <div
          v-if="list.length === 0 && !loading"
          class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border-light"
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d0d5dd" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p class="mt-4 text-sm text-text-muted m-0">暂无面试通知</p>
        </div>
      </div>

      <div v-if="total > 0" class="flex justify-center mt-6">
        <a-pagination
          v-model:current="page"
          v-model:page-size="pageSize"
          :total="total"
          show-size-changer
          :show-total="(t: number) => `共 ${t} 条`"
        />
      </div>
    </a-spin>
  </div>
</template>
