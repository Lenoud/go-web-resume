<script setup lang="ts">
import { ref } from 'vue'
import { useOfferTable, type OfferItem } from '../composables/useOffer.js'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useOfferTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增Offer')
const editingItem = ref<OfferItem | null>(null)

// 表单默认值
const formState = ref<OfferItem>({ postId: '' })

// 状态选项
const statusOptions = [
  { label: '待确认', value: 'pending' },
  { label: '已接受', value: 'accepted' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已撤回', value: 'withdrawn' },
]

function openCreate() {
  modalTitle.value = '新增Offer'
  editingItem.value = null
  formState.value = { postId: '' }
  modalVisible.value = true
}

function openEdit(record: unknown) {
  const item = record as OfferItem
  modalTitle.value = '编辑Offer'
  editingItem.value = item
  formState.value = { ...item }
  modalVisible.value = true
}

function handleSubmit() {
  if (editingItem.value?.id) {
    updateMutation?.mutate({ id: editingItem.value.id, ...formState.value })
  } else {
    createMutation?.mutate({ ...formState.value })
  }
  modalVisible.value = false
}

function handleDelete(id: string) {
  deleteMutation?.mutate(id)
}

// 表格列定义
const columns = [
  { title: '投递ID', dataIndex: 'postId', key: 'postId' },
  { title: '薪资', dataIndex: 'salary', key: 'salary' },
  { title: '职级', dataIndex: 'level', key: 'level' },
  { title: '入职日期', dataIndex: 'joinDate', key: 'joinDate' },
  { title: '试用期', dataIndex: 'probationPeriod', key: 'probationPeriod' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 200 },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索Offer" class="w-60" allow-clear />
        <a-button v-permission="PermissionCode.OFFER_CREATE" type="primary" @click="openCreate">
          新增Offer
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的Offer？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.OFFER_DELETE" danger>
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
        <template v-if="column.key === 'action'">
          <a-button v-permission="PermissionCode.OFFER_UPDATE" type="link" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该Offer？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.OFFER_DELETE" type="link" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" width="600px">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="投递ID" required>
          <a-input v-model:value="formState.postId" :disabled="!!editingItem?.id" />
        </a-form-item>
        <a-form-item label="薪资">
          <a-input v-model:value="formState.salary" />
        </a-form-item>
        <a-form-item label="职级">
          <a-input v-model:value="formState.level" />
        </a-form-item>
        <a-form-item label="入职日期">
          <a-input v-model:value="formState.joinDate" placeholder="如: 2025-06-01" />
        </a-form-item>
        <a-form-item label="试用期">
          <a-input v-model:value="formState.probationPeriod" placeholder="如: 3个月" />
        </a-form-item>
        <a-form-item label="合同期限">
          <a-input v-model:value="formState.contractPeriod" placeholder="如: 3年" />
        </a-form-item>
        <a-form-item label="工作地点">
          <a-input v-model:value="formState.workLocation" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="formState.status" :options="statusOptions" allow-clear placeholder="请选择" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
