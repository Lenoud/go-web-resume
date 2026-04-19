<script setup lang="ts">
import { ref } from 'vue'
import { useUserTable, type UserItem } from '../composables/useUser'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useUserTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增用户')
const editingItem = ref<UserItem | null>(null)

// 表单默认值
const formState = ref<UserItem>({ username: '', password: '' })

// 角色选项
const roleOptions = [
  { label: '求职者', value: '1' },
  { label: 'HR', value: '2' },
  { label: '管理员', value: '3' },
]

// 状态选项
const statusOptions = [
  { label: '禁用', value: '0' },
  { label: '正常', value: '1' },
]

// 角色颜色映射
const roleColorMap: Record<string, string> = {
  '1': 'blue',
  '2': 'green',
  '3': 'red',
}

const roleLabelMap: Record<string, string> = {
  '1': '求职者',
  '2': 'HR',
  '3': '管理员',
}

function openCreate() {
  modalTitle.value = '新增用户'
  editingItem.value = null
  formState.value = { username: '', password: '', role: '1', status: '1' }
  modalVisible.value = true
}

function openEdit(record: unknown) {
  const item = record as UserItem
  modalTitle.value = '编辑用户'
  editingItem.value = item
  formState.value = { ...item, password: '' }
  modalVisible.value = true
}

function handleSubmit() {
  if (editingItem.value?.id) {
    const payload: Record<string, unknown> = { id: editingItem.value.id, ...formState.value }
    // 编辑时如果密码为空则不传
    if (!formState.value.password) {
      delete payload.password
    }
    updateMutation?.mutate(payload)
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
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机', dataIndex: 'mobile', key: 'mobile' },
  { title: '角色', dataIndex: 'role', key: 'role' },
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
        <a-input v-model:value="keyword" placeholder="搜索用户" class="w-60" allow-clear />
        <a-button v-permission="PermissionCode.USER_CREATE" type="primary" @click="openCreate">
          新增用户
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的用户？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.USER_DELETE" danger>
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
        <template v-if="column.key === 'role'">
          <a-tag :color="roleColorMap[record.role] ?? 'default'">
            {{ roleLabelMap[record.role] ?? '未知' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === '1' ? 'green' : 'red'">
            {{ record.status === '1' ? '正常' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button v-permission="PermissionCode.USER_UPDATE" type="link" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该用户？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.USER_DELETE" type="link" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="用户名" required>
          <a-input v-model:value="formState.username" />
        </a-form-item>
        <a-form-item v-if="!editingItem?.id" label="密码" required>
          <a-input-password v-model:value="formState.password" />
        </a-form-item>
        <a-form-item v-else label="密码">
          <a-input-password v-model:value="formState.password" placeholder="留空则不修改" />
        </a-form-item>
        <a-form-item label="昵称">
          <a-input v-model:value="formState.nickname" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="formState.email" />
        </a-form-item>
        <a-form-item label="手机">
          <a-input v-model:value="formState.mobile" />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="formState.role" :options="roleOptions" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="formState.status" :options="statusOptions" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
