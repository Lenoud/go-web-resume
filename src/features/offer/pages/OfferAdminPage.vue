<script setup lang="ts">
import { ref } from 'vue'
import { useOfferTable, type OfferInfo } from '../composables/useOffer.js'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useOfferTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增Offer')
const editingItem = ref<OfferInfo | null>(null)

// 表单默认值
const formState = ref<Partial<OfferInfo>>({ postId: '' })

// 状态选项
const statusOptions = [
  { label: '待确认', value: 'pending' },
  { label: '已接受', value: 'accepted' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已撤回', value: 'withdrawn' },
]

// 状态颜色映射
const statusColorMap: Record<string, string> = {
  pending: 'orange',
  accepted: 'green',
  rejected: 'red',
  withdrawn: 'default',
}
const statusLabelMap: Record<string, string> = {
  pending: '待确认',
  accepted: '已接受',
  rejected: '已拒绝',
  withdrawn: '已撤回',
}

function openCreate() {
  modalTitle.value = '新增Offer'
  editingItem.value = null
  formState.value = { postId: '' }
  modalVisible.value = true
}

function openEdit(record: unknown) {
  const item = record as OfferInfo
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
  { title: '工作地点', dataIndex: 'workLocation', key: 'workLocation' },
  { title: '入职日期', dataIndex: 'joinDate', key: 'joinDate' },
  { title: '合同期限', dataIndex: 'contractPeriod', key: 'contractPeriod' },
  { title: '试用期', dataIndex: 'probationPeriod', key: 'probationPeriod' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
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
      :scroll="{ x: 'max-content' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="statusColorMap[record.status] ?? 'default'">
            {{ statusLabelMap[record.status] ?? record.status ?? '--' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
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
          <a-input v-model:value="formState.postId" :disabled="!!editingItem?.id" placeholder="请输入投递记录ID" />
        </a-form-item>
        <a-form-item label="薪资">
          <a-input v-model:value="formState.salary" placeholder="如：15K-25K/月" />
        </a-form-item>
        <a-form-item label="职级">
          <a-input v-model:value="formState.level" placeholder="如：P6、高级工程师" />
        </a-form-item>
        <a-form-item label="入职日期">
          <a-date-picker
            v-model:value="formState.joinDate"
            value-format="YYYY-MM-DD"
            placeholder="请选择入职日期"
            class="w-full"
          />
        </a-form-item>
        <a-form-item label="试用期">
          <a-input v-model:value="formState.probationPeriod" placeholder="如：3个月" />
        </a-form-item>
        <a-form-item label="合同期限">
          <a-input v-model:value="formState.contractPeriod" placeholder="如：3年" />
        </a-form-item>
        <a-form-item label="工作地点">
          <a-input v-model:value="formState.workLocation" placeholder="请输入工作地点" />
        </a-form-item>
        <a-form-item v-if="editingItem?.id" label="状态">
          <a-select v-model:value="formState.status" :options="statusOptions" allow-clear placeholder="请选择状态" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
