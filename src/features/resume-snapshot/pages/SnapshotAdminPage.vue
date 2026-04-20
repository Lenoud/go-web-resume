<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { useResumeSnapshotTable, type ResumeSnapshotItem } from '../composables/useResumeSnapshot.js'
import { PermissionCode } from '@/infrastructure/permission/types'
import { postPostCreateFromSnapshot, jobJobList } from '@/client'
import { EDUCATION_OPTIONS, SEX_OPTIONS, RESUME_SOURCE_OPTIONS } from '@/shared/utils/constants'

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useResumeSnapshotTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('编辑快照')
const editingItem = ref<ResumeSnapshotItem | null>(null)

// 表单 - 覆盖后端 UpdateResumeSnapshotReq 所有字段
const formState = ref<{
  id?: string
  name: string
  sex: string
  email: string
  mobile: string
  education: string
  school: string
  summary: string
  skills: string
  experience: string
  projects: string
  eduDetail: string
  expectedSalary: string
  jobIntention: string
  rating: string | number | undefined
  tags: string
  remark: string
  source: string
}>({
  name: '', sex: '', email: '', mobile: '', education: '', school: '',
  summary: '', skills: '', experience: '', projects: '', eduDetail: '',
  expectedSalary: '', jobIntention: '', rating: undefined, tags: '', remark: '', source: '',
})

function openEdit(record: ResumeSnapshotItem) {
  modalTitle.value = '编辑快照'
  editingItem.value = record
  formState.value = {
    id: record.id,
    name: record.name ?? '',
    sex: record.sex ?? '',
    email: record.email ?? '',
    mobile: record.mobile ?? '',
    education: record.education ?? '',
    school: record.school ?? '',
    summary: record.summary ?? '',
    skills: record.skills ?? '',
    experience: record.experience ?? '',
    projects: record.projects ?? '',
    eduDetail: record.eduDetail ?? '',
    expectedSalary: record.expectedSalary ?? '',
    jobIntention: record.jobIntention ?? '',
    rating: record.rating != null ? String(record.rating) : '',
    tags: record.tags ?? '',
    remark: record.remark ?? '',
    source: record.source ?? '',
  }
  modalVisible.value = true
}

function handleSubmit() {
  if (editingItem.value?.id) {
    const payload = { ...formState.value }
    updateMutation?.mutate(payload as any)
  }
  modalVisible.value = false
}

function handleDelete(id: string) {
  deleteMutation?.mutate(id)
}

// 简历预览 Drawer
const resumeDrawer = reactive({ visible: false, url: '' })

function openResumePreview(raw: string) {
  if (!raw) return
  resumeDrawer.url = `/api/staticfiles/resume/${raw}`
  resumeDrawer.visible = true
}

// 推荐到岗位（创建投递记录）
const recommendModal = reactive({ visible: false, submitting: false, snapshotId: '', selectedJobId: '' })
const jobOptions = ref<Array<{ id: string; title: string }>>([])

async function openRecommend(record: ResumeSnapshotItem) {
  recommendModal.snapshotId = record.id ?? ''
  recommendModal.selectedJobId = ''
  recommendModal.submitting = false
  recommendModal.visible = true
  try {
    const result = await jobJobList({ query: { page: 1, pageSize: 200 } })
    const resp = result.data
    const data = (resp?.data as any)
    const rawList = data?.list ?? data ?? []
    jobOptions.value = rawList.map((j: any) => ({ id: String(j.id), title: j.title || '未命名' }))
  } catch { /* ignore */ }
}

async function submitRecommend() {
  if (!recommendModal.selectedJobId) {
    message.warning('请选择目标岗位')
    return
  }
  recommendModal.submitting = true
  try {
    await postPostCreateFromSnapshot({
      body: {
        resumeSnapshotId: recommendModal.snapshotId,
        jobId: recommendModal.selectedJobId,
      } as any,
    })
    message.success('推荐成功，已创建投递记录')
    recommendModal.visible = false
  } catch (err: any) {
    message.warn(err?.message || '推荐失败')
  } finally {
    recommendModal.submitting = false
  }
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
  { title: '求职意向', dataIndex: 'jobIntention', key: 'jobIntention', ellipsis: true },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 280, fixed: 'right' as const },
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
      @change="handlePageChange"
      :scroll="{ x: 'max-content' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button v-if="record.raw" type="link" size="small" @click="openResumePreview(record.raw)">
            查看简历
          </a-button>
          <a-button type="link" size="small" @click="openRecommend(record)">
            推荐到岗位
          </a-button>
          <a-button v-permission="PermissionCode.RESUME_UPDATE" type="link" size="small" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该快照？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.RESUME_DELETE" type="link" size="small" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 编辑弹窗 - 完整字段 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" width="880px">
      <a-form :label-col="{ span: 4 }">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="姓名">
              <a-input v-model:value="formState.name" placeholder="请输入姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="性别">
              <a-select v-model:value="formState.sex" :options="SEX_OPTIONS" allow-clear placeholder="请选择" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱">
              <a-input v-model:value="formState.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机">
              <a-input v-model:value="formState.mobile" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="学历">
              <a-select v-model:value="formState.education" :options="EDUCATION_OPTIONS" allow-clear placeholder="请选择学历" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="学校">
              <a-input v-model:value="formState.school" placeholder="请输入毕业学校" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="期望薪资">
              <a-input v-model:value="formState.expectedSalary" placeholder="如 15K-20K" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="求职意向">
              <a-input v-model:value="formState.jobIntention" placeholder="如 后端开发" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="来源">
              <a-select v-model:value="formState.source" :options="RESUME_SOURCE_OPTIONS" allow-clear placeholder="请选择来源" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="评分">
              <a-input-number v-model:value="formState.rating" :min="0" :max="10" class="w-full" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="标签">
              <a-input v-model:value="formState.tags" placeholder="多个标签用逗号分隔" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="技能" :label-col="{ span: 2 }">
              <a-textarea v-model:value="formState.skills" placeholder="如: Go, Java, Docker..." :rows="2" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="自我评价" :label-col="{ span: 2 }">
              <a-textarea v-model:value="formState.summary" placeholder="简要介绍" :rows="3" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="备注" :label-col="{ span: 2 }">
              <a-textarea v-model:value="formState.remark" :rows="3" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 简历预览 Drawer -->
    <a-drawer v-model:open="resumeDrawer.visible" title="简历预览" width="700px">
      <iframe v-if="resumeDrawer.url" :src="resumeDrawer.url" class="w-full h-[80vh] border-none" />
    </a-drawer>

    <!-- 推荐到岗位 Modal -->
    <a-modal
      v-model:open="recommendModal.visible"
      title="推荐到岗位"
      :confirm-loading="recommendModal.submitting"
      @ok="submitRecommend"
      width="480px"
    >
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="目标岗位">
          <a-select
            v-model:value="recommendModal.selectedJobId"
            placeholder="请选择岗位"
            show-search
            :filter-option="(input: string, option: any) => option.title?.toLowerCase().includes(input.toLowerCase())"
          >
            <a-select-option v-for="j in jobOptions" :key="j.id" :value="j.id" :title="j.title">{{ j.title }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
