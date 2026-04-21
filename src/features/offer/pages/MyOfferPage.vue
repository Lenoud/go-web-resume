<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { postPostUserOfferList, type OfferWithJobInfo } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'
import { STATUS_LABEL, STATUS_COLOR, type RecruitmentStatus } from '@/shared/types'

const auth = useAuthStore()
const page = ref(1)
const pageSize = ref(10)

const listQuery = useQuery({
  queryKey: ['userOffers', { page, pageSize }],
  queryFn: async () => {
    const result = await postPostUserOfferList({
      query: { page: page.value, pageSize: pageSize.value },
    })
    return (result.data?.data ?? []) as OfferWithJobInfo[]
  },
  enabled: !!auth.userId,
})

const list = computed(() => listQuery.data?.value ?? [])
const total = computed(() => list.value.length)
const loading = computed(() => listQuery.isLoading.value)

const colorMap: Record<string, string> = {
  default: '#8c8c8c', processing: '#1890ff', cyan: '#13c2c2', gold: '#faad14',
  orange: '#fa8c16', blue: '#1890ff', green: '#52c41a', success: '#52c41a',
  geekblue: '#2f54eb', error: '#ff4d4f', warning: '#faad14',
}

function statusLabel(s: string) { return STATUS_LABEL[s as RecruitmentStatus] ?? s }
function statusColor(s: string) { return colorMap[STATUS_COLOR[s as RecruitmentStatus] ?? ''] ?? '#8c8c8c' }
function statusBg(s: string) { return statusColor(s) + '14' }
</script>

<template>
  <div class="max-w-[800px] mx-auto">
    <div class="mb-6">
      <h2 class="text-[22px] font-semibold text-text-primary m-0 mb-1">我的Offer</h2>
      <p class="text-[13px] text-text-muted m-0">共 {{ total }} 条记录</p>
    </div>

    <a-spin :spinning="loading" style="min-height: 200px">
      <div class="flex flex-col gap-3">
        <div
          v-for="item in list" :key="item.id"
          class="bg-white rounded-xl p-5 border border-border-light transition-shadow hover:shadow-md"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-base font-semibold text-text-primary">{{ item.jobTitle || '未知岗位' }}</span>
            <span
              class="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0"
              :style="{ background: statusBg(item.status), color: statusColor(item.status) }"
            >{{ statusLabel(item.status) }}</span>
          </div>

          <div class="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-text-secondary">
            <span>公司：{{ item.companyTitle || '-' }}</span>
            <span v-if="item.salary">薪资：{{ item.salary }}</span>
            <span v-if="item.level">职级：{{ item.level }}</span>
            <span v-if="item.workLocation">工作地：{{ item.workLocation }}</span>
          </div>

          <div v-if="item.joinDate || item.contractPeriod" class="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[13px] text-text-muted">
            <span v-if="item.joinDate">入职日期：{{ item.joinDate }}</span>
            <span v-if="item.contractPeriod">合同期：{{ item.contractPeriod }}</span>
            <span v-if="item.probationPeriod">试用期：{{ item.probationPeriod }}</span>
          </div>
        </div>

        <!-- Empty -->
        <div
          v-if="list.length === 0 && !loading"
          class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border-light"
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d0d5dd" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p class="mt-4 text-sm text-text-muted m-0">暂无Offer</p>
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
