<script setup lang="ts">
import { ref } from 'vue'
import { useTalentPoolTable, type TalentPoolItem } from '../composables/useTalentPool.js'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useTalentPoolTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('添加人才')
const editingItem = ref<TalentPoolItem | null>(null)

// 表单默认值
const formState = ref<Pick<TalentPoolItem, 'resumeSnapshotId' | 'tags' | 'remark'>>({
  resumeSnapshotId: '',
  tags: '',
  remark: '',
})

function openCreate() {
  modalTitle.value = '添加人才'
  editingItem.value = null
  formState.value = { resumeSnapshotId: '', tags: '', remark: '' }
  modalVisible.value = true
}

function openEdit(record: unknown) {
  const item = record as TalentPoolItem
  modalTitle.value = '编辑人才'
  editingItem.value = item
  formState.value = {
    resumeSnapshotId: item.resumeSnapshotId ?? '',
    tags: item.tags ?? '',
    remark: item.remark ?? '',
  }
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
  { title: '学历', dataIndex: 'education', key: 'education' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机', dataIndex: 'mobile', key: 'mobile' },
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
        <a-input v-model:value="keyword" placeholder="搜索人才" class="w-60" allow-clear />
        <a-button v-permission="PermissionCode.TALENT_ADD" type="primary" @click="openCreate">
          添加人才
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量移除选中的人才？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.TALENT_REMOVE" danger>
            批量移除 ({{ selectedRowKeys.length }})
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
          <a-button v-permission="PermissionCode.TALENT_UPDATE" type="link" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认移除该人才？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.TALENT_REMOVE" type="link" danger>
              移除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 添加/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="快照ID" required>
          <a-input v-model:value="formState.resumeSnapshotId" :disabled="!!editingItem?.id" />
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
