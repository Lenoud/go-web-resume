<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useResumeSnapshotTable, type ResumeSnapshotInfo } from '../composables/useResumeSnapshot.js'
import { PermissionCode } from '@/infrastructure/permission/types'
import { postCreateFromSnapshot, jobList, resumeParseResult, resumeSnapshotDetail } from '@/client'
import type { JobInfo } from '@/client'
import { EDUCATION_OPTIONS, SEX_OPTIONS, RESUME_SOURCE_OPTIONS } from '@/shared/utils/constants'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { useAuthStore } from '@/infrastructure/store/auth'

const auth = useAuthStore()
const queryClient = useQueryClient()
type SelectOption = { title?: string }
type UploadResponse = { data?: { taskId?: string } }

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useResumeSnapshotTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('编辑快照')
const editingItem = ref<ResumeSnapshotInfo | null>(null)

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

function openEdit(record: ResumeSnapshotInfo) {
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
    updateMutation?.mutate(payload)
  }
  modalVisible.value = false
}

function handleDelete(id: string) {
  deleteMutation?.mutate(id)
}

// ── 详情弹窗 ──
interface WorkExperienceItem { company?: string; position?: string; duration?: string }
interface ProjectItem { name?: string; role?: string; description?: string }
interface EduDetailItem { school?: string; degree?: string; major?: string; duration?: string }

function parseSkills(skills: unknown): string[] {
  if (!skills) return []
  try {
    const arr: unknown = JSON.parse(String(skills))
    return Array.isArray(arr) ? arr.filter((item): item is string => typeof item === 'string') : []
  }
  catch { return [] }
}

function parseJSON<T extends object>(str: unknown): T[] {
  if (!str) return []
  try {
    const arr: unknown = JSON.parse(String(str))
    return Array.isArray(arr)
      ? arr.filter((item): item is T => typeof item === 'object' && item !== null)
      : []
  }
  catch { return [] }
}

function parseWorkExperience(str: unknown) { return parseJSON<WorkExperienceItem>(str) }
function parseProjects(str: unknown) { return parseJSON<ProjectItem>(str) }

function getEduItems(item: Pick<ResumeSnapshotInfo, 'eduDetail' | 'school' | 'education'>) {
  const items = parseJSON<EduDetailItem>(item.eduDetail)
  if (items.length) return items
  if (item.school || item.education) return [{ school: item.school || '', degree: item.education || '', major: '', duration: '' }]
  return []
}

const detailModal = reactive<{ visible: boolean; data: ResumeSnapshotInfo | null; loading: boolean }>({
  visible: false,
  data: null,
  loading: false,
})

async function openDetail(record: ResumeSnapshotInfo) {
  detailModal.visible = true
  detailModal.loading = true
  detailModal.data = record
  try {
    const res = await resumeSnapshotDetail({ query: { id: record.id ?? '' } })
    const snapshot = res.data?.data
    if (snapshot) detailModal.data = snapshot
  } catch { /* fallback to list data */ }
  detailModal.loading = false
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

async function openRecommend(record: ResumeSnapshotInfo) {
  recommendModal.snapshotId = record.id ?? ''
  recommendModal.selectedJobId = ''
  recommendModal.submitting = false
  recommendModal.visible = true
  try {
    const result = await jobList({ query: { page: 1, pageSize: 200 } })
    const resp = result.data
    const rawList: JobInfo[] = resp?.data?.list ?? []
    jobOptions.value = rawList.map(j => ({ id: String(j.id), title: j.title || '未命名' }))
  } catch { /* ignore */ }
}

async function submitRecommend() {
  if (!recommendModal.selectedJobId) {
    message.warning('请选择目标岗位')
    return
  }
  recommendModal.submitting = true
  try {
    await postCreateFromSnapshot({
      body: {
        resumeSnapshotId: recommendModal.snapshotId,
        jobId: recommendModal.selectedJobId,
      },
    })
    message.success('推荐成功，已创建投递记录')
    recommendModal.visible = false
  } catch (err: unknown) {
    message.warn(errorMessage(err, '推荐失败'))
  } finally {
    recommendModal.submitting = false
  }
}

// ── 批量上传 ──
interface BatchUploadItem {
  uid: string
  file: File
  fileName: string
  status: 'waiting' | 'uploading' | 'parsing' | 'success' | 'failed'
  taskId?: string
  errorMsg?: string
}

// 会话级解析任务记录
const activeIntervals = new Map<string, ReturnType<typeof setInterval>>()

const batchUploadModal = reactive({
  visible: false,
  source: '' as string,
  addToTalentPool: false,
  fileList: [] as BatchUploadItem[],
  uploading: false,
})

function openBatchUploadModal() {
  batchUploadModal.fileList = []
  batchUploadModal.source = ''
  batchUploadModal.addToTalentPool = false
  batchUploadModal.uploading = false
  batchUploadModal.visible = true
}

function handleBatchFileSelect(file: File) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    message.warning('仅支持 PDF 文件')
    return false
  }
  batchUploadModal.fileList.push({
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    fileName: file.name,
    status: 'waiting',
  })
  return false
}

function removeBatchFile(uid: string) {
  if (batchUploadModal.uploading) return
  const idx = batchUploadModal.fileList.findIndex(f => f.uid === uid)
  if (idx >= 0) batchUploadModal.fileList.splice(idx, 1)
}

async function startBatchUpload() {
  if (!batchUploadModal.source) {
    message.warning('请选择简历来源')
    return
  }
  if (batchUploadModal.fileList.length === 0) {
    message.warning('请先选择文件')
    return
  }
  batchUploadModal.uploading = true

  const token = window.location.pathname.startsWith('/admin')
    ? (auth.adminToken || localStorage.getItem('admin_token'))
    : (auth.userToken || localStorage.getItem('user_token'))
  if (!token) {
    message.error('登录已过期，请重新登录')
    batchUploadModal.uploading = false
    return
  }

  // 并行上传所有文件
  const promises = batchUploadModal.fileList.map(async (item) => {
    if ((item.status as string) === 'success') return
    item.status = 'uploading'
    item.errorMsg = undefined

    try {
      const fd = new FormData()
      fd.append('rawFile', item.file)
      fd.append('source', batchUploadModal.source)
      if (batchUploadModal.addToTalentPool) {
        fd.append('addToTalentPool', 'true')
      }

      const resp = await fetch('/api/resume/companyUpload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      })
      const result = await resp.json() as UploadResponse

      const taskId = result.data?.taskId
      if (!taskId) throw new Error('服务端未返回 taskId')

      item.taskId = taskId
      item.status = 'parsing'

      // 开始后台轮询（不 await，立即返回）
      startPolling(item)
    } catch (err: unknown) {
      item.status = 'failed'
      item.errorMsg = errorMessage(err, '上传失败')
      checkAllDone()
    }
  })

  await Promise.allSettled(promises)
  // 不立刻设 uploading=false，等所有解析完成再切回配置区域
  checkAllDone()
}

// 后台轮询：不阻塞上传流程
function startPolling(item: BatchUploadItem) {
  const interval = setInterval(async () => {
    if (!item.taskId) return
    try {
      const result = await resumeParseResult({ query: { taskId: item.taskId } })
      const task = result.data?.data
      const status: string = task?.status ?? ''

      if (status === 'done') {
        clearInterval(interval)
        activeIntervals.delete(item.uid)
        item.status = 'success'
        queryClient.invalidateQueries({ queryKey: queryKeys.resumeSnapshots.all })
        checkAllDone()
      } else if (status === 'failed') {
        clearInterval(interval)
        activeIntervals.delete(item.uid)
        item.status = 'failed'
        item.errorMsg = task?.msg || '解析失败'
        checkAllDone()
      }
    } catch {
      // 网络错误继续轮询
    }
  }, 2000)

  activeIntervals.set(item.uid, interval)

  // 5 分钟超时
  setTimeout(() => {
    if (item.status === 'parsing') {
      clearInterval(interval)
      activeIntervals.delete(item.uid)
      item.status = 'failed'
      item.errorMsg = '解析超时'
      checkAllDone()
    }
  }, 5 * 60 * 1000)
}

// 检查是否所有任务都已完成（成功或失败），如果是则切回配置区域并刷新列表
function checkAllDone() {
  const allDone = batchUploadModal.fileList.every(
    item => item.status === 'success' || item.status === 'failed',
  )
  if (allDone) {
    batchUploadModal.uploading = false
    const successCount = batchUploadModal.fileList.filter(f => f.status === 'success').length
    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumeSnapshots.all })
      message.success(`批量上传完成：${successCount}/${batchUploadModal.fileList.length} 成功`)
    } else {
      message.warning('批量上传完成，全部失败')
    }
  }
}

function closeBatchUploadModal() {
  const hasParsing = batchUploadModal.fileList.some(f => f.status === 'parsing' || f.status === 'uploading')
  if (hasParsing) {
    message.info('解析任务仍在后台运行，可在「解析状态」页面查看进度', 4)
  }
  batchUploadModal.visible = false
}

// 组件卸载时清理所有轮询
onUnmounted(() => {
  for (const [, interval] of activeIntervals) {
    clearInterval(interval)
  }
  activeIntervals.clear()
})

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback
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
  { title: '操作', key: 'action', width: 320, fixed: 'right' as const },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input
          v-model:value="keyword"
          placeholder="搜索快照"
          class="w-60"
          allow-clear
        />
        <a-button
          v-permission="PermissionCode.RESUME_CREATE"
          type="primary"
          @click="openBatchUploadModal"
        >
          批量上传
        </a-button>
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
      :scroll="{ x: 'max-content' }"
      @change="handlePageChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button
            type="link"
            size="small"
            @click="openDetail(record as ResumeSnapshotInfo)"
          >
            详情
          </a-button>
          <a-button
            v-if="record.raw"
            type="link"
            size="small"
            @click="openResumePreview(record.raw)"
          >
            查看简历
          </a-button>
          <a-button
            type="link"
            size="small"
            @click="openRecommend(record as ResumeSnapshotInfo)"
          >
            推荐到岗位
          </a-button>
          <a-button
            v-permission="PermissionCode.RESUME_UPDATE"
            type="link"
            size="small"
            @click="openEdit(record as ResumeSnapshotInfo)"
          >
            编辑
          </a-button>
          <a-popconfirm
            title="确认删除该快照？"
            @confirm="handleDelete(record.id)"
          >
            <a-button
              v-permission="PermissionCode.RESUME_DELETE"
              type="link"
              size="small"
              danger
            >
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 编辑弹窗 - 完整字段 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="880px"
      @ok="handleSubmit"
    >
      <a-form :label-col="{ span: 4 }">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="姓名">
              <a-input
                v-model:value="formState.name"
                placeholder="请输入姓名"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="性别">
              <a-select
                v-model:value="formState.sex"
                :options="SEX_OPTIONS"
                allow-clear
                placeholder="请选择"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱">
              <a-input
                v-model:value="formState.email"
                placeholder="请输入邮箱"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机">
              <a-input
                v-model:value="formState.mobile"
                placeholder="请输入手机号"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="学历">
              <a-select
                v-model:value="formState.education"
                :options="EDUCATION_OPTIONS"
                allow-clear
                placeholder="请选择学历"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="学校">
              <a-input
                v-model:value="formState.school"
                placeholder="请输入毕业学校"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="期望薪资">
              <a-input
                v-model:value="formState.expectedSalary"
                placeholder="如 15K-20K"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="求职意向">
              <a-input
                v-model:value="formState.jobIntention"
                placeholder="如 后端开发"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="来源">
              <a-select
                v-model:value="formState.source"
                :options="RESUME_SOURCE_OPTIONS"
                allow-clear
                placeholder="请选择来源"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="评分">
              <a-input-number
                v-model:value="formState.rating"
                :min="0"
                :max="10"
                class="w-full"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="标签">
              <a-input
                v-model:value="formState.tags"
                placeholder="多个标签用逗号分隔"
              />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item
              label="技能"
              :label-col="{ span: 2 }"
            >
              <a-textarea
                v-model:value="formState.skills"
                placeholder="如: Go, Java, Docker..."
                :rows="2"
              />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item
              label="自我评价"
              :label-col="{ span: 2 }"
            >
              <a-textarea
                v-model:value="formState.summary"
                placeholder="简要介绍"
                :rows="3"
              />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item
              label="备注"
              :label-col="{ span: 2 }"
            >
              <a-textarea
                v-model:value="formState.remark"
                :rows="3"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailModal.visible"
      title="候选人详情"
      :footer="null"
      width="640px"
    >
      <a-spin :spinning="detailModal.loading">
        <div v-if="detailModal.data">
          <div class="mb-4">
            <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">
              基本信息
            </h4>
            <p class="text-sm text-text-secondary m-1">
              <b>姓名：</b>{{ detailModal.data.name || '-' }}
            </p>
            <p
              v-if="detailModal.data.sex"
              class="text-sm text-text-secondary m-1"
            >
              <b>性别：</b>{{ detailModal.data.sex }}
            </p>
            <p class="text-sm text-text-secondary m-1">
              <b>手机：</b>{{ detailModal.data.mobile || '-' }}
            </p>
            <p class="text-sm text-text-secondary m-1">
              <b>邮箱：</b>{{ detailModal.data.email || '-' }}
            </p>
            <p
              v-if="detailModal.data.expectedSalary"
              class="text-sm text-text-secondary m-1"
            >
              <b>期望薪资：</b>{{ detailModal.data.expectedSalary }}
            </p>
            <p
              v-if="detailModal.data.jobIntention"
              class="text-sm text-text-secondary m-1"
            >
              <b>求职意向：</b>{{ detailModal.data.jobIntention }}
            </p>
            <p
              v-if="detailModal.data.source"
              class="text-sm text-text-secondary m-1"
            >
              <b>来源：</b>{{ detailModal.data.source }}
            </p>
            <p
              v-if="detailModal.data.summary"
              class="text-sm text-text-secondary m-1"
            >
              <b>个人总结：</b>{{ detailModal.data.summary }}
            </p>
          </div>
          <div
            v-if="getEduItems(detailModal.data).length"
            class="mb-4"
          >
            <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">
              教育经历
            </h4>
            <div
              v-for="(e, i) in getEduItems(detailModal.data)"
              :key="`edu-${i}`"
              class="text-sm mb-1"
            >
              <span class="font-semibold text-text-primary">{{ e.school || '-' }}</span>
              <span
                v-if="e.degree"
                class="text-primary ml-2 text-xs"
              >{{ e.degree }}</span>
              <span class="text-text-secondary ml-2">{{ e.major || '-' }}</span>
              <span class="text-text-muted ml-2">{{ e.duration || '-' }}</span>
            </div>
          </div>
          <div
            v-if="parseSkills(detailModal.data.skills).length"
            class="mb-4"
          >
            <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">
              技能
            </h4>
            <div>
              <a-tag
                v-for="s in parseSkills(detailModal.data.skills)"
                :key="s"
                color="blue"
                class="m-0.5"
              >
                {{ s }}
              </a-tag>
            </div>
          </div>
          <div
            v-if="parseWorkExperience(detailModal.data.experience).length"
            class="mb-4"
          >
            <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">
              工作经历
            </h4>
            <div
              v-for="(e, i) in parseWorkExperience(detailModal.data.experience)"
              :key="i"
              class="text-sm mb-1"
            >
              <span class="font-semibold text-text-primary">{{ e.company }}</span>
              <span class="text-text-secondary ml-2">{{ e.position }}</span>
              <span class="text-text-muted ml-2">{{ e.duration }}</span>
            </div>
          </div>
          <div
            v-if="parseProjects(detailModal.data.projects).length"
            class="mb-4"
          >
            <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">
              项目经历
            </h4>
            <div
              v-for="(p, i) in parseProjects(detailModal.data.projects)"
              :key="i"
              class="mb-2"
            >
              <span class="font-semibold text-text-primary text-sm">{{ p.name }}</span>
              <span class="text-text-secondary ml-2 text-sm">{{ p.role }}</span>
              <p
                v-if="p.description"
                class="text-sm text-text-secondary m-0.5 leading-relaxed"
              >
                {{ p.description }}
              </p>
            </div>
          </div>
          <div
            v-if="detailModal.data.tags || detailModal.data.remark"
            class="mb-4"
          >
            <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">
              HR 标注
            </h4>
            <p
              v-if="detailModal.data.tags"
              class="text-sm text-text-secondary m-1"
            >
              <b>标签：</b>
              <a-tag
                v-for="t in detailModal.data.tags.split(',').filter(Boolean)"
                :key="t"
                color="orange"
                class="m-0.5"
              >
                {{ t }}
              </a-tag>
            </p>
            <p
              v-if="detailModal.data.remark"
              class="text-sm text-text-secondary m-1"
            >
              <b>备注：</b>{{ detailModal.data.remark }}
            </p>
          </div>
        </div>
      </a-spin>
    </a-modal>

    <!-- 简历预览 Drawer -->
    <a-drawer
      v-model:open="resumeDrawer.visible"
      title="简历预览"
      width="700px"
    >
      <iframe
        v-if="resumeDrawer.url"
        :src="resumeDrawer.url"
        class="w-full h-[80vh] border-none"
      />
    </a-drawer>

    <!-- 推荐到岗位 Modal -->
    <a-modal
      v-model:open="recommendModal.visible"
      title="推荐到岗位"
      :confirm-loading="recommendModal.submitting"
      width="480px"
      @ok="submitRecommend"
    >
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="目标岗位">
          <a-select
            v-model:value="recommendModal.selectedJobId"
            placeholder="请选择岗位"
            show-search
            :filter-option="(input: string, option?: SelectOption) => option?.title?.toLowerCase().includes(input.toLowerCase()) ?? false"
          >
            <a-select-option
              v-for="j in jobOptions"
              :key="j.id"
              :value="j.id"
              :title="j.title"
            >
              {{ j.title }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量上传 Modal -->
    <a-modal
      v-model:open="batchUploadModal.visible"
      title="批量上传简历"
      width="680px"
      :footer="null"
    >
      <!-- 配置区域 -->
      <div v-if="!batchUploadModal.uploading">
        <a-form :label-col="{ span: 4 }">
          <a-form-item
            label="简历来源"
            required
          >
            <a-select
              v-model:value="batchUploadModal.source"
              :options="RESUME_SOURCE_OPTIONS"
              placeholder="请选择来源"
              allow-clear
            />
          </a-form-item>
          <a-form-item label="加入人才库">
            <a-switch v-model:checked="batchUploadModal.addToTalentPool" />
          </a-form-item>
          <a-form-item label="选择文件">
            <a-upload
              :before-upload="handleBatchFileSelect"
              :show-upload-list="false"
              accept=".pdf"
              multiple
            >
              <a-button>选择 PDF 文件</a-button>
            </a-upload>
            <span class="ml-2 text-gray-400 text-xs">仅支持 PDF 格式</span>
          </a-form-item>
        </a-form>

        <!-- 文件列表 -->
        <div
          v-if="batchUploadModal.fileList.length > 0"
          class="mb-4"
        >
          <div class="text-sm text-gray-500 mb-2">
            已选择 {{ batchUploadModal.fileList.length }} 个文件：
          </div>
          <div
            v-for="item in batchUploadModal.fileList"
            :key="item.uid"
            class="flex items-center justify-between py-1 px-2 bg-gray-50 rounded mb-1"
          >
            <span class="text-sm truncate flex-1">{{ item.fileName }}</span>
            <span
              class="text-red-400 text-xs cursor-pointer ml-2 shrink-0"
              @click="removeBatchFile(item.uid)"
            >
              移除
            </span>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <a-button @click="closeBatchUploadModal">
            取消
          </a-button>
          <a-button
            type="primary"
            :disabled="batchUploadModal.fileList.length === 0"
            @click="startBatchUpload"
          >
            开始上传
          </a-button>
        </div>
      </div>

      <!-- 进度区域 -->
      <div v-else>
        <div class="mb-3 text-sm text-gray-500">
          上传进度：{{ batchUploadModal.fileList.filter(f => f.status === 'success').length }} / {{ batchUploadModal.fileList.length }}
          <span class="ml-2 text-gray-400">（可关闭弹窗，后台继续解析）</span>
        </div>
        <div
          v-for="item in batchUploadModal.fileList"
          :key="item.uid"
          class="flex items-center gap-2 py-2 px-3 border-b last:border-b-0"
        >
          <span
            class="text-sm truncate flex-1"
            :title="item.fileName"
          >{{ item.fileName }}</span>
          <a-tag
            v-if="item.status === 'waiting'"
            color="default"
          >
            等待中
          </a-tag>
          <a-tag
            v-else-if="item.status === 'uploading'"
            color="processing"
          >
            上传中
          </a-tag>
          <a-tag
            v-else-if="item.status === 'parsing'"
            color="blue"
          >
            <span class="animate-pulse">解析中</span>
          </a-tag>
          <a-tag
            v-else-if="item.status === 'success'"
            color="success"
          >
            成功
          </a-tag>
          <a-tag
            v-else-if="item.status === 'failed'"
            color="error"
          >
            失败
          </a-tag>
          <span
            v-if="item.errorMsg"
            class="text-xs text-red-400 truncate max-w-[200px]"
            :title="item.errorMsg"
          >
            {{ item.errorMsg }}
          </span>
        </div>
      </div>
    </a-modal>
  </div>
</template>
