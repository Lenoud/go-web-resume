<script setup lang="ts">
import { ref } from 'vue'
import { useJobTable, type JobItem } from '../composables/useJob'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useJobTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增职位')
const editingItem = ref<JobItem | null>(null)

// 表单默认值
const formState = ref<JobItem>({ title: '' })

function openCreate() {
  modalTitle.value = '新增职位'
  editingItem.value = null
  formState.value = { title: '' }
  modalVisible.value = true
}

function openEdit(record: unknown) {
  const item = record as JobItem
  modalTitle.value = '编辑职位'
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
  { title: '职位名称', dataIndex: 'title', key: 'title' },
  { title: '分类', dataIndex: 'category', key: 'category' },
  { title: '学历要求', dataIndex: 'education', key: 'education' },
  { title: '薪资范围', key: 'salary' },
  { title: '工作地点', dataIndex: 'location', key: 'location' },
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
        <a-input v-model:value="keyword" placeholder="搜索职位" class="w-60" allow-clear />
        <a-button v-permission="PermissionCode.JOB_CREATE" type="primary" @click="openCreate">
          新增职位
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的职位？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.JOB_DELETE" danger>
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
        <template v-if="column.key === 'salary'">
          {{ record.minSalary && record.maxSalary ? `${record.minSalary}-${record.maxSalary}` : record.salaryShow ?? '-' }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'green' : 'default'">
            {{ record.status === 1 ? '招聘中' : '草稿' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button v-permission="PermissionCode.JOB_UPDATE" type="link" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该职位？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.JOB_DELETE" type="link" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" width="640px">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="职位名称" required>
          <a-input v-model:value="formState.title" />
        </a-form-item>
        <a-form-item label="分类">
          <a-input v-model:value="formState.category" />
        </a-form-item>
        <a-form-item label="学历要求">
          <a-input v-model:value="formState.education" />
        </a-form-item>
        <a-form-item label="工作经验">
          <a-input v-model:value="formState.workExpe" />
        </a-form-item>
        <a-form-item label="最低薪资">
          <a-input-number v-model:value="formState.minSalary" class="w-full" />
        </a-form-item>
        <a-form-item label="最高薪资">
          <a-input-number v-model:value="formState.maxSalary" class="w-full" />
        </a-form-item>
        <a-form-item label="薪资说明">
          <a-input v-model:value="formState.salaryShow" />
        </a-form-item>
        <a-form-item label="工作城市">
          <a-input v-model:value="formState.location" />
        </a-form-item>
        <a-form-item label="详细地址">
          <a-input v-model:value="formState.address" />
        </a-form-item>
        <a-form-item label="工作性质">
          <a-input v-model:value="formState.jobNature" />
        </a-form-item>
        <a-form-item label="招聘类型">
          <a-input v-model:value="formState.recruitType" />
        </a-form-item>
        <a-form-item label="职位描述">
          <a-textarea v-model:value="formState.description" :rows="3" />
        </a-form-item>
        <a-form-item label="任职要求">
          <a-textarea v-model:value="formState.requirement" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
