<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDepartmentTable, type DepartmentItem } from '../composables/useDepartment.js'
import { PermissionCode } from '@/infrastructure/permission/types'

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useDepartmentTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增部门')
const editingId = ref<string | null>(null)

// 表单默认值
const formState = ref<Partial<DepartmentItem>>({ title: '' })

/** 将扁平部门列表构建为树形结构，编辑时排除自身及子部门 */
const treeData = computed(() => {
  const departments = list.value as DepartmentItem[]
  const excludeId = editingId.value ? Number(editingId.value) : null

  // 收集需要排除的 id（自身 + 所有后代）
  const excludeIds = new Set<number>()
  if (excludeId) {
    excludeIds.add(excludeId)
    const collect = (pid: number) => {
      departments.forEach((d: DepartmentItem) => {
        if (Number(d.parentId) === pid) {
          excludeIds.add(Number(d.id))
          collect(Number(d.id))
        }
      })
    }
    collect(excludeId)
  }

  const filtered = departments.filter((d: DepartmentItem) => !excludeIds.has(Number(d.id)))
  const map = new Map<number, DepartmentItem & { children: DepartmentItem[] }>()
  const roots: (DepartmentItem & { children: DepartmentItem[] })[] = []

  filtered.forEach((d: DepartmentItem) => {
    map.set(Number(d.id), { ...d, children: [] })
  })
  filtered.forEach((d: DepartmentItem) => {
    const node = map.get(Number(d.id))!
    const pid = Number(d.parentId)
    if (!pid || !map.has(pid)) {
      roots.push(node)
    } else {
      map.get(pid)!.children.push(node)
    }
  })

  // 清理空 children 数组
  const clean = (nodes: (DepartmentItem & { children?: DepartmentItem[] })[]) => {
    nodes.forEach((n) => {
      if (n.children && n.children.length === 0) delete n.children
      else if (n.children) clean(n.children)
    })
  }
  clean(roots)

  return roots
})

/** 根据 parentId 获取父部门名称 */
function getParentName(parentId: string | number | undefined) {
  const pid = Number(parentId)
  if (!pid) return '—'
  const parent = (list.value as DepartmentItem[]).find((d: DepartmentItem) => Number(d.id) === pid)
  return parent?.title || '—'
}

function openCreate() {
  modalTitle.value = '新增部门'
  editingId.value = null
  formState.value = { title: '' }
  modalVisible.value = true
}

function openEdit(record: unknown) {
  const item = record as DepartmentItem
  modalTitle.value = '编辑部门'
  editingId.value = item.id ?? null
  formState.value = { ...item }
  modalVisible.value = true
}

function handleSubmit() {
  const payload: Record<string, unknown> = {
    ...formState.value,
    parentId: formState.value.parentId || '0',
  }
  if (editingId.value) {
    updateMutation?.mutate({ id: editingId.value, ...payload })
  } else {
    createMutation?.mutate(payload)
  }
  modalVisible.value = false
}

function handleDelete(id: string) {
  deleteMutation?.mutate(id)
}

// 表格列定义
const columns = [
  { title: '部门名称', dataIndex: 'title', key: 'title' },
  { title: '上级部门', key: 'parentName', width: 140 },
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
      @change="handlePageChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'parentName'">
          {{ getParentName(record.parentId) }}
        </template>
        <template v-else-if="column.key === 'action'">
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
          <a-input v-model:value="formState.title" placeholder="请输入部门名称" />
        </a-form-item>
        <a-form-item label="上级部门">
          <a-tree-select
            v-model:value="formState.parentId"
            placeholder="无（顶级部门）"
            allow-clear
            tree-default-expand-all
            :tree-data="treeData"
            :field-names="{ label: 'title', value: 'id', children: 'children' }"
          />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="formState.description" :rows="3" placeholder="请输入部门描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
