<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMyJobTable, type JobItem } from '../composables/useJob.js'
import { departmentDepartmentList } from '@/client'
import { EDUCATION_OPTIONS, RECRUIT_TYPE_OPTIONS, JOB_NATURE_MAP, WORK_EXPERIENCE_OPTIONS, JOB_CATEGORY_OPTIONS } from '@/shared/utils/constants'

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useMyJobTable()

// ── 弹窗状态 ──
const modalVisible = ref(false)
const modalTitle = ref('新增职位')
const editingId = ref<string | null>(null)
const formState = ref<Partial<JobItem>>({ title: '' })

// ── 联动选项 ──

const jobNatureOptions = computed(() => {
  const rt = formState.value.recruitType as keyof typeof JOB_NATURE_MAP | undefined
  if (rt && JOB_NATURE_MAP[rt]) return JOB_NATURE_MAP[rt]
  return JOB_NATURE_MAP.all
})

const statusOptions = [
  { label: '招聘中', value: 1 },
  { label: '已关闭', value: 2 },
  { label: '已招满', value: 4 },
]

const statusColorMap: Record<number, string> = { 0: 'default', 1: 'green', 2: 'red', 3: 'default', 4: 'blue' }
const statusLabelMap: Record<number, string> = { 0: '草稿', 1: '招聘中', 2: '已关闭', 3: '已下线', 4: '已招满' }

const recruitTypeLabelMap: Record<string, string> = { experienced: '社招', campus: '校招' }
const jobNatureLabelMap: Record<string, string> = { fulltime: '全职', parttime: '兼职', intern: '实习' }

function onRecruitTypeChange() { formState.value.jobNature = undefined }

// ── 部门数据 ──
const deptData = ref<Array<{ id: string; title: string }>>([])
onMounted(async () => {
  try {
    const result = await departmentDepartmentList({ query: { page: 1, pageSize: 100 } })
    const resp = result.data
    const d = (resp?.data as any)?.list ?? []
    deptData.value = d.map((x: any) => ({ id: String(x.id), title: x.title }))
  } catch { /* ignore */ }
})

// ── 打开弹窗 ──
function openCreate() {
  modalTitle.value = '新增职位'
  editingId.value = null
  formState.value = { title: '', salaryUnit: 1 }
  modalVisible.value = true
}

function openEdit(record: unknown) {
  const item = record as JobItem
  modalTitle.value = '编辑职位'
  editingId.value = item.id ?? null
  // 薪资转换
  const divisor = item.salaryUnit === 2 ? 1 : 1000
  const minK = item.minSalary && item.minSalary > 0 ? Math.round(item.minSalary / divisor) : undefined
  const maxK = item.maxSalary && item.maxSalary > 0 ? Math.round(item.maxSalary / divisor) : undefined
  formState.value = {
    ...item,
    minSalary: minK,
    maxSalary: maxK,
    departmentId: item.departmentId ? String(item.departmentId) : undefined,
  }
  modalVisible.value = true
}

// ── 提交 ──
function handleSubmit() {
  const payload: Record<string, unknown> = { ...formState.value }
  const salaryMultiplier = (payload.salaryUnit as number) === 2 ? 1 : 1000
  const minSalary = payload.minSalary as number | undefined
  const maxSalary = payload.maxSalary as number | undefined
  payload.minSalary = minSalary && minSalary > 0 ? minSalary * salaryMultiplier : undefined
  payload.maxSalary = maxSalary && maxSalary > 0 ? maxSalary * salaryMultiplier : undefined

  // 清理空值
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined || payload[key] === '') delete payload[key]
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

// ── 行内状态切换 ──
function handleStatusChange(record: Record<string, any>, newStatus: number) {
  if (record.status === newStatus) return
  updateMutation?.mutate({ id: record.id, status: newStatus } as any)
}

// ── 表格列 ──
const columns = [
  { title: '职位名称', dataIndex: 'title', key: 'title' },
  { title: '岗位编号', dataIndex: 'jobCode', key: 'jobCode' },
  { title: '招聘类型', dataIndex: 'recruitType', key: 'recruitType' },
  { title: '工作性质', dataIndex: 'jobNature', key: 'jobNature' },
  { title: '部门', dataIndex: 'departmentTitle', key: 'departmentTitle' },
  { title: '分类', dataIndex: 'category', key: 'category' },
  { title: '薪资', key: 'salaryShow' },
  { title: '学历', dataIndex: 'education', key: 'education' },
  { title: '经验', dataIndex: 'workExpe', key: 'workExpe' },
  { title: '地点', dataIndex: 'location', key: 'location' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 240, fixed: 'right' as const },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索职位" class="w-60" allow-clear />
        <a-button type="primary" @click="openCreate">新增职位</a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的职位？"
          @confirm="batchDelete"
        >
          <a-button danger>批量删除 ({{ selectedRowKeys.length }})</a-button>
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
        <template v-else-if="column.key === 'departmentTitle'">
          {{ record.departmentTitle || '--' }}
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
          <a-dropdown :trigger="['click']">
            <a-button type="link" size="small">
              {{ statusLabelMap[record.status] ?? '状态' }} ▾
            </a-button>
            <template #overlay>
              <a-menu @click="(e: any) => handleStatusChange(record, Number(e.key))">
                <a-menu-item key="1" :disabled="record.status === 1">招聘中</a-menu-item>
                <a-menu-item key="2" :disabled="record.status === 2">已关闭</a-menu-item>
                <a-menu-item key="4" :disabled="record.status === 4">已招满</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button type="link" @click="openEdit(record)">编辑</a-button>
          <a-popconfirm title="确认删除该职位？" @confirm="handleDelete(record.id)">
            <a-button type="link" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" width="880px">
      <a-form :label-col="{ span: 4 }">
        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item label="职位名称" required>
              <a-input v-model:value="formState.title" placeholder="请输入职位名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="岗位编号">
              <a-input v-model:value="formState.jobCode" placeholder="请输入岗位编号" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="分类">
              <a-select v-model:value="formState.category" placeholder="请选择分类" allow-clear>
                <a-select-option v-for="c in JOB_CATEGORY_OPTIONS" :key="c.value" :value="c.value">{{ c.label }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="招聘类型">
              <a-select
                v-model:value="formState.recruitType"
                :options="RECRUIT_TYPE_OPTIONS"
                placeholder="请选择招聘类型"
                allow-clear
                @change="onRecruitTypeChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工作性质">
              <a-select
                v-model:value="formState.jobNature"
                :options="jobNatureOptions"
                placeholder="请选择工作性质"
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="部门">
              <a-select
                v-model:value="formState.departmentId"
                placeholder="请选择部门"
                allow-clear
                :options="deptData"
                :field-names="{ label: 'title', value: 'id' }"
              />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="职位描述">
              <a-textarea v-model:value="formState.description" :rows="4" placeholder="请输入职位描述" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="岗位要求">
              <a-textarea v-model:value="formState.requirement" :rows="4" placeholder="请输入岗位要求" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="工作地点">
              <a-input v-model:value="formState.location" placeholder="请输入工作地点" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="详细地址">
              <a-input v-model:value="formState.address" placeholder="请输入详细地址" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="薪资范围">
              <div class="flex items-center gap-1">
                <a-input-number v-model:value="formState.minSalary" placeholder="最低" class="flex-1" :min="0" :precision="0" />
                <span class="text-gray-400">~</span>
                <a-input-number v-model:value="formState.maxSalary" placeholder="最高" class="flex-1" :min="0" :precision="0" />
                <a-select v-model:value="formState.salaryUnit" style="width: 80px">
                  <a-select-option :value="1">K/月</a-select-option>
                  <a-select-option :value="2">元/天</a-select-option>
                  <a-select-option :value="3">K/年</a-select-option>
                </a-select>
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="薪资展示">
              <a-input v-model:value="formState.salaryShow" placeholder="如：10-20K/月、面议" allow-clear />
            </a-form-item>
          </a-col>
          <a-col v-if="editingId" :span="12">
            <a-form-item label="状态">
              <a-select v-model:value="formState.status" :options="statusOptions" placeholder="请选择状态" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="学历要求">
              <a-select v-model:value="formState.education" :options="EDUCATION_OPTIONS" placeholder="请选择学历" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="经验要求">
              <a-select v-model:value="formState.workExpe" :options="WORK_EXPERIENCE_OPTIONS" placeholder="请选择经验" allow-clear />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>
