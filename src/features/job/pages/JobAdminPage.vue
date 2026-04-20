<script setup lang="ts">
import { ref, computed } from 'vue'
import { useJobTable, type JobItem } from '../composables/useJob.js'
import { PermissionCode } from '@/infrastructure/permission/types'
import { RECRUIT_TYPE_OPTIONS, JOB_NATURE_MAP } from '@/shared/utils/constants'

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useJobTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增职位')
const editingItem = ref<JobItem | null>(null)

// 表单默认值（复用 JobItem 类型，所有字段均可选）
const formState = ref<Partial<JobItem>>({ title: '' })

// ── 招聘类型 / 工作性质联动 ──
const jobNatureOptions = computed(() => {
  const rt = formState.value.recruitType as keyof typeof JOB_NATURE_MAP | undefined
  if (rt && JOB_NATURE_MAP[rt]) return JOB_NATURE_MAP[rt]
  return JOB_NATURE_MAP.all
})

function onRecruitTypeChange() {
  formState.value.jobNature = undefined
}

// ── 状态映射 ──
const statusColorMap: Record<number, string> = {
  0: 'default',
  1: 'green',
  2: 'red',
  4: 'blue',
}
const statusLabelMap: Record<number, string> = {
  0: '草稿',
  1: '招聘中',
  2: '已关闭',
  3: '已下线',
  4: '已招满',
}

// ── 招聘类型 / 工作性质显示映射 ──
const recruitTypeLabelMap: Record<string, string> = {
  experienced: '社招',
  campus: '校招',
}
const jobNatureLabelMap: Record<string, string> = {
  fulltime: '全职',
  parttime: '兼职',
  intern: '实习',
}

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
  // 薪资转换：后端存元 → 前端显示 K（÷1000）
  const minK = item.minSalary && item.minSalary > 0 ? Math.round(item.minSalary / 1000) : undefined
  const maxK = item.maxSalary && item.maxSalary > 0 ? Math.round(item.maxSalary / 1000) : undefined
  formState.value = { ...item, minSalary: minK, maxSalary: maxK }
  modalVisible.value = true
}

function handleSubmit() {
  // 构建提交数据，薪资从 K 转回元（×1000）
  const payload: Record<string, unknown> = { ...formState.value }
  const minSalary = formState.value.minSalary
  const maxSalary = formState.value.maxSalary
  payload.minSalary = minSalary && minSalary > 0 ? minSalary * 1000 : undefined
  payload.maxSalary = maxSalary && maxSalary > 0 ? maxSalary * 1000 : undefined
  payload.salaryUnit = 1 // 默认月薪

  // 清理空值
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined || payload[key] === '') {
      delete payload[key]
    }
  }

  if (editingItem.value?.id) {
    updateMutation?.mutate({ id: editingItem.value.id, ...payload })
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
  { title: '职位名称', dataIndex: 'title', key: 'title' },
  { title: '岗位编号', dataIndex: 'jobCode', key: 'jobCode' },
  { title: '招聘类型', dataIndex: 'recruitType', key: 'recruitType' },
  { title: '工作性质', dataIndex: 'jobNature', key: 'jobNature' },
  { title: '分类', dataIndex: 'category', key: 'category' },
  { title: '薪资', key: 'salaryShow' },
  { title: '学历', dataIndex: 'education', key: 'education' },
  { title: '经验', dataIndex: 'workExpe', key: 'workExpe' },
  { title: '地点', dataIndex: 'location', key: 'location' },
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
      @change="handlePageChange"
      :scroll="{ x: 'max-content' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'jobCode'">
          {{ record.jobCode || '--' }}
        </template>
        <template v-else-if="column.key === 'recruitType'">
          {{ recruitTypeLabelMap[record.recruitType] || '--' }}
        </template>
        <template v-else-if="column.key === 'jobNature'">
          {{ jobNatureLabelMap[record.jobNature] || '--' }}
        </template>
        <template v-else-if="column.key === 'salaryShow'">
          {{ record.salaryShow || '--' }}
        </template>
        <template v-else-if="column.key === 'workExpe'">
          {{ record.workExpe || '--' }}
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColorMap[record.status] ?? 'default'">
            {{ statusLabelMap[record.status] ?? '未知' }}
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
          <a-input v-model:value="formState.title" placeholder="请输入职位名称" allow-clear />
        </a-form-item>
        <a-form-item label="岗位编号">
          <a-input v-model:value="formState.jobCode" placeholder="请输入岗位编号" allow-clear />
        </a-form-item>
        <a-form-item label="招聘类型" required>
          <a-select
            v-model:value="formState.recruitType"
            :options="RECRUIT_TYPE_OPTIONS"
            placeholder="请选择招聘类型"
            allow-clear
            @change="onRecruitTypeChange"
          />
        </a-form-item>
        <a-form-item label="工作性质" required>
          <a-select
            v-model:value="formState.jobNature"
            :options="jobNatureOptions"
            placeholder="请选择工作性质"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="薪资范围">
          <div class="flex items-center gap-1">
            <a-input-number
              v-model:value="formState.minSalary"
              placeholder="最低"
              class="flex-1"
              :min="0"
              :precision="0"
            />
            <span class="text-gray-400">~</span>
            <a-input-number
              v-model:value="formState.maxSalary"
              placeholder="最高"
              class="flex-1"
              :min="0"
              :precision="0"
            />
            <span class="whitespace-nowrap text-gray-400">K/月</span>
          </div>
        </a-form-item>
        <a-form-item label="薪资展示">
          <a-input
            v-model:value="formState.salaryShow"
            placeholder="如：10-20K/月、面议，留空则自动生成"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="学历">
          <a-input v-model:value="formState.education" placeholder="如：本科" allow-clear />
        </a-form-item>
        <a-form-item label="经验">
          <a-input v-model:value="formState.workExpe" placeholder="如：3-5年" allow-clear />
        </a-form-item>
        <a-form-item label="工作地点">
          <a-input v-model:value="formState.location" placeholder="请输入工作地点" allow-clear />
        </a-form-item>
        <a-form-item label="详细地址">
          <a-input v-model:value="formState.address" placeholder="请输入详细地址" allow-clear />
        </a-form-item>
        <a-form-item label="分类">
          <a-input v-model:value="formState.category" placeholder="如：技术、产品、设计" allow-clear />
        </a-form-item>
        <a-form-item label="职位描述">
          <a-textarea v-model:value="formState.description" :rows="3" placeholder="请输入职位描述" />
        </a-form-item>
        <a-form-item label="任职要求">
          <a-textarea v-model:value="formState.requirement" :rows="3" placeholder="请输入任职要求" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
