<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { postPostUserList } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'
import { normalizePaginated } from '@/infrastructure/api/normalize'
import { STATUS_LABEL, STATUS_COLOR, type RecruitmentStatus } from '@/shared/types'
import RecruitmentPipeline from '../components/RecruitmentPipeline.vue'

const router = useRouter()
const auth = useAuthStore()
const page = ref(1)
const pageSize = ref(10)

interface PostItem {
  id: string; jobId: string; title: string; companyTitle: string
  location: string; categoryTitle: string; departmentTitle: string
  status: string; feedback: string; source: string
}

const listQuery = useQuery({
  queryKey: ['userPosts', { page, pageSize, userId: auth.userId }],
  queryFn: async () => {
    const result = await postPostUserList({
      query: { userId: auth.userId, page: page.value, pageSize: pageSize.value },
    })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return normalizePaginated<PostItem>(resp.data)
  },
  enabled: !!auth.userId,
})

const list = computed(() => listQuery.data?.value?.list ?? [])
const total = computed(() => listQuery.data?.value?.total ?? 0)
const loading = computed(() => listQuery.isLoading.value)

const colorMap: Record<string, string> = {
  default: '#8c8c8c', processing: '#1890ff', cyan: '#13c2c2', gold: '#faad14',
  orange: '#fa8c16', blue: '#1890ff', green: '#52c41a', success: '#52c41a',
  geekblue: '#2f54eb', error: '#ff4d4f', warning: '#faad14',
}

function statusLabel(s: string) { return STATUS_LABEL[s as RecruitmentStatus] ?? s }
function statusColor(s: string) { return colorMap[STATUS_COLOR[s as RecruitmentStatus] ?? ''] ?? '#8c8c8c' }
function statusBg(s: string) { return statusColor(s) + '14' }

function goDetail(jobId: string) {
  const href = router.resolve({ path: '/index/detail', query: { id: jobId } }).href
  window.open(href, '_blank')
}
</script>

<template>
  <div class="max-w-[800px] mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-[22px] font-semibold text-text-primary m-0 mb-1">应聘记录</h2>
      <p class="text-[13px] text-text-muted m-0">共 {{ total }} 条投递记录</p>
    </div>

    <a-spin :spinning="loading" style="min-height: 200px">
      <div class="flex flex-col gap-3">
        <!-- Post Card -->
        <div
          v-for="item in list" :key="item.id"
          class="bg-white rounded-xl p-5 border border-border-light transition-shadow hover:shadow-md cursor-default"
        >
          <!-- Title + Status -->
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-base font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors"
              @click="goDetail(item.jobId)"
            >{{ item.title || '未知岗位' }}</span>
            <span
              class="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0"
              :style="{ background: statusBg(item.status), color: statusColor(item.status) }"
            >{{ statusLabel(item.status) }}</span>
          </div>

          <!-- Meta -->
          <div class="flex items-center flex-wrap text-[13px] text-text-secondary gap-0">
            <span class="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ item.location || '未知' }}
            </span>
            <span class="text-border mx-2 text-xs">|</span>
            <span>{{ item.companyTitle || '未知公司' }}</span>
            <span class="text-border mx-2 text-xs">|</span>
            <span>{{ item.categoryTitle || '未分类' }} · {{ item.departmentTitle || '未分配' }}</span>
          </div>

          <!-- Feedback -->
          <div
            v-if="item.feedback"
            class="flex items-start gap-1.5 mt-2 p-2 px-3 bg-[#f6f8fa] rounded-md text-[13px] text-text-secondary leading-relaxed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5 text-text-muted"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{{ item.feedback }}</span>
          </div>

          <!-- Pipeline -->
          <RecruitmentPipeline :status="item.status" />
        </div>

        <!-- Empty -->
        <div
          v-if="list.length === 0 && !loading"
          class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border-light"
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d0d5dd" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p class="mt-4 text-sm text-text-muted m-0">暂无投递记录</p>
        </div>
      </div>

      <!-- Pagination -->
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
