<script setup lang="ts">
import { ref } from 'vue'
import { useResumeTable, type ResumeItem } from '../composables/useResume.js'
import { PermissionCode } from '@/infrastructure/permission/types'
import { EDUCATION_OPTIONS, SEX_OPTIONS, RESUME_SOURCE_OPTIONS } from '@/shared/utils/constants'

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
  { title: '求职意向', dataIndex: 'jobIntention', key: 'jobIntention', ellipsis: true },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
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
      :scroll="{ x: 'max-content' }"
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
          <a-input v-model:value="formState.name" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item label="性别">
          <a-select v-model:value="formState.sex" :options="SEX_OPTIONS" allow-clear placeholder="请选择" />
        </a-form-item>
        <a-form-item label="出生日期">
          <a-date-picker
            v-model:value="formState.birthday"
            value-format="YYYY-MM-DD"
            placeholder="请选择出生日期"
            class="w-full"
          />
        </a-form-item>
        <a-form-item label="学历">
          <a-select v-model:value="formState.education" :options="EDUCATION_OPTIONS" allow-clear placeholder="请选择学历" />
        </a-form-item>
        <a-form-item label="学校">
          <a-input v-model:value="formState.school" placeholder="请输入毕业学校" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="formState.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="手机">
          <a-input v-model:value="formState.mobile" placeholder="请输入手机号" />
        </a-form-item>
        <a-form-item label="来源">
          <a-select v-model:value="formState.source" :options="RESUME_SOURCE_OPTIONS" allow-clear placeholder="请选择来源" />
        </a-form-item>
        <a-form-item label="个人简介">
          <a-textarea v-model:value="formState.summary" :rows="3" placeholder="请输入个人简介" />
        </a-form-item>
        <a-form-item label="技能">
          <a-textarea v-model:value="formState.skills" :rows="3" placeholder="请输入技能" />
        </a-form-item>
        <a-form-item label="工作经历">
          <a-textarea v-model:value="formState.experience" :rows="3" placeholder="请输入工作经历" />
        </a-form-item>
        <a-form-item label="期望薪资">
          <a-input v-model:value="formState.expectedSalary" placeholder="请输入期望薪资" />
        </a-form-item>
        <a-form-item label="求职意向">
          <a-input v-model:value="formState.jobIntention" placeholder="请输入求职意向" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
