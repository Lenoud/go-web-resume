<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { postPostCompanyList, postPostUpdate } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { normalizePaginated } from '@/infrastructure/api/normalize'
import { STATUS_LABEL, ALL_STATUSES } from '@/shared/types'
import RecruitmentStatusTag from '../components/RecruitmentStatusTag.vue'
import { message } from 'ant-design-vue'

const auth = useAuthStore()
const queryClient = useQueryClient()
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')

const listQuery = useQuery({
  queryKey: computed(() => [...queryKeys.posts.list({}), { page: page.value, pageSize: pageSize.value, keyword: keyword.value }]),
  queryFn: async () => {
    const result = await postPostCompanyList({
      query: { companyId: auth.userId, page: page.value, pageSize: pageSize.value },
    })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return normalizePaginated(resp.data)
  },
})

const list = computed(() => listQuery.data?.value?.list ?? [])
const total = computed(() => listQuery.data?.value?.total ?? 0)
const loading = computed(() => listQuery.isLoading.value)

// 状态变更
const statusModalVisible = ref(false)
const editingPost = ref<{ id: string; status: string } | null>(null)
const newStatus = ref('')

const statusOptions = ALL_STATUSES.map((s) => ({
  label: STATUS_LABEL[s],
  value: s,
}))

function openStatusModal(record: { id?: string; status?: string }) {
  editingPost.value = { id: record.id ?? '', status: record.status ?? '' }
  newStatus.value = record.status ?? ''
  statusModalVisible.value = true
}

const updateMutation = useMutation({
  mutationFn: (body: Record<string, unknown>) => postPostUpdate({ body: body as Parameters<typeof postPostUpdate>[0]['body'] }),
  onSuccess: () => {
    message.success('状态已更新')
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
    statusModalVisible.value = false
  },
  onError: (err: Error) => message.error(err.message || '更新失败'),
})

function handleStatusChange() {
  if (editingPost.value?.id && newStatus.value) {
    updateMutation.mutate({ id: editingPost.value.id, status: newStatus.value })
  }
}

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '职位', dataIndex: 'title', key: 'title' },
  { title: '公司', dataIndex: 'companyTitle', key: 'companyTitle' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '投递时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 100 },
]
</script>

<template>
  <div class="bg-white rounded-lg p-6">
    <h2 class="text-lg font-medium mb-4">投递管理</h2>

    <div class="mb-4">
      <a-input v-model:value="keyword" placeholder="搜索姓名/职位" class="w-60" allow-clear />
    </div>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      row-key="id"
      :pagination="{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
      @change="(pag: any) => { page = pag.current; pageSize = pag.pageSize }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <RecruitmentStatusTag :status="record.status" />
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openStatusModal(record)">变更状态</a-button>
        </template>
      </template>
    </a-table>

    <!-- 状态变更弹窗 -->
    <a-modal v-model:open="statusModalVisible" title="变更状态" @ok="handleStatusChange">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="新状态">
          <a-select v-model:value="newStatus" :options="statusOptions" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
