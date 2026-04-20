<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { message } from 'ant-design-vue'
import {
  postPostCompanyList, postPostUpdate, postPostStatusLogList,
  companyCompanyList,
  interviewInterviewList, interviewInterviewCreate,
  offerOfferDetail, offerOfferCreate, offerOfferUpdate,
  resumesnapshotResumeSnapshotDetail,
  talentpoolTalentPoolAdd,
} from '@/client'
import { normalizePaginated } from '@/infrastructure/api/normalize'
import { STATUS_LABEL, STATUS_COLOR, ALL_STATUSES, type RecruitmentStatus } from '@/shared/types'
import RecruitmentPipeline from '../components/RecruitmentPipeline.vue'

const queryClient = useQueryClient()
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const activeTimeRange = ref('all')

// ── Pipeline filter state ──
const activeStatus = ref('all')
const activeJob = ref('')

// ── Color helpers ──
const colorMap: Record<string, string> = {
  default: '#8c8c8c', processing: '#1890ff', cyan: '#13c2c2', gold: '#faad14',
  orange: '#fa8c16', blue: '#1890ff', green: '#52c41a', success: '#52c41a',
  geekblue: '#2f54eb', error: '#ff4d4f', warning: '#faad14',
}

interface PostItem {
  id: string; jobId: string; title: string; companyTitle: string
  name: string; status: string; feedback: string; remark: string; source: string
  userId: string; createTime: string; resumeSnapshotId: string; raw: string
}

// ── 先查公司列表获取 companyId ──
const companyQuery = useQuery({
  queryKey: ['companyForPost'],
  queryFn: async () => {
    const result = await companyCompanyList({ query: { page: 1, pageSize: 1 } })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询公司失败')
    }
    const list = (resp.data as { list?: Array<{ id: string }> } | undefined)?.list
    return list?.[0]?.id ?? ''
  },
})

const listQuery = useQuery({
  queryKey: ['companyPosts', { page, pageSize, companyId: companyQuery.data }],
  queryFn: async () => {
    const companyId = companyQuery.data?.value
    if (!companyId) return { list: [] as PostItem[], total: 0 }
    const result = await postPostCompanyList({
      query: { companyId, page: page.value, pageSize: pageSize.value },
    })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return normalizePaginated<PostItem>(resp.data)
  },
  enabled: !!companyQuery.data?.value,
})

const allData = computed(() => listQuery.data?.value?.list ?? [])
const total = computed(() => listQuery.data?.value?.total ?? 0)
const loading = computed(() => listQuery.isLoading.value || companyQuery.isLoading.value)

// ── Unique jobs for filter ──
const uniqueJobs = computed(() => {
  const jobs = new Set(allData.value.map((p: PostItem) => p.title).filter(Boolean))
  return [...jobs]
})

// ── Pipeline stage counts ──
const statusCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const item of allData.value) {
    const s = item.status ?? 'unknown'
    counts[s] = (counts[s] || 0) + 1
  }
  return counts
})

// ── Pipeline stages ──
const pipelineStages = ALL_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABEL[s],
  color: colorMap[STATUS_COLOR[s]] ?? '#8c8c8c',
}))

// ── Display data with filters ──
const displayData = computed(() => {
  let list = [...allData.value]
  if (activeStatus.value && activeStatus.value !== 'all') {
    list = list.filter((p: PostItem) => p.status === activeStatus.value)
  }
  if (activeJob.value) {
    list = list.filter((p: PostItem) => p.title === activeJob.value)
  }
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter((p: PostItem) =>
      (p.name ?? '').toLowerCase().includes(kw) ||
      (p.title ?? '').toLowerCase().includes(kw),
    )
  }
  if (activeTimeRange.value && activeTimeRange.value !== 'all') {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const threshold = activeTimeRange.value === 'week' ? now - 7 * dayMs : now - 30 * dayMs
    list = list.filter((p: PostItem) => Number(p.createTime) >= threshold)
  }
  return list
})

function statusLabel(s: string) { return STATUS_LABEL[s as RecruitmentStatus] ?? s }
function statusColor(s: string) { return colorMap[STATUS_COLOR[s as RecruitmentStatus] ?? ''] ?? '#8c8c8c' }
function statusBg(s: string) { return statusColor(s) + '14' }

// ── Status log loading ──
const statusLogsMap = ref<Record<string, any[]>>({})

async function loadStatusLogs(items: PostItem[]) {
  const map: Record<string, any[]> = {}
  await Promise.all(
    items.map(async (item) => {
      try {
        const res = await postPostStatusLogList({ query: { targetType: 'post', targetId: item.id } })
        const resp = res.data
        map[item.id] = (resp?.data as any[]) ?? []
      } catch {
        map[item.id] = []
      }
    }),
  )
  statusLogsMap.value = map
}

function getStatusLogs(id: string) { return statusLogsMap.value[id] || [] }

// Load status logs when data changes
import { watch } from 'vue'
watch(allData, (val) => { if (val.length > 0) loadStatusLogs(val) }, { immediate: true })

// ── Status change modal (处理投递) ──
const processModal = reactive({
  visible: false,
  submitting: false,
  form: { id: '', status: 'applied', feedback: '', remark: '' },
})

const statusOptions = ALL_STATUSES.map((s) => ({ label: STATUS_LABEL[s], value: s }))

const interviewForm = reactive({
  interviewerName: '',
  scheduledAt: null as any,
  location: '',
  type: 'onsite',
})

const offerForm = reactive({
  salary: '',
  level: '',
  joinDate: null as any,
  contractPeriod: '',
  probationPeriod: '',
  workLocation: '',
})

const interviewList = ref<any[]>([])
const offerData = ref<any>(null)

const isInterviewStatus = (status: string) => ['interview_1', 'interview_2', 'interview_3', 'interview_final'].includes(status)
const isOfferStatus = (status: string) => status === 'offer_sent'

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

function openProcessModal(item: PostItem) {
  processModal.visible = true
  processModal.submitting = false
  processModal.form = {
    id: item.id,
    status: item.status || 'applied',
    feedback: item.feedback || '',
    remark: item.remark || '',
  }
  interviewForm.interviewerName = ''
  interviewForm.scheduledAt = null
  interviewForm.location = ''
  interviewForm.type = 'onsite'
  offerForm.salary = ''
  offerForm.level = ''
  offerForm.joinDate = null
  offerForm.contractPeriod = ''
  offerForm.probationPeriod = ''
  offerForm.workLocation = ''
  loadInterviewAndOffer(item.id)
}

async function loadInterviewAndOffer(postId: string) {
  try {
    const iRes = await interviewInterviewList({ query: { postId } })
    const resp = iRes.data
    interviewList.value = (resp?.data as any)?.list ?? (resp?.data as any[]) ?? []
  } catch { interviewList.value = [] }
  try {
    const oRes = await offerOfferDetail({ query: { postId } })
    offerData.value = oRes.data?.data ?? null
  } catch { offerData.value = null }
}

const updateMutation = useMutation({
  mutationFn: (body: Record<string, unknown>) => postPostUpdate({ body: body as Parameters<typeof postPostUpdate>[0]['body'] }),
  onSuccess: () => {
    message.success('处理成功')
    queryClient.invalidateQueries({ queryKey: ['companyPosts'] })
    processModal.visible = false
  },
  onError: (err: Error) => message.error(err.message || '更新失败'),
})

async function submitProcess() {
  const { id, status, feedback, remark } = processModal.form
  if (!remark && (status === 'rejected' || status === 'on_hold')) {
    message.warn('请填写内部流转备注')
    return
  }

  processModal.submitting = true
  try {
    await new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { id, status, feedback, remark },
        {
          onSuccess: () => resolve(),
          onError: (err: Error) => reject(err),
        },
      )
    })

    // Create interview if status is interview stage
    if (isInterviewStatus(status)) {
      const data: Record<string, unknown> = { postId: id, round: status }
      if (interviewForm.interviewerName) data.interviewerName = interviewForm.interviewerName
      if (interviewForm.scheduledAt) data.scheduledAt = interviewForm.scheduledAt?.format?.('YYYY-MM-DD HH:mm:ss') ?? interviewForm.scheduledAt
      if (interviewForm.location) data.location = interviewForm.location
      if (interviewForm.type) data.type = interviewForm.type
      await interviewInterviewCreate({ body: data as any }).catch(() => {})
    }

    // Create offer if status is offer_sent
    if (isOfferStatus(status)) {
      const data: Record<string, unknown> = { postId: id }
      if (offerForm.salary) data.salary = offerForm.salary
      if (offerForm.level) data.level = offerForm.level
      if (offerForm.joinDate) data.joinDate = offerForm.joinDate?.format?.('YYYY-MM-DD') ?? offerForm.joinDate
      if (offerForm.contractPeriod) data.contractPeriod = offerForm.contractPeriod
      if (offerForm.probationPeriod) data.probationPeriod = offerForm.probationPeriod
      if (offerForm.workLocation) data.workLocation = offerForm.workLocation
      await offerOfferCreate({ body: data as any }).catch(() => {})
    }
  } finally {
    processModal.submitting = false
  }
}

// ── Offer 独立弹窗 ──
const offerVisibleStatuses = ['offer_sent', 'salary_negotiation', 'offer_accepted', 'hired']
const isOfferVisible = (status: string) => offerVisibleStatuses.includes(status)

const offerModal = reactive({
  visible: false,
  submitting: false,
  noData: false,
  id: '',
  postId: '',
  name: '',
  form: { salary: '', level: '', joinDate: null as any, contractPeriod: '', probationPeriod: '', workLocation: '', status: 'pending' },
})

async function openOfferModal(item: PostItem) {
  offerModal.visible = true
  offerModal.noData = false
  offerModal.submitting = false
  offerModal.id = ''
  offerModal.postId = item.id
  offerModal.name = item.name || '未知候选人'
  offerModal.form = { salary: '', level: '', joinDate: null, contractPeriod: '', probationPeriod: '', workLocation: '', status: 'pending' }
  try {
    const res = await offerOfferDetail({ query: { postId: item.id } })
    const offer = (res.data?.data as any)
    if (offer?.id) {
      offerModal.id = offer.id
      offerModal.form.salary = offer.salary || ''
      offerModal.form.level = offer.level || ''
      offerModal.form.joinDate = offer.joinDate || null
      offerModal.form.contractPeriod = offer.contractPeriod || ''
      offerModal.form.probationPeriod = offer.probationPeriod || ''
      offerModal.form.workLocation = offer.workLocation || ''
      offerModal.form.status = offer.status || 'pending'
    } else {
      offerModal.noData = true
    }
  } catch {
    offerModal.noData = true
  }
}

function submitOffer() {
  if (!offerModal.id) {
    message.warn('暂无 Offer 记录，请先在处理投递中发送 Offer')
    return
  }
  offerModal.submitting = true
  const data: Record<string, unknown> = { id: offerModal.id }
  if (offerModal.form.salary) data.salary = offerModal.form.salary
  if (offerModal.form.level) data.level = offerModal.form.level
  if (offerModal.form.joinDate) data.joinDate = offerModal.form.joinDate?.format?.('YYYY-MM-DD') ?? offerModal.form.joinDate
  if (offerModal.form.contractPeriod) data.contractPeriod = offerModal.form.contractPeriod
  if (offerModal.form.probationPeriod) data.probationPeriod = offerModal.form.probationPeriod
  if (offerModal.form.workLocation) data.workLocation = offerModal.form.workLocation
  if (offerModal.form.status) data.status = offerModal.form.status
  offerOfferUpdate({ body: data as any })
    .then(() => {
      message.success('Offer 更新成功')
      offerModal.visible = false
      queryClient.invalidateQueries({ queryKey: ['companyPosts'] })
    })
    .catch((err: any) => message.warn(err?.message || '更新失败'))
    .finally(() => { offerModal.submitting = false })
}

// ── 快照详情 Modal ──
const snapshotDetail = reactive({ visible: false, data: null as any })

function parseJSON(str: any) {
  if (!str) return []
  try { const arr = JSON.parse(str); return Array.isArray(arr) ? arr : [] }
  catch { return [] }
}

function getEduItems(item: any) {
  const items = parseJSON(item.eduDetail)
  if (items.length) return items
  if (item.school || item.education) return [{ school: item.school || '', degree: item.education || '', major: '', duration: '' }]
  return []
}

async function openSnapshotDetail(snapshotId: string) {
  if (!snapshotId) { message.warn('暂无简历快照'); return }
  try {
    const res = await resumesnapshotResumeSnapshotDetail({ query: { id: snapshotId } })
    snapshotDetail.data = res.data?.data ?? null
    snapshotDetail.visible = true
  } catch { message.warn('获取简历快照失败') }
}

// ── 加入人才库 ──
async function handleAddToPool(item: PostItem) {
  if (!item.resumeSnapshotId) { message.warn('该投递暂无简历快照'); return }
  try {
    await talentpoolTalentPoolAdd({ body: { resumeSnapshotId: item.resumeSnapshotId } as any })
    message.success('已加入人才库')
  } catch (err: any) { message.warn(err?.message || '加入人才库失败') }
}

// ── 简历预览 Drawer ──
const resumeDrawer = reactive({ visible: false, url: '' })
</script>

<template>
  <div class="max-w-[1100px] mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-[22px] font-semibold text-text-primary m-0 mb-1">投递管理</h2>
        <p class="text-[13px] text-text-muted m-0">共 {{ total }} 条投递记录</p>
      </div>
    </div>

    <!-- Pipeline 导航栏 -->
    <div class="flex items-center gap-4 bg-white border border-border-light rounded-lg px-4 py-3 mb-3 flex-wrap">
      <div class="flex flex-col items-center pr-4 border-r border-border-light min-w-[60px]">
        <span class="text-2xl font-bold text-text-primary leading-none">{{ total }}</span>
        <span class="text-xs text-text-muted mt-1">投递总量</span>
      </div>
      <div class="flex gap-1 flex-1 min-w-0 overflow-x-auto pb-1">
        <div
          v-for="stage in pipelineStages"
          :key="stage.value"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer whitespace-nowrap border border-transparent transition-all"
          :class="{ 'bg-[#f0f5ff] !border-primary': activeStatus === stage.value }"
          @click="activeStatus = activeStatus === stage.value ? 'all' : stage.value"
        >
          <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: stage.color }" />
          <span class="text-[13px] text-text-secondary">{{ stage.label }}</span>
          <span class="text-xs font-semibold text-text-primary bg-black/5 px-1.5 py-0.5 rounded-full">
            {{ statusCounts[stage.value] ?? 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="flex items-center gap-2 mb-4 flex-wrap">
      <a-select
        v-model:value="activeJob"
        placeholder="应聘岗位"
        allow-clear
        class="w-40"
      >
        <a-select-option v-for="j in uniqueJobs" :key="j" :value="j">{{ j }}</a-select-option>
      </a-select>
      <a-select v-model:value="activeTimeRange" class="w-28">
        <a-select-option value="all">全部时间</a-select-option>
        <a-select-option value="week">本周</a-select-option>
        <a-select-option value="month">本月</a-select-option>
      </a-select>
      <a-input
        v-model:value="keyword"
        placeholder="搜索姓名、岗位关键词"
        class="w-56"
        allow-clear
      />
    </div>

    <!-- Card List -->
    <a-spin :spinning="loading" style="min-height: 200px">
      <div class="flex flex-col gap-3">
        <div
          v-for="item in displayData" :key="item.id"
          class="bg-white rounded-xl p-5 border border-border-light transition-shadow hover:shadow-md"
        >
          <!-- Header: name + status -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-400 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {{ (item.name || '?')[0] }}
              </div>
              <span class="text-base font-semibold text-text-primary truncate">{{ item.name || '未知候选人' }}</span>
              <span class="text-xs text-text-muted shrink-0">#{{ item.id }}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span
                class="text-xs font-medium px-2.5 py-0.5 rounded-full"
                :style="{ background: statusBg(item.status), color: statusColor(item.status) }"
              >{{ statusLabel(item.status) }}</span>
            </div>
          </div>

          <!-- Body: position + meta -->
          <div class="ml-12">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-text-primary">{{ item.title || '未知岗位' }}</span>
              <span class="text-xs text-text-muted">{{ item.companyTitle }}</span>
            </div>
            <div class="text-xs text-text-muted mb-2">投递时间：{{ item.createTime }}</div>

            <!-- Feedback -->
            <div
              v-if="item.feedback && item.feedback.trim()"
              class="p-2 px-3 bg-bg-page rounded-md text-[13px] text-text-secondary leading-relaxed mb-2"
            >
              <span class="text-text-muted">候选人消息：</span>{{ item.feedback }}
            </div>

            <!-- Remark -->
            <div
              v-if="item.remark && item.remark.trim() && !(getStatusLogs(item.id).length > 0)"
              class="p-2 px-3 bg-bg-page rounded-md text-[13px] text-text-secondary leading-relaxed mb-2"
            >
              <span class="text-text-muted">内部备注：</span>{{ item.remark }}
            </div>

            <!-- Status timeline -->
            <div
              v-if="getStatusLogs(item.id).length > 0"
              class="p-2 px-3 bg-bg-page rounded-md mb-2"
            >
              <div class="text-xs text-text-muted mb-1">状态流转记录</div>
              <div
                v-for="log in getStatusLogs(item.id)" :key="log.id"
                class="text-xs text-text-secondary py-0.5 border-b border-border-light last:border-b-0"
              >
                <span class="text-text-muted mr-1">{{ log.createTime }}</span>
                <span class="text-primary font-medium mr-1">{{ log.operatorName || '系统' }}</span>
                <span class="mr-1">{{ statusLabel(log.fromStatus) }} → {{ statusLabel(log.toStatus) }}</span>
                <span v-if="log.remark" class="text-text-muted">{{ log.remark }}</span>
              </div>
            </div>

            <!-- Pipeline -->
            <RecruitmentPipeline :status="item.status" />
          </div>

          <!-- Footer: actions -->
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-border-light ml-12">
            <span class="text-xs text-text-muted">{{ statusLabel(item.status) }}</span>
            <div class="flex items-center gap-4">
              <span class="text-[13px] text-primary cursor-pointer hover:text-primary-hover" @click="openSnapshotDetail(item.resumeSnapshotId)">详情</span>
              <span class="text-[13px] text-primary cursor-pointer hover:text-primary-hover" @click="handleAddToPool(item)">加入人才库</span>
              <span v-if="item.raw" class="text-[13px] text-primary cursor-pointer hover:text-primary-hover" @click="resumeDrawer.url = `/api/staticfiles/resume/${item.raw}`; resumeDrawer.visible = true">查看简历</span>
              <span
                v-if="isOfferVisible(item.status)"
                class="text-[13px] text-primary cursor-pointer hover:text-primary-hover"
                @click="openOfferModal(item)"
              >Offer</span>
              <span
                class="text-[13px] text-white bg-primary px-3 py-1 rounded cursor-pointer hover:bg-primary-hover"
                @click="openProcessModal(item)"
              >处理投递</span>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div
          v-if="displayData.length === 0 && !loading"
          class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border-light"
        >
          <p class="text-sm text-text-muted m-0">暂无投递记录</p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="total > 0" class="flex justify-center mt-6">
        <a-pagination
          v-model:current="page"
          v-model:page-size="pageSize"
          :total="total"
          show-size-changer
          :show-total="(t: number) => `共 ${t} 条`"
        />
      </div>
    </a-spin>

    <!-- 处理投递 Modal -->
    <a-modal
      v-model:open="processModal.visible"
      title="处理投递"
      :confirm-loading="processModal.submitting"
      @ok="submitProcess"
      width="560px"
    >
      <div class="mb-3">
        <div class="text-sm font-semibold text-text-primary mb-2">状态</div>
        <a-select v-model:value="processModal.form.status" class="w-full">
          <a-select-option v-for="item in statusOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-select-option>
        </a-select>
      </div>

      <div class="mt-4">
        <div class="text-sm font-semibold text-text-primary mb-2">
          给候选人的消息 <span class="font-normal text-text-muted">（可选，候选人可见）</span>
        </div>
        <a-textarea
          v-model:value="processModal.form.feedback"
          :rows="3"
          placeholder="可选填写给候选人的通知消息"
        />
      </div>

      <div class="mt-4">
        <div class="text-sm font-semibold text-text-primary mb-2">
          内部流转备注 <span class="text-red-500">*</span>
        </div>
        <a-textarea
          v-model:value="processModal.form.remark"
          :rows="3"
          :placeholder="getRemarkPlaceholder(processModal.form.status)"
        />
      </div>

      <!-- 历史面试记录 -->
      <template v-if="interviewList.length > 0">
        <a-divider>历史面试记录</a-divider>
        <div v-for="(iv, idx) in interviewList" :key="idx" class="p-2.5 bg-bg-page rounded mb-2">
          <div class="text-sm font-semibold text-text-primary mb-1">{{ statusLabel(iv.round) }}</div>
          <div v-if="iv.interviewerName" class="text-xs text-text-secondary">面试官：{{ iv.interviewerName }}</div>
          <div v-if="iv.scheduledAt" class="text-xs text-text-secondary">时间：{{ iv.scheduledAt }}</div>
          <div v-if="iv.location" class="text-xs text-text-secondary">{{ iv.type === 'video' ? '会议链接' : '地点' }}：{{ iv.location }}</div>
          <div v-if="iv.type" class="text-xs text-text-secondary">方式：{{ iv.type === 'onsite' ? '现场' : iv.type === 'video' ? '视频' : '电话' }}</div>
        </div>
      </template>

      <!-- 已有 Offer -->
      <template v-if="offerData">
        <a-divider>Offer详情</a-divider>
        <div class="p-3 bg-[#f0f5ff] rounded border border-blue-200">
          <div v-if="offerData.salary" class="text-sm text-text-primary">薪资：{{ offerData.salary }}</div>
          <div v-if="offerData.level" class="text-sm text-text-primary">职级：{{ offerData.level }}</div>
          <div v-if="offerData.joinDate" class="text-sm text-text-primary">入职日期：{{ offerData.joinDate }}</div>
          <div v-if="offerData.contractPeriod" class="text-sm text-text-primary">合同期限：{{ offerData.contractPeriod }}</div>
          <div v-if="offerData.probationPeriod" class="text-sm text-text-primary">试用期：{{ offerData.probationPeriod }}</div>
          <div v-if="offerData.workLocation" class="text-sm text-text-primary">工作地点：{{ offerData.workLocation }}</div>
        </div>
      </template>

      <!-- 面试安排 -->
      <template v-if="isInterviewStatus(processModal.form.status)">
        <a-divider>面试安排</a-divider>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">面试官</div>
          <a-input v-model:value="interviewForm.interviewerName" placeholder="面试官姓名" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">面试时间</div>
          <a-date-picker
            v-model:value="interviewForm.scheduledAt"
            show-time
            format="YYYY-MM-DD HH:mm"
            placeholder="选择时间"
            class="w-full"
          />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">{{ interviewForm.type === 'video' ? '会议链接' : '面试地点' }}</div>
          <a-input v-model:value="interviewForm.location" :placeholder="interviewForm.type === 'video' ? '输入视频会议链接' : '输入面试地点'" />
        </div>
        <div>
          <div class="text-sm font-semibold text-text-primary mb-2">面试方式</div>
          <a-select v-model:value="interviewForm.type">
            <a-select-option value="onsite">现场</a-select-option>
            <a-select-option value="video">视频</a-select-option>
            <a-select-option value="phone">电话</a-select-option>
          </a-select>
        </div>
      </template>

      <!-- Offer 安排 -->
      <template v-if="isOfferStatus(processModal.form.status)">
        <a-divider>Offer详情</a-divider>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">薪资</div>
          <a-input v-model:value="offerForm.salary" placeholder="如 30K-50K" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">职级</div>
          <a-input v-model:value="offerForm.level" placeholder="如 P6" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">入职日期</div>
          <a-date-picker v-model:value="offerForm.joinDate" placeholder="选择日期" class="w-full" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">合同期限</div>
          <a-input v-model:value="offerForm.contractPeriod" placeholder="如 3年" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">试用期</div>
          <a-input v-model:value="offerForm.probationPeriod" placeholder="如 6个月" />
        </div>
        <div>
          <div class="text-sm font-semibold text-text-primary mb-2">工作地点</div>
          <a-input v-model:value="offerForm.workLocation" placeholder="如 北京" />
        </div>
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
      <div v-if="offerModal.noData" class="text-center py-6 text-text-muted">暂无 Offer 记录</div>
      <div v-else>
        <div class="flex gap-3 text-sm mb-3">
          <span class="text-text-muted">候选人：</span><span>{{ offerModal.name }}</span>
          <span class="text-text-muted">投递ID：</span><span>{{ offerModal.postId }}</span>
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">薪资</div>
          <a-input v-model:value="offerModal.form.salary" placeholder="如 30K-50K" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">职级</div>
          <a-input v-model:value="offerModal.form.level" placeholder="如 P6" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">入职日期</div>
          <a-date-picker v-model:value="offerModal.form.joinDate" placeholder="选择日期" class="w-full" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">合同期限</div>
          <a-input v-model:value="offerModal.form.contractPeriod" placeholder="如 3年" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">试用期</div>
          <a-input v-model:value="offerModal.form.probationPeriod" placeholder="如 6个月" />
        </div>
        <div class="mb-3">
          <div class="text-sm font-semibold text-text-primary mb-2">工作地点</div>
          <a-input v-model:value="offerModal.form.workLocation" placeholder="如 北京" />
        </div>
        <div>
          <div class="text-sm font-semibold text-text-primary mb-2">状态</div>
          <a-select v-model:value="offerModal.form.status">
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="accepted">已接受</a-select-option>
            <a-select-option value="rejected">已拒绝</a-select-option>
          </a-select>
        </div>
      </div>
    </a-modal>

    <!-- 候选人详情 Modal -->
    <a-modal
      v-model:open="snapshotDetail.visible"
      title="候选人详情"
      :footer="null"
      width="640px"
    >
      <div v-if="snapshotDetail.data">
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">基本信息</h4>
          <p class="text-sm text-text-secondary m-1"><b>姓名：</b>{{ snapshotDetail.data.name || '-' }}</p>
          <p v-if="snapshotDetail.data.sex" class="text-sm text-text-secondary m-1"><b>性别：</b>{{ snapshotDetail.data.sex }}</p>
          <p class="text-sm text-text-secondary m-1"><b>手机：</b>{{ snapshotDetail.data.mobile || '-' }}</p>
          <p class="text-sm text-text-secondary m-1"><b>邮箱：</b>{{ snapshotDetail.data.email || '-' }}</p>
          <p v-if="snapshotDetail.data.expectedSalary" class="text-sm text-text-secondary m-1"><b>期望薪资：</b>{{ snapshotDetail.data.expectedSalary }}</p>
          <p v-if="snapshotDetail.data.jobIntention" class="text-sm text-text-secondary m-1"><b>求职意向：</b>{{ snapshotDetail.data.jobIntention }}</p>
          <p v-if="snapshotDetail.data.source" class="text-sm text-text-secondary m-1"><b>来源：</b>{{ snapshotDetail.data.source }}</p>
          <p v-if="snapshotDetail.data.summary" class="text-sm text-text-secondary m-1"><b>个人总结：</b>{{ snapshotDetail.data.summary }}</p>
        </div>
        <div v-if="getEduItems(snapshotDetail.data).length" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">教育经历</h4>
          <div v-for="(e, i) in getEduItems(snapshotDetail.data)" :key="`edu-${i}`" class="text-sm mb-1">
            <span class="font-semibold text-text-primary">{{ e.school || '-' }}</span>
            <span v-if="e.degree" class="text-primary ml-2 text-xs">{{ e.degree }}</span>
            <span class="text-text-secondary ml-2">{{ e.major || '-' }}</span>
            <span class="text-text-muted ml-2">{{ e.duration || '-' }}</span>
          </div>
        </div>
        <div v-if="parseJSON(snapshotDetail.data.skills).length" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">技能</h4>
          <div>
            <a-tag v-for="s in parseJSON(snapshotDetail.data.skills)" :key="s" color="blue" class="m-0.5">{{ s }}</a-tag>
          </div>
        </div>
        <div v-if="parseJSON(snapshotDetail.data.experience).length" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">工作经历</h4>
          <div v-for="(e, i) in parseJSON(snapshotDetail.data.experience)" :key="i" class="text-sm mb-1">
            <span class="font-semibold text-text-primary">{{ e.company }}</span>
            <span class="text-text-secondary ml-2">{{ e.position }}</span>
            <span class="text-text-muted ml-2">{{ e.duration }}</span>
          </div>
        </div>
        <div v-if="parseJSON(snapshotDetail.data.projects).length" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">项目经历</h4>
          <div v-for="(p, i) in parseJSON(snapshotDetail.data.projects)" :key="i" class="mb-2">
            <span class="font-semibold text-text-primary text-sm">{{ p.name }}</span>
            <span class="text-text-secondary ml-2 text-sm">{{ p.role }}</span>
            <p v-if="p.description" class="text-sm text-text-secondary m-0.5 leading-relaxed">{{ p.description }}</p>
          </div>
        </div>
        <div v-if="snapshotDetail.data.remark" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">备注</h4>
          <p class="text-sm text-text-secondary">{{ snapshotDetail.data.remark }}</p>
        </div>
      </div>
    </a-modal>

    <!-- 简历预览 Drawer -->
    <a-drawer v-model:open="resumeDrawer.visible" title="简历预览" width="700px">
      <iframe v-if="resumeDrawer.url" :src="resumeDrawer.url" class="w-full h-[80vh] border-none" />
    </a-drawer>
  </div>
</template>
