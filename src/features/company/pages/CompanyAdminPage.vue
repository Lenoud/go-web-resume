<script setup lang="ts">
import { ref } from 'vue'
import { useCompanyTable, type CompanyItem } from '../composables/useCompany'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useCompanyTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增公司')
const editingItem = ref<CompanyItem | null>(null)

// 表单默认值
const formState = ref<CompanyItem>({ title: '' })

function openCreate() {
  modalTitle.value = '新增公司'
  editingItem.value = null
  formState.value = { title: '' }
  modalVisible.value = true
}

function openEdit(record: any) {
  const item = record as CompanyItem
  modalTitle.value = '编辑公司'
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
  { title: '公司名称', dataIndex: 'title', key: 'title' },
  { title: '规模', dataIndex: 'guimo', key: 'guimo' },
  { title: '行业', dataIndex: 'hangye', key: 'hangye' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '地点', dataIndex: 'location', key: 'location' },
  { title: '操作', key: 'action', width: 200 },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索公司" class="w-60" allow-clear />
        <a-button v-permission="PermissionCode.COMPANY_CREATE" type="primary" @click="openCreate">
          新增公司
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的公司？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.COMPANY_DELETE" danger>
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
      @change="(pag: any) => { page = pag.current; pageSize = pag.pageSize }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button v-permission="PermissionCode.COMPANY_UPDATE" type="link" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该公司？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.COMPANY_DELETE" type="link" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="公司名称" required>
          <a-input v-model:value="formState.title" />
        </a-form-item>
        <a-form-item label="规模">
          <a-input v-model:value="formState.guimo" />
        </a-form-item>
        <a-form-item label="行业">
          <a-input v-model:value="formState.hangye" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="formState.description" :rows="3" />
        </a-form-item>
        <a-form-item label="地点">
          <a-input v-model:value="formState.location" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
