<script setup lang="ts">
import { ref } from 'vue'
import { useResumeSnapshotTable, type ResumeSnapshotItem } from '../composables/useResumeSnapshot.js'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword,
  updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useResumeSnapshotTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('编辑快照')
const editingItem = ref<ResumeSnapshotItem | null>(null)

// 表单默认值（仅编辑部分字段）
const formState = ref<Pick<ResumeSnapshotItem, 'name' | 'rating' | 'tags' | 'remark'>>({
  name: '',
  rating: undefined,
  tags: '',
  remark: '',
})

function openEdit(record: ResumeSnapshotItem) {
  modalTitle.value = '编辑快照'
  editingItem.value = record
  formState.value = {
    name: record.name ?? '',
    rating: record.rating,
    tags: record.tags ?? '',
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
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '性别', dataIndex: 'sex', key: 'sex' },
  { title: '学历', dataIndex: 'education', key: 'education' },
  { title: '学校', dataIndex: 'school', key: 'school' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '评分', dataIndex: 'rating', key: 'rating' },
  { title: '标签', dataIndex: 'tags', key: 'tags' },
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
        <a-input v-model:value="keyword" placeholder="搜索快照" class="w-60" allow-clear />
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的快照？"
          @confirm="batchDelete"
        >
          <a-button danger>
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
          <a-button v-permission="PermissionCode.RESUME_UPDATE" type="link" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该快照？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.RESUME_DELETE" type="link" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 编辑弹窗（仅编辑部分字段） -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="姓名">
          <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item label="评分">
          <a-input-number v-model:value="formState.rating" :min="0" :max="10" class="w-full" />
        </a-form-item>
        <a-form-item label="标签">
          <a-input v-model:value="formState.tags" placeholder="多个标签用逗号分隔" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="formState.remark" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
