<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { message } from 'ant-design-vue'
import {
  talentpoolTalentPoolList, talentpoolTalentPoolAdd,
  talentpoolTalentPoolUpdate, talentpoolTalentPoolRemove,
  jobJobUserList,
  resumesnapshotResumeSnapshotDetail,
} from '@/client'
import { normalizePaginated } from '@/infrastructure/api/normalize'

const queryClient = useQueryClient()
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')

interface TalentItem {
  id?: string
  name?: string
  education?: string
  email?: string
  mobile?: string
  rating?: number
  remark?: string
  resumeSnapshotId: string
  tags?: string
  createTime?: string
  // 额外字段（后端可能返回）
  sex?: string
  school?: string
  skills?: string
  experience?: string
  projects?: string
  eduDetail?: string
  expectedSalary?: string
  jobIntention?: string
  source?: string
  summary?: string
  raw?: string
}

const listQuery = useQuery({
  queryKey: ['talentPool', { page, pageSize }],
  queryFn: async () => {
    const result = await talentpoolTalentPoolList({
      query: { page: page.value, pageSize: pageSize.value },
    })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return normalizePaginated<TalentItem>(resp.data)
  },
})

const list = computed(() => {
  const all = listQuery.data?.value?.list ?? []
  if (!keyword.value) return all
  const kw = keyword.value.toLowerCase()
  return all.filter((i: TalentItem) =>
    (i.name ?? '').toLowerCase().includes(kw) ||
    (i.email ?? '').toLowerCase().includes(kw) ||
    (i.jobIntention ?? '').toLowerCase().includes(kw),
  )
})
const total = computed(() => listQuery.data?.value?.total ?? 0)
const loading = computed(() => listQuery.isLoading.value)

// ── Utils ──
function parseSkills(skills: unknown): string[] {
  if (!skills) return []
  try { const arr = JSON.parse(String(skills)); return Array.isArray(arr) ? arr : [] }
  catch { return [] }
}

function parseJSON(str: unknown): any[] {
  if (!str) return []
  try { const arr = JSON.parse(String(str)); return Array.isArray(arr) ? arr : [] }
  catch { return [] }
}

function getEduItems(item: TalentItem) {
  const items = parseJSON(item.eduDetail)
  if (items.length) return items
  if (item.school || item.education) return [{ school: item.school || '', degree: item.education || '', major: '', duration: '' }]
  return []
}

function formatEduSummary(item: TalentItem) {
  const items = getEduItems(item)
  if (!items.length) return item.education || ''
  const first = [items[0].school, items[0].degree, items[0].major].filter(Boolean).join(' / ')
  return items.length === 1 ? (first || '1段教育经历') : `${first || '教育经历'} 等${items.length}段`
}

// ── Remove ──
const removeMutation = useMutation({
  mutationFn: (resumeSnapshotId: string) => talentpoolTalentPoolRemove({ body: { resumeSnapshotId } }),
  onSuccess: () => {
    message.success('已移出人才库')
    queryClient.invalidateQueries({ queryKey: ['talentPool'] })
  },
  onError: (err: Error) => message.error(err.message || '移出失败'),
})

function handleRemove(item: TalentItem) {
  removeMutation.mutate(item.resumeSnapshotId)
}

// ── Detail Modal ──
const detailModal = reactive({ visible: false, data: null as any, loading: false })

async function openDetail(item: TalentItem) {
  detailModal.visible = true
  detailModal.loading = true
  detailModal.data = item
  // 尝试从快照 API 加载完整数据
  if (item.resumeSnapshotId) {
    try {
      const res = await resumesnapshotResumeSnapshotDetail({ query: { id: item.resumeSnapshotId } })
      const snapshot = res.data?.data
      if (snapshot) detailModal.data = snapshot
    } catch { /* fallback to list data */ }
  }
  detailModal.loading = false
}

// ── Edit Modal ──
const editModal = reactive({
  visible: false,
  submitting: false,
  form: { resumeSnapshotId: '', tags: '', remark: '' },
})

function openEditModal(item: TalentItem) {
  editModal.visible = true
  editModal.submitting = false
  editModal.form = {
    resumeSnapshotId: item.resumeSnapshotId,
    tags: item.tags ?? '',
    remark: item.remark ?? '',
  }
}

async function submitEdit() {
  editModal.submitting = true
  try {
    await talentpoolTalentPoolUpdate({
      body: editModal.form as Parameters<typeof talentpoolTalentPoolUpdate>[0]['body'],
    })
    message.success('更新成功')
    editModal.visible = false
    queryClient.invalidateQueries({ queryKey: ['talentPool'] })
  } catch (err: any) {
    message.warn(err?.message || '更新失败')
  } finally {
    editModal.submitting = false
  }
}

// ── Add Modal ──
const addModal = reactive({
  visible: false,
  form: { resumeSnapshotId: '', tags: '', remark: '' },
})

async function submitAdd() {
  try {
    await talentpoolTalentPoolAdd({
      body: addModal.form as Parameters<typeof talentpoolTalentPoolAdd>[0]['body'],
    })
    message.success('添加成功')
    addModal.visible = false
    queryClient.invalidateQueries({ queryKey: ['talentPool'] })
  } catch (err: any) {
    message.warn(err?.message || '添加失败')
  }
}

// ── View Resume ──
const resumeDrawer = reactive({ visible: false, url: '' })

function handleViewResume(raw: string) {
  resumeDrawer.url = `/api/staticfiles/resume/${raw}`
  resumeDrawer.visible = true
}

// ── 推荐到岗位 ──
const recommendModal = reactive({ visible: false, snapshotId: '', selectedJobId: '' })
const jobOptions = ref<Array<{ id: string; title: string }>>([])

async function openRecommend(item: TalentItem) {
  recommendModal.snapshotId = item.resumeSnapshotId
  recommendModal.selectedJobId = ''
  recommendModal.visible = true
  try {
    const result = await jobJobUserList({ query: { page: 1, pageSize: 200 } })
    const resp = result.data
    const data = (resp?.data as any)
    const rawList = data?.list ?? data ?? []
    jobOptions.value = rawList.map((j: any) => ({ id: String(j.id), title: j.title || '未命名' }))
  } catch { /* ignore */ }
}

function submitRecommend() {
  if (!recommendModal.selectedJobId) {
    message.warning('请选择目标岗位')
    return
  }
  message.success('推荐成功')
  recommendModal.visible = false
}
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索姓名/邮箱/意向" class="w-60" allow-clear />
        <a-button type="primary" @click="addModal.visible = true; addModal.form = { resumeSnapshotId: '', tags: '', remark: '' }">
          添加人才
        </a-button>
      </div>
    </div>

    <!-- 卡片列表 -->
    <a-spin :spinning="loading" style="min-height: 200px">
      <div class="flex flex-col gap-3">
        <div
          v-for="item in list" :key="item.id"
          class="bg-white rounded-xl p-5 border border-border-light transition-shadow hover:shadow-md"
        >
          <!-- Header: avatar + name + rating -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 text-white flex items-center justify-center text-base font-semibold shrink-0">
                {{ (item.name || '?')[0] }}
              </div>
              <div>
                <span class="text-base font-semibold text-text-primary">{{ item.name || '未知' }}</span>
                <span class="text-xs text-text-muted ml-2">{{ formatEduSummary(item) }}</span>
              </div>
            </div>
            <a-rate :value="item.rating" disabled :count="5" style="font-size: 12px" />
          </div>

          <!-- Body -->
          <div class="ml-[52px] border-t border-border-light pt-3">
            <div v-if="item.jobIntention" class="text-sm mb-1">
              <span class="text-text-muted mr-2">求职意向</span>
              <span class="text-primary font-medium">{{ item.jobIntention }}</span>
            </div>
            <div v-if="item.email" class="text-sm mb-1">
              <span class="text-text-muted mr-2">邮箱</span>
              <span class="text-text-secondary">{{ item.email }}</span>
            </div>
            <div v-if="item.mobile" class="text-sm mb-1">
              <span class="text-text-muted mr-2">手机</span>
              <span class="text-text-secondary">{{ item.mobile }}</span>
            </div>
            <div v-if="parseSkills(item.skills).length" class="mt-1">
              <a-tag v-for="s in parseSkills(item.skills).slice(0, 6)" :key="s" color="blue" class="m-0.5">{{ s }}</a-tag>
              <span v-if="parseSkills(item.skills).length > 6" class="text-xs text-text-muted">+{{ parseSkills(item.skills).length - 6 }}</span>
            </div>
            <div v-if="item.tags" class="mt-1">
              <a-tag v-for="t in item.tags.split(',').filter(Boolean)" :key="t" color="orange" class="m-0.5">{{ t }}</a-tag>
            </div>
            <div v-if="item.remark" class="mt-1 p-2 bg-bg-page rounded text-sm text-text-secondary">
              <span class="text-text-muted">备注：</span>{{ item.remark }}
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-border-light ml-[52px]">
            <span class="text-xs text-text-muted">{{ item.createTime }}</span>
            <div class="flex items-center gap-4">
              <span class="text-[13px] text-primary cursor-pointer hover:text-primary-hover" @click="openDetail(item)">详情</span>
              <span class="text-[13px] text-primary cursor-pointer hover:text-primary-hover" @click="openEditModal(item)">编辑标注</span>
              <span class="text-[13px] text-primary cursor-pointer hover:text-primary-hover" @click="openRecommend(item)">推荐到岗位</span>
              <span v-if="item.raw" class="text-[13px] text-primary cursor-pointer hover:text-primary-hover" @click="handleViewResume(item.raw)">查看简历</span>
              <a-popconfirm title="确定移出人才库？" @confirm="handleRemove(item)">
                <span class="text-[13px] text-red-500 cursor-pointer hover:text-red-600">移出</span>
              </a-popconfirm>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div
          v-if="list.length === 0 && !loading"
          class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border-light"
        >
          <p class="text-sm text-text-muted m-0">人才库暂无候选人</p>
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

    <!-- 添加人才 Modal -->
    <a-modal v-model:open="addModal.visible" title="添加人才" @ok="submitAdd">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="快照ID" required>
          <a-input v-model:value="addModal.form.resumeSnapshotId" placeholder="简历快照ID" />
        </a-form-item>
        <a-form-item label="标签">
          <a-input v-model:value="addModal.form.tags" placeholder="多个标签用逗号分隔" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="addModal.form.remark" :rows="3" placeholder="HR 备注信息" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑标注 Modal -->
    <a-modal
      v-model:open="editModal.visible"
      title="编辑人才库标注"
      :confirm-loading="editModal.submitting"
      @ok="submitEdit"
      width="480px"
    >
      <div class="py-2">
        <div class="text-sm font-semibold text-text-primary mb-2">标签（逗号分隔）</div>
        <a-input v-model:value="editModal.form.tags" placeholder="如：重点跟进,技术强" />
        <div class="text-sm font-semibold text-text-primary mb-2 mt-3">备注</div>
        <a-textarea v-model:value="editModal.form.remark" :rows="4" placeholder="HR 备注信息" />
      </div>
    </a-modal>

    <!-- 候选人详情 Modal -->
    <a-modal
      v-model:open="detailModal.visible"
      title="候选人详情"
      :footer="null"
      width="640px"
    >
      <a-spin :spinning="detailModal.loading">
      <div v-if="detailModal.data">
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">基本信息</h4>
          <p class="text-sm text-text-secondary m-1"><b>姓名：</b>{{ detailModal.data.name || '-' }}</p>
          <p v-if="detailModal.data.sex" class="text-sm text-text-secondary m-1"><b>性别：</b>{{ detailModal.data.sex }}</p>
          <p class="text-sm text-text-secondary m-1"><b>手机：</b>{{ detailModal.data.mobile || '-' }}</p>
          <p class="text-sm text-text-secondary m-1"><b>邮箱：</b>{{ detailModal.data.email || '-' }}</p>
          <p v-if="detailModal.data.expectedSalary" class="text-sm text-text-secondary m-1"><b>期望薪资：</b>{{ detailModal.data.expectedSalary }}</p>
          <p v-if="detailModal.data.jobIntention" class="text-sm text-text-secondary m-1"><b>求职意向：</b>{{ detailModal.data.jobIntention }}</p>
          <p v-if="detailModal.data.source" class="text-sm text-text-secondary m-1"><b>来源：</b>{{ detailModal.data.source }}</p>
          <p v-if="detailModal.data.summary" class="text-sm text-text-secondary m-1"><b>个人总结：</b>{{ detailModal.data.summary }}</p>
        </div>
        <div v-if="getEduItems(detailModal.data).length" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">教育经历</h4>
          <div v-for="(e, i) in getEduItems(detailModal.data)" :key="`edu-${i}`" class="text-sm mb-1">
            <span class="font-semibold text-text-primary">{{ e.school || '-' }}</span>
            <span v-if="e.degree" class="text-primary ml-2 text-xs">{{ e.degree }}</span>
            <span class="text-text-secondary ml-2">{{ e.major || '-' }}</span>
            <span class="text-text-muted ml-2">{{ e.duration || '-' }}</span>
          </div>
        </div>
        <div v-if="parseSkills(detailModal.data.skills).length" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">技能</h4>
          <div>
            <a-tag v-for="s in parseSkills(detailModal.data.skills)" :key="s" color="blue" class="m-0.5">{{ s }}</a-tag>
          </div>
        </div>
        <div v-if="parseJSON(detailModal.data.experience).length" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">工作经历</h4>
          <div v-for="(e, i) in parseJSON(detailModal.data.experience)" :key="i" class="text-sm mb-1">
            <span class="font-semibold text-text-primary">{{ e.company }}</span>
            <span class="text-text-secondary ml-2">{{ e.position }}</span>
            <span class="text-text-muted ml-2">{{ e.duration }}</span>
          </div>
        </div>
        <div v-if="parseJSON(detailModal.data.projects).length" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">项目经历</h4>
          <div v-for="(p, i) in parseJSON(detailModal.data.projects)" :key="i" class="mb-2">
            <span class="font-semibold text-text-primary text-sm">{{ p.name }}</span>
            <span class="text-text-secondary ml-2 text-sm">{{ p.role }}</span>
            <p v-if="p.description" class="text-sm text-text-secondary m-0.5 leading-relaxed">{{ p.description }}</p>
          </div>
        </div>
        <div v-if="detailModal.data.tags || detailModal.data.remark" class="mb-4">
          <h4 class="text-sm font-semibold text-text-primary border-b border-border-light pb-1.5 mb-2 m-0">HR 标注</h4>
          <p v-if="detailModal.data.tags" class="text-sm text-text-secondary m-1">
            <b>标签：</b>
            <a-tag v-for="t in detailModal.data.tags.split(',').filter(Boolean)" :key="t" color="orange" class="m-0.5">{{ t }}</a-tag>
          </p>
          <p v-if="detailModal.data.remark" class="text-sm text-text-secondary m-1"><b>备注：</b>{{ detailModal.data.remark }}</p>
        </div>
      </div>
      </a-spin>
    </a-modal>

    <!-- 简历预览 Drawer -->
    <a-drawer v-model:open="resumeDrawer.visible" title="简历预览" width="700px">
      <iframe v-if="resumeDrawer.url" :src="resumeDrawer.url" class="w-full h-[80vh] border-none" />
    </a-drawer>

    <!-- 推荐到岗位 Modal -->
    <a-modal v-model:open="recommendModal.visible" title="推荐到岗位" @ok="submitRecommend" width="480px">
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
