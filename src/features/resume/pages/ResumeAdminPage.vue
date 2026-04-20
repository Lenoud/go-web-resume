<script setup lang="ts">
import { ref } from 'vue'
import { useResumeTable, type ResumeItem } from '../composables/useResume.js'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useResumeTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增简历')
const editingItem = ref<ResumeItem | null>(null)

// 表单默认值
const formState = ref<ResumeItem>({ name: '' })

// 性别选项
const sexOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' },
]

function openCreate() {
  modalTitle.value = '新增简历'
  editingItem.value = null
  formState.value = { name: '' }
  modalVisible.value = true
}

function openEdit(record: unknown) {
  const item = record as ResumeItem
  modalTitle.value = '编辑简历'
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
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '性别', dataIndex: 'sex', key: 'sex' },
  { title: '学历', dataIndex: 'education', key: 'education' },
  { title: '学校', dataIndex: 'school', key: 'school' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机', dataIndex: 'mobile', key: 'mobile' },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 200 },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索简历" class="w-60" allow-clear />
        <a-button v-permission="PermissionCode.RESUME_CREATE" type="primary" @click="openCreate">
          新增简历
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的简历？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.RESUME_DELETE" danger>
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
          <a-button v-permission="PermissionCode.RESUME_UPDATE" type="link" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该简历？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.RESUME_DELETE" type="link" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" width="640px">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="姓名" required>
          <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item label="性别">
          <a-select v-model:value="formState.sex" :options="sexOptions" allow-clear placeholder="请选择" />
        </a-form-item>
        <a-form-item label="出生日期">
          <a-input v-model:value="formState.birthday" placeholder="如: 1990-01-01" />
        </a-form-item>
        <a-form-item label="学历">
          <a-input v-model:value="formState.education" />
        </a-form-item>
        <a-form-item label="学校">
          <a-input v-model:value="formState.school" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="formState.email" />
        </a-form-item>
        <a-form-item label="手机">
          <a-input v-model:value="formState.mobile" />
        </a-form-item>
        <a-form-item label="个人简介">
          <a-textarea v-model:value="formState.summary" :rows="3" />
        </a-form-item>
        <a-form-item label="技能">
          <a-textarea v-model:value="formState.skills" :rows="3" />
        </a-form-item>
        <a-form-item label="工作经历">
          <a-textarea v-model:value="formState.experience" :rows="3" />
        </a-form-item>
        <a-form-item label="期望薪资">
          <a-input v-model:value="formState.expectedSalary" />
        </a-form-item>
        <a-form-item label="求职意向">
          <a-input v-model:value="formState.jobIntention" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
