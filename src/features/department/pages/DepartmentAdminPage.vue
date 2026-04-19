<script setup lang="ts">
import { ref } from 'vue'
import { useDepartmentTable, type DepartmentItem } from '../composables/useDepartment'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useDepartmentTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增部门')
const editingItem = ref<DepartmentItem | null>(null)

// 表单默认值
const formState = ref<DepartmentItem>({ title: '' })

function openCreate() {
  modalTitle.value = '新增部门'
  editingItem.value = null
  formState.value = { title: '' }
  modalVisible.value = true
}

function openEdit(record: any) {
  const item = record as DepartmentItem
  modalTitle.value = '编辑部门'
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
  { title: '部门名称', dataIndex: 'title', key: 'title' },
  { title: '上级部门', dataIndex: 'parentId', key: 'parentId' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 200 },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索部门" class="w-60" allow-clear />
        <a-button v-permission="PermissionCode.DEPT_CREATE" type="primary" @click="openCreate">
          新增部门
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的部门？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.DEPT_DELETE" danger>
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
          <a-button v-permission="PermissionCode.DEPT_UPDATE" type="link" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该部门？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.DEPT_DELETE" type="link" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="部门名称" required>
          <a-input v-model:value="formState.title" />
        </a-form-item>
        <a-form-item label="上级部门">
          <a-input v-model:value="formState.parentId" placeholder="上级部门ID" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="formState.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
