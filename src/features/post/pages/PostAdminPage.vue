<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import { usePostTable, type PostInfo } from '../composables/usePost.js'
import { PermissionCode } from '@/infrastructure/permission/types'
import { STATUS_LABEL, STATUS_COLOR, ALL_STATUSES, type RecruitmentStatus } from '@/shared/types'
import RecruitmentPipeline from '../components/RecruitmentPipeline.vue'
import {
  postStatusLogList,
  interviewList as interviewListApi, interviewCreate,
  offerDetail, offerCreate, offerUpdate,
  resumeSnapshotDetail,
} from '@/client'
import type { CreateInterviewReq, CreateOfferReq, InterviewInfo, OfferInfo, ResumeSnapshotInfo, StatusLogInfo, UpdateOfferReq } from '@/client'
import type { Dayjs } from 'dayjs'

type DatePickerValue = Dayjs | string | undefined
type InterviewFormState = { interviewerName: string; scheduledAt: DatePickerValue; location: string; type: string }
type OfferFormState = { salary: string; level: string; joinDate: DatePickerValue; contractPeriod: string; probationPeriod: string; workLocation: string }
type OfferModalFormState = OfferFormState & { status: string }
type EduDetailItem = { school?: string; degree?: string; major?: string; duration?: string }
type WorkExperienceItem = { company?: string; position?: string; duration?: string }
type ProjectItem = { name?: string; role?: string; description?: string }

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = usePostTable()

// ── 状态选项 ──
const statusOptions = ALL_STATUSES.map((s) => ({ label: STATUS_LABEL[s], value: s }))

function getRemarkPlaceholder(status: string) {
  if (status === 'rejected') return '请填写拒绝原因'
  if (status === 'on_hold') return '请填写暂缓原因和后续安排'
  if (status === 'initial_screen' || status === 're_screen') return '请填写筛选评估意见'
  if (status?.startsWith('interview')) return '请填写面试安排和评估意见'
  if (status === 'salary_negotiation') return '请填写薪资沟通进展'
  if (status === 'offer_sent') return '请填写Offer详情'
  if (status === 'hired') return '请填写入职安排'
  return '请填写内部流转备注'
}

function handleDelete(id: string) {
  deleteMutation?.mutate(id)
}

// ── 处理投递弹窗 ──
const processModal = reactive({
  visible: false,
  submitting: false,
  item: null as PostInfo | null,
  form: { id: '', status: 'applied', feedback: '', remark: '' },
})

const interviewForm = reactive<InterviewFormState>({
  interviewerName: '',
  scheduledAt: undefined,
  location: '',
  type: 'onsite',
})

const offerForm = reactive<OfferFormState>({
  salary: '',
  level: '',
  joinDate: undefined,
  contractPeriod: '',
  probationPeriod: '',
  workLocation: '',
})

const interviewList = ref<InterviewInfo[]>([])
const offerData = ref<OfferInfo | null>(null)

const isInterviewStatus = (status: string) => ['interview_1', 'interview_2', 'interview_3', 'interview_final'].includes(status)
const isOfferStatus = (status: string) => status === 'offer_sent'
const offerVisibleStatuses = ['offer_sent', 'salary_negotiation', 'offer_accepted', 'hired']
const isOfferVisible = (status: string) => offerVisibleStatuses.includes(status)

function openProcessModal(item: PostInfo) {
  processModal.visible = true
  processModal.submitting = false
  processModal.item = item
  processModal.form = {
    id: item.id ?? '',
    status: item.status || 'applied',
    feedback: item.feedback || '',
    remark: item.remark || '',
  }
  interviewForm.interviewerName = ''
  interviewForm.scheduledAt = undefined
  interviewForm.location = ''
  interviewForm.type = 'onsite'
  offerForm.salary = ''
  offerForm.level = ''
  offerForm.joinDate = undefined
  offerForm.contractPeriod = ''
  offerForm.probationPeriod = ''
  offerForm.workLocation = ''
  loadInterviewAndOffer(item.id ?? '')
}

async function loadInterviewAndOffer(postId: string) {
  try {
    const iRes = await interviewListApi({ query: { postId } })
    const resp = iRes.data
    interviewList.value = resp?.data?.list ?? []
  } catch { interviewList.value = [] }
  try {
    const oRes = await offerDetail({ query: { postId } })
    offerData.value = oRes.data?.data ?? null
  } catch { offerData.value = null }
}

async function submitProcess() {
  const { id, status, feedback, remark } = processModal.form
  if (!remark && (status === 'rejected' || status === 'on_hold')) {
    message.warn('请填写内部流转备注')
    return
  }

  processModal.submitting = true
  try {
    updateMutation?.mutate(
      { id, status, feedback, remark },
      {
        onSuccess: async () => {
          message.success('处理成功')
          // Create interview if status is interview stage
          if (isInterviewStatus(status)) {
            const data: CreateInterviewReq = { postId: id, round: status }
            if (interviewForm.interviewerName) data.interviewerName = interviewForm.interviewerName
            const scheduledAt = formatDate(interviewForm.scheduledAt, 'YYYY-MM-DD HH:mm:ss')
            if (scheduledAt) data.scheduledAt = scheduledAt
            if (interviewForm.location) data.location = interviewForm.location
            if (interviewForm.type) data.type = interviewForm.type
            await interviewCreate({ body: data }).catch(() => {})
          }
          // Create offer if status is offer_sent
          if (isOfferStatus(status)) {
            const data: CreateOfferReq = { postId: id }
            if (offerForm.salary) data.salary = offerForm.salary
            if (offerForm.level) data.level = offerForm.level
            const joinDate = formatDate(offerForm.joinDate, 'YYYY-MM-DD')
            if (joinDate) data.joinDate = joinDate
            if (offerForm.contractPeriod) data.contractPeriod = offerForm.contractPeriod
            if (offerForm.probationPeriod) data.probationPeriod = offerForm.probationPeriod
            if (offerForm.workLocation) data.workLocation = offerForm.workLocation
            await offerCreate({ body: data }).catch(() => {})
          }
          processModal.visible = false
        },
        onError: (err: Error & { handled?: boolean }) => { if (!err.handled) message.error(err.message || '更新失败') },
      },
    )
  } finally {
    processModal.submitting = false
  }
}

// ── Offer 独立弹窗 ──
const offerModal = reactive({
  visible: false,
  submitting: false,
  noData: false,
  id: '',
  postId: '',
  name: '',
  form: { salary: '', level: '', joinDate: undefined, contractPeriod: '', probationPeriod: '', workLocation: '', status: 'pending' } as OfferModalFormState,
})

async function openOfferModal(item: PostInfo) {
  offerModal.visible = true
  offerModal.noData = false
  offerModal.submitting = false
  offerModal.id = ''
  offerModal.postId = item.id ?? ''
  offerModal.name = item.name || '未知候选人'
  offerModal.form = { salary: '', level: '', joinDate: undefined, contractPeriod: '', probationPeriod: '', workLocation: '', status: 'pending' }
  try {
    const res = await offerDetail({ query: { postId: item.id! } })
    const offer = res.data?.data
    if (offer?.id) {
      offerModal.id = offer.id
      offerModal.form.salary = offer.salary || ''
      offerModal.form.level = offer.level || ''
      offerModal.form.joinDate = offer.joinDate || undefined
      offerModal.form.contractPeriod = offer.contractPeriod || ''
      offerModal.form.probationPeriod = offer.probationPeriod || ''
      offerModal.form.workLocation = offer.workLocation || ''
      offerModal.form.status = offer.status || 'pending'
    } else {
      offerModal.noData = true
    }
  } catch { offerModal.noData = true }
}

function submitOffer() {
  if (!offerModal.id) {
    message.warn('暂无 Offer 记录，请先在处理投递中发送 Offer')
    return
  }
  offerModal.submitting = true
  const data: UpdateOfferReq = { id: offerModal.id }
  if (offerModal.form.salary) data.salary = offerModal.form.salary
  if (offerModal.form.level) data.level = offerModal.form.level
  const joinDate = formatDate(offerModal.form.joinDate, 'YYYY-MM-DD')
  if (joinDate) data.joinDate = joinDate
  if (offerModal.form.contractPeriod) data.contractPeriod = offerModal.form.contractPeriod
  if (offerModal.form.probationPeriod) data.probationPeriod = offerModal.form.probationPeriod
  if (offerModal.form.workLocation) data.workLocation = offerModal.form.workLocation
  if (offerModal.form.status) data.status = offerModal.form.status
  offerUpdate({ body: data })
    .then(() => {
      message.success('Offer 更新成功')
      offerModal.visible = false
    })
    .catch((err: unknown) => message.warn(errorMessage(err, '更新失败')))
    .finally(() => { offerModal.submitting = false })
}

// ── 候选人详情弹窗 ──
const snapshotDetail = reactive<{ visible: boolean; data: ResumeSnapshotInfo | null }>({ visible: false, data: null })

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

function parseSkills(str: unknown): string[] {
  if (!str) return []
  try {
    const arr: unknown = JSON.parse(String(str))
    return Array.isArray(arr) ? arr.filter((item): item is string => typeof item === 'string') : []
  } catch { return [] }
}

function parseWorkExperience(str: unknown) {
  return parseJSON<WorkExperienceItem>(str)
}

function parseProjects(str: unknown) {
  return parseJSON<ProjectItem>(str)
}

function getEduItems(item: Pick<ResumeSnapshotInfo, 'eduDetail' | 'school' | 'education'>) {
  const items = parseJSON<EduDetailItem>(item.eduDetail)
  if (items.length) return items
  if (item.school || item.education) return [{ school: item.school || '', degree: item.education || '', major: '', duration: '' }]
  return []
}

async function openSnapshotDetail(snapshotId: string) {
  if (!snapshotId) { message.warn('暂无简历快照'); return }
  try {
    const res = await resumeSnapshotDetail({ query: { id: snapshotId } })
    snapshotDetail.data = res.data?.data ?? null
    snapshotDetail.visible = true
  } catch { message.warn('获取简历快照失败') }
}

// ── 简历预览 Drawer ──
const resumeDrawer = reactive({ visible: false, url: '' })

function openResumePreview(raw: string) {
  if (!raw) { message.warn('暂无简历附件'); return }
  resumeDrawer.url = `/api/staticfiles/resume/${raw}`
  resumeDrawer.visible = true
}

// ── 状态流转记录 ──
const statusLogsMap = ref<Record<string, StatusLogInfo[]>>({})

async function loadStatusLogs(items: PostInfo[]) {
  const map: Record<string, StatusLogInfo[]> = {}
  await Promise.all(
    items.map(async (item) => {
      try {
        const res = await postStatusLogList({ query: { targetType: 'post', targetId: item.id! } })
        const resp = res.data
        map[item.id!] = resp?.data?.list ?? []
      } catch { map[item.id!] = [] }
    }),
  )
  statusLogsMap.value = map
}

function getStatusLogs(id: string) { return statusLogsMap.value[id] || [] }

watch(list, (val) => { if (val?.length) loadStatusLogs(val) }, { immediate: true })

// ── 状态日志展开行 ──
const expandedRowKeys = ref<string[]>([])

function onExpand(expanded: boolean, record: PostInfo) {
  if (expanded) {
    expandedRowKeys.value = [...expandedRowKeys.value, record.id!]
  } else {
    expandedRowKeys.value = expandedRowKeys.value.filter(k => k !== record.id)
  }
}

function formatDate(value: DatePickerValue, format: string) {
  if (!value) return undefined
  return typeof value === 'string' ? value : value.format(format)
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback
}

// 表格列定义
const columns = [
  { title: '求职者', dataIndex: 'name', key: 'name' },
  { title: '职位', dataIndex: 'title', key: 'title' },
  { title: '公司', dataIndex: 'companyTitle', key: 'companyTitle' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '反馈', dataIndex: 'feedback', key: 'feedback', ellipsis: true },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 320, fixed: 'right' as const },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索投递记录" class="w-60" allow-clear />
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的投递记录？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.POST_DELETE" danger>
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
      :expanded-row-keys="expandedRowKeys"
      @expand="onExpand"
    >
      <!-- 展开行：Pipeline + 状态流转 -->
      <template #expandedRowRender="{ record }">
        <div class="py-2">
          <RecruitmentPipeline :status="record.status" />
          <div v-if="getStatusLogs(record.id).length > 0" class="mt-2 text-xs text-gray-500">
            <span class="font-medium">流转记录：</span>
            <span v-for="(log, idx) in getStatusLogs(record.id)" :key="idx" class="mr-3">
              {{ log.createTime }} {{ log.operatorName || '系统' }} {{ STATUS_LABEL[log.fromStatus as RecruitmentStatus] ?? log.fromStatus }} → {{ STATUS_LABEL[log.toStatus as RecruitmentStatus] ?? log.toStatus }}
              <span v-if="log.remark" class="text-gray-400">({{ log.remark }})</span>
            </span>
          </div>
        </div>
      </template>

      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="STATUS_COLOR[record.status as RecruitmentStatus] ?? 'default'">
            {{ STATUS_LABEL[record.status as RecruitmentStatus] ?? record.status }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button v-permission="PermissionCode.POST_UPDATE" type="link" size="small" @click="openSnapshotDetail(record.resumeSnapshotId)">
            详情
          </a-button>
          <a-button v-if="record.raw" type="link" size="small" @click="openResumePreview(record.raw)">
            简历
          </a-button>
          <a-button v-if="isOfferVisible(record.status)" type="link" size="small" @click="openOfferModal(record as PostInfo)">
            Offer
          </a-button>
          <a-button v-permission="PermissionCode.POST_UPDATE" type="link" size="small" @click="openProcessModal(record as PostInfo)">
            处理
          </a-button>
          <a-popconfirm title="确认删除该投递记录？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.POST_DELETE" type="link" size="small" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 处理投递弹窗 -->
    <a-modal
      v-model:open="processModal.visible"
      title="处理投递"
      :confirm-loading="processModal.submitting"
      @ok="submitProcess"
      width="560px"
    >
      <div class="mb-3">
        <div class="text-sm font-semibold mb-2">状态</div>
        <a-select v-model:value="processModal.form.status" class="w-full">
          <a-select-option v-for="item in statusOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-select-option>
        </a-select>
      </div>
      <div class="mt-4">
        <div class="text-sm font-semibold mb-2">
          给候选人的消息 <span class="font-normal text-gray-400">（可选）</span>
        </div>
        <a-textarea v-model:value="processModal.form.feedback" :rows="3" placeholder="可选填写给候选人的通知消息" />
      </div>
      <div class="mt-4">
        <div class="text-sm font-semibold mb-2">
          内部流转备注 <span class="text-red-500">*</span>
        </div>
        <a-textarea v-model:value="processModal.form.remark" :rows="3" :placeholder="getRemarkPlaceholder(processModal.form.status)" />
      </div>

      <!-- 历史面试记录 -->
      <template v-if="interviewList.length > 0">
        <a-divider>历史面试记录</a-divider>
        <div v-for="(iv, idx) in interviewList" :key="idx" class="p-2.5 bg-gray-50 rounded mb-2">
          <div class="text-sm font-semibold mb-1">{{ STATUS_LABEL[iv.round as RecruitmentStatus] ?? iv.round }}</div>
          <div v-if="iv.interviewerName" class="text-xs text-gray-600">面试官：{{ iv.interviewerName }}</div>
          <div v-if="iv.scheduledAt" class="text-xs text-gray-600">时间：{{ iv.scheduledAt }}</div>
          <div v-if="iv.location" class="text-xs text-gray-600">{{ iv.type === 'video' ? '会议链接' : '地点' }}：{{ iv.location }}</div>
          <div v-if="iv.type" class="text-xs text-gray-600">方式：{{ iv.type === 'onsite' ? '现场' : iv.type === 'video' ? '视频' : '电话' }}</div>
        </div>
      </template>

      <!-- 已有 Offer -->
      <template v-if="offerData">
        <a-divider>Offer 详情</a-divider>
        <div class="p-3 bg-blue-50 rounded border border-blue-200">
          <div v-if="offerData.salary" class="text-sm">薪资：{{ offerData.salary }}</div>
          <div v-if="offerData.level" class="text-sm">职级：{{ offerData.level }}</div>
          <div v-if="offerData.joinDate" class="text-sm">入职日期：{{ offerData.joinDate }}</div>
          <div v-if="offerData.contractPeriod" class="text-sm">合同期限：{{ offerData.contractPeriod }}</div>
          <div v-if="offerData.probationPeriod" class="text-sm">试用期：{{ offerData.probationPeriod }}</div>
          <div v-if="offerData.workLocation" class="text-sm">工作地点：{{ offerData.workLocation }}</div>
        </div>
      </template>

      <!-- 面试安排 -->
      <template v-if="isInterviewStatus(processModal.form.status)">
        <a-divider>面试安排</a-divider>
        <a-form :label-col="{ span: 5 }">
          <a-form-item label="面试官">
            <a-input v-model:value="interviewForm.interviewerName" placeholder="面试官姓名" />
          </a-form-item>
          <a-form-item label="面试时间">
            <a-date-picker
              v-model:value="interviewForm.scheduledAt"
              show-time
              format="YYYY-MM-DD HH:mm"
              placeholder="选择时间"
              class="w-full"
            />
          </a-form-item>
          <a-form-item :label="interviewForm.type === 'video' ? '会议链接' : '面试地点'">
            <a-input v-model:value="interviewForm.location" :placeholder="interviewForm.type === 'video' ? '输入视频会议链接' : '输入面试地点'" />
          </a-form-item>
          <a-form-item label="面试方式">
            <a-select v-model:value="interviewForm.type">
              <a-select-option value="onsite">现场</a-select-option>
              <a-select-option value="video">视频</a-select-option>
              <a-select-option value="phone">电话</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </template>

      <!-- Offer 安排 -->
      <template v-if="isOfferStatus(processModal.form.status)">
        <a-divider>Offer 详情</a-divider>
        <a-form :label-col="{ span: 5 }">
          <a-form-item label="薪资">
            <a-input v-model:value="offerForm.salary" placeholder="如 30K-50K" />
          </a-form-item>
          <a-form-item label="职级">
            <a-input v-model:value="offerForm.level" placeholder="如 P6" />
          </a-form-item>
          <a-form-item label="入职日期">
            <a-date-picker v-model:value="offerForm.joinDate" placeholder="选择日期" class="w-full" />
          </a-form-item>
          <a-form-item label="合同期限">
            <a-input v-model:value="offerForm.contractPeriod" placeholder="如 3年" />
          </a-form-item>
          <a-form-item label="试用期">
            <a-input v-model:value="offerForm.probationPeriod" placeholder="如 6个月" />
          </a-form-item>
          <a-form-item label="工作地点">
            <a-input v-model:value="offerForm.workLocation" placeholder="如 北京" />
          </a-form-item>
        </a-form>
      </template>
    </a-modal>

    <!-- Offer 详情弹窗 -->
    <a-modal
      v-model:open="offerModal.visible"
      title="Offer 详情"
      :confirm-loading="offerModal.submitting"
      @ok="submitOffer"
      width="520px"
    >
      <div v-if="offerModal.noData" class="text-center py-6 text-gray-400">暂无 Offer 记录</div>
      <div v-else>
        <div class="flex gap-3 text-sm mb-3">
          <span class="text-gray-400">候选人：</span><span>{{ offerModal.name }}</span>
          <span class="text-gray-400">投递ID：</span><span>{{ offerModal.postId }}</span>
        </div>
        <a-form :label-col="{ span: 5 }">
          <a-form-item label="薪资">
            <a-input v-model:value="offerModal.form.salary" placeholder="如 30K-50K" />
          </a-form-item>
          <a-form-item label="职级">
            <a-input v-model:value="offerModal.form.level" placeholder="如 P6" />
          </a-form-item>
          <a-form-item label="入职日期">
            <a-date-picker v-model:value="offerModal.form.joinDate" placeholder="选择日期" class="w-full" />
          </a-form-item>
          <a-form-item label="合同期限">
            <a-input v-model:value="offerModal.form.contractPeriod" placeholder="如 3年" />
          </a-form-item>
          <a-form-item label="试用期">
            <a-input v-model:value="offerModal.form.probationPeriod" placeholder="如 6个月" />
          </a-form-item>
          <a-form-item label="工作地点">
            <a-input v-model:value="offerModal.form.workLocation" placeholder="如 北京" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="offerModal.form.status">
              <a-select-option value="pending">待处理</a-select-option>
              <a-select-option value="accepted">已接受</a-select-option>
              <a-select-option value="rejected">已拒绝</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 候选人详情弹窗 -->
    <a-modal
      v-model:open="snapshotDetail.visible"
      title="候选人详情"
      :footer="null"
      width="640px"
    >
      <div v-if="snapshotDetail.data">
        <div class="mb-4">
          <h4 class="text-sm font-semibold border-b pb-1.5 mb-2 m-0">基本信息</h4>
          <p class="text-sm m-1"><b>姓名：</b>{{ snapshotDetail.data.name || '-' }}</p>
          <p v-if="snapshotDetail.data.sex" class="text-sm m-1"><b>性别：</b>{{ snapshotDetail.data.sex }}</p>
          <p class="text-sm m-1"><b>手机：</b>{{ snapshotDetail.data.mobile || '-' }}</p>
          <p class="text-sm m-1"><b>邮箱：</b>{{ snapshotDetail.data.email || '-' }}</p>
          <p v-if="snapshotDetail.data.expectedSalary" class="text-sm m-1"><b>期望薪资：</b>{{ snapshotDetail.data.expectedSalary }}</p>
          <p v-if="snapshotDetail.data.jobIntention" class="text-sm m-1"><b>求职意向：</b>{{ snapshotDetail.data.jobIntention }}</p>
          <p v-if="snapshotDetail.data.source" class="text-sm m-1"><b>来源：</b>{{ snapshotDetail.data.source }}</p>
          <p v-if="snapshotDetail.data.summary" class="text-sm m-1"><b>个人总结：</b>{{ snapshotDetail.data.summary }}</p>
        </div>
        <div v-if="getEduItems(snapshotDetail.data).length" class="mb-4">
          <h4 class="text-sm font-semibold border-b pb-1.5 mb-2 m-0">教育经历</h4>
          <div v-for="(e, i) in getEduItems(snapshotDetail.data)" :key="`edu-${i}`" class="text-sm mb-1">
            <span class="font-semibold">{{ e.school || '-' }}</span>
            <span v-if="e.degree" class="text-blue-500 ml-2 text-xs">{{ e.degree }}</span>
            <span class="text-gray-500 ml-2">{{ e.major || '-' }}</span>
            <span class="text-gray-400 ml-2">{{ e.duration || '-' }}</span>
          </div>
        </div>
        <div v-if="parseSkills(snapshotDetail.data.skills).length" class="mb-4">
          <h4 class="text-sm font-semibold border-b pb-1.5 mb-2 m-0">技能</h4>
          <div>
            <a-tag v-for="s in parseSkills(snapshotDetail.data.skills)" :key="s" color="blue" class="m-0.5">{{ s }}</a-tag>
          </div>
        </div>
        <div v-if="parseWorkExperience(snapshotDetail.data.experience).length" class="mb-4">
          <h4 class="text-sm font-semibold border-b pb-1.5 mb-2 m-0">工作经历</h4>
          <div v-for="(e, i) in parseWorkExperience(snapshotDetail.data.experience)" :key="i" class="text-sm mb-1">
            <span class="font-semibold">{{ e.company }}</span>
            <span class="text-gray-500 ml-2">{{ e.position }}</span>
            <span class="text-gray-400 ml-2">{{ e.duration }}</span>
          </div>
        </div>
        <div v-if="parseProjects(snapshotDetail.data.projects).length" class="mb-4">
          <h4 class="text-sm font-semibold border-b pb-1.5 mb-2 m-0">项目经历</h4>
          <div v-for="(p, i) in parseProjects(snapshotDetail.data.projects)" :key="i" class="mb-2">
            <span class="font-semibold text-sm">{{ p.name }}</span>
            <span class="text-gray-500 ml-2 text-sm">{{ p.role }}</span>
            <p v-if="p.description" class="text-sm text-gray-600 m-0.5 leading-relaxed">{{ p.description }}</p>
          </div>
        </div>
        <div v-if="snapshotDetail.data.remark" class="mb-4">
          <h4 class="text-sm font-semibold border-b pb-1.5 mb-2 m-0">备注</h4>
          <p class="text-sm text-gray-600">{{ snapshotDetail.data.remark }}</p>
        </div>
      </div>
    </a-modal>

    <!-- 简历预览 Drawer -->
    <a-drawer v-model:open="resumeDrawer.visible" title="简历预览" width="700px">
      <iframe v-if="resumeDrawer.url" :src="resumeDrawer.url" class="w-full h-[80vh] border-none" />
    </a-drawer>
  </div>
</template>
