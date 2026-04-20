<script setup lang="ts">
import { ref } from 'vue'
import { usePostTable, type PostItem } from '../composables/usePost.js'
import { PermissionCode } from '@/infrastructure/permission/types'
import { STATUS_LABEL, STATUS_COLOR } from '@/shared/types'
import type { RecruitmentStatus } from '@/shared/types'

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = usePostTable()

// 弹窗状态
const modalVisible = ref(false)
const editingItem = ref<PostItem | null>(null)

// 表单状态
const formState = ref<{ status: string; feedback: string; remark: string }>({
  status: '',
  feedback: '',
  remark: '',
})

// 状态选项
const statusOptions = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  label,
  value,
}))

function getRemarkPlaceholder(status: string) {
  if (status === 'rejected') return '请填写拒绝原因'
  if (status === 'on_hold') return '请填写暂缓原因和后续安排'
  if (status === 'initial_screen' || status === 're_screen') return '请填写筛选评估意见'
  if (status?.startsWith('interview')) return '请填写面试安排和评估意见'
  if (status === 'salary_negotiation') return '请填写薪资沟通进展'
  if (status === 'offer_sent') return '请填写Offer详情'
  if (status === 'hired') return '请填写入职安排'
  return '请填写内部流转备注'
}

function openEdit(record: PostItem) {
  editingItem.value = record
  formState.value = {
    status: record.status ?? '',
    feedback: record.feedback ?? '',
    remark: record.remark ?? '',
  }
  modalVisible.value = true
}

function handleSubmit() {
  if (editingItem.value?.id) {
    updateMutation?.mutate({ id: editingItem.value.id, ...formState.value })
  }
  modalVisible.value = false
}

function handleDelete(id: string) {
  deleteMutation?.mutate(id)
}

// 表格列定义
const columns = [
  { title: '求职者', dataIndex: 'name', key: 'name' },
  { title: '职位', dataIndex: 'title', key: 'title' },
  { title: '公司', dataIndex: 'companyTitle', key: 'companyTitle' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '反馈', dataIndex: 'feedback', key: 'feedback', ellipsis: true },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 200 },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索投递记录" class="w-60" allow-clear />
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的投递记录？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.POST_DELETE" danger>
            批量删除 ({{ selectedRowKeys.length }})
          </a-button>
        </a-popconfirm>
      </div>
    </div>

    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :row-selection="{ selectedRowKeys, onChange: (keys: (string | number)[]) => selectedRowKeys = keys }"
      row-key="id"
      :pagination="{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
      @change="handlePageChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="STATUS_COLOR[record.status as RecruitmentStatus] ?? 'default'">
            {{ STATUS_LABEL[record.status as RecruitmentStatus] ?? record.status }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button v-permission="PermissionCode.POST_UPDATE" type="link" @click="openEdit(record)">
            变更状态
          </a-button>
          <a-popconfirm title="确认删除该投递记录？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.POST_DELETE" type="link" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 变更状态弹窗 -->
    <a-modal v-model:open="modalVisible" title="变更投递状态" @ok="handleSubmit" width="560px">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="当前状态">
          <a-tag :color="STATUS_COLOR[editingItem?.status as RecruitmentStatus] ?? 'default'">
            {{ STATUS_LABEL[editingItem?.status as RecruitmentStatus] ?? editingItem?.status }}
          </a-tag>
        </a-form-item>
        <a-form-item label="新状态">
          <a-select v-model:value="formState.status" :options="statusOptions" placeholder="请选择状态" />
        </a-form-item>
        <a-form-item label="候选人消息">
          <a-textarea
            v-model:value="formState.feedback"
            :rows="3"
            placeholder="可选填写给候选人的通知消息"
          />
        </a-form-item>
        <a-form-item label="内部备注">
          <a-textarea
            v-model:value="formState.remark"
            :rows="3"
            :placeholder="getRemarkPlaceholder(formState.status)"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
