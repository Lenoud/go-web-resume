<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { postPostCompanyList, postPostUpdate, companyCompanyList } from '@/client'
import { normalizePaginated } from '@/infrastructure/api/normalize'
import { STATUS_LABEL, STATUS_COLOR, ALL_STATUSES, type RecruitmentStatus } from '@/shared/types'
import RecruitmentPipeline from '../components/RecruitmentPipeline.vue'
import { message } from 'ant-design-vue'

const queryClient = useQueryClient()
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')

// 先查公司列表获取 companyId（单公司模型，取第一条）
const companyQuery = useQuery({
  queryKey: ['companyForPost'],
  queryFn: async () => {
    const result = await companyCompanyList({ query: { page: 1, pageSize: 1 } })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询公司失败')
    }
    const list = (resp.data as { list?: Array<{ id: string }> } | undefined)?.list
    return list?.[0]?.id ?? ''
  },
})

interface PostItem {
  id: string; jobId: string; title: string; companyTitle: string
  name: string; status: string; feedback: string; source: string
  userId: string; createTime: string
}

const listQuery = useQuery({
  queryKey: ['companyPosts', { page, pageSize, keyword, companyId: companyQuery.data }],
  queryFn: async () => {
    const companyId = companyQuery.data?.value
    if (!companyId) return { list: [] as PostItem[], total: 0 }
    const result = await postPostCompanyList({
      query: { companyId, page: page.value, pageSize: pageSize.value },
    })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return normalizePaginated<PostItem>(resp.data)
  },
  enabled: !!companyQuery.data?.value,
})

const list = computed(() => {
  const all = listQuery.data?.value?.list ?? []
  if (!keyword.value) return all
  const kw = keyword.value.toLowerCase()
  return all.filter((i: PostItem) =>
    (i.title ?? '').toLowerCase().includes(kw) ||
    (i.name ?? '').toLowerCase().includes(kw),
  )
})
const total = computed(() => listQuery.data?.value?.total ?? 0)
const loading = computed(() => listQuery.isLoading.value || companyQuery.isLoading.value)

// Status change
const statusModalVisible = ref(false)
const editingPost = ref<PostItem | null>(null)
const newStatus = ref('')

const statusOptions = ALL_STATUSES.map((s) => ({
  label: STATUS_LABEL[s],
  value: s,
}))

const colorMap: Record<string, string> = {
  default: '#8c8c8c', processing: '#1890ff', cyan: '#13c2c2', gold: '#faad14',
  orange: '#fa8c16', blue: '#1890ff', green: '#52c41a', success: '#52c41a',
  geekblue: '#2f54eb', error: '#ff4d4f', warning: '#faad14',
}

function statusLabel(s: string) { return STATUS_LABEL[s as RecruitmentStatus] ?? s }
function statusColor(s: string) { return colorMap[STATUS_COLOR[s as RecruitmentStatus] ?? ''] ?? '#8c8c8c' }
function statusBg(s: string) { return statusColor(s) + '14' }

function openStatusModal(record: PostItem) {
  editingPost.value = record
  newStatus.value = record.status
  statusModalVisible.value = true
}

const updateMutation = useMutation({
  mutationFn: (body: Record<string, unknown>) => postPostUpdate({ body: body as Parameters<typeof postPostUpdate>[0]['body'] }),
  onSuccess: () => {
    message.success('状态已更新')
    queryClient.invalidateQueries({ queryKey: ['companyPosts'] })
    statusModalVisible.value = false
  },
  onError: (err: Error) => message.error(err.message || '更新失败'),
})

function handleStatusChange() {
  if (editingPost.value?.id && newStatus.value) {
    updateMutation.mutate({ id: editingPost.value.id, status: newStatus.value })
  }
}
</script>

<template>
  <div class="max-w-[900px] mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-[22px] font-semibold text-text-primary m-0 mb-1">投递管理</h2>
        <p class="text-[13px] text-text-muted m-0">共 {{ total }} 条投递记录</p>
      </div>
      <a-input v-model:value="keyword" placeholder="搜索姓名/职位" class="w-60" allow-clear />
    </div>

    <a-spin :spinning="loading" style="min-height: 200px">
      <div class="flex flex-col gap-3">
        <!-- Card -->
        <div
          v-for="item in list" :key="item.id"
          class="bg-white rounded-xl p-5 border border-border-light transition-shadow hover:shadow-md"
        >
          <!-- Title + Status + Action -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-base font-semibold text-text-primary truncate">{{ item.title || '未知岗位' }}</span>
              <span class="text-sm text-text-secondary shrink-0">— {{ item.name }}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span
                class="text-xs font-medium px-2.5 py-0.5 rounded-full"
                :style="{ background: statusBg(item.status), color: statusColor(item.status) }"
              >{{ statusLabel(item.status) }}</span>
              <a-button type="link" size="small" @click="openStatusModal(item)">变更状态</a-button>
            </div>
          </div>

          <!-- Feedback -->
          <div
            v-if="item.feedback"
            class="flex items-start gap-1.5 mb-2 p-2 px-3 bg-bg-page rounded-md text-[13px] text-text-secondary leading-relaxed"
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

    <!-- Status change modal -->
    <a-modal v-model:open="statusModalVisible" title="变更状态" @ok="handleStatusChange">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="当前状态">
          <span class="text-text-secondary">{{ editingPost ? statusLabel(editingPost.status) : '' }}</span>
        </a-form-item>
        <a-form-item label="新状态">
          <a-select v-model:value="newStatus" :options="statusOptions" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
