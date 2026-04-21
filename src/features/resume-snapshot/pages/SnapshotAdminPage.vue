<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useResumeSnapshotTable, type ResumeSnapshotInfo } from '../composables/useResumeSnapshot.js'
import { PermissionCode } from '@/infrastructure/permission/types'
import { postPostCreateFromSnapshot, jobJobList, resumeResumeParseResult } from '@/client'
import { EDUCATION_OPTIONS, SEX_OPTIONS, RESUME_SOURCE_OPTIONS } from '@/shared/utils/constants'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { useAuthStore } from '@/infrastructure/store/auth'

const auth = useAuthStore()
const queryClient = useQueryClient()

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

async function openRecommend(record: ResumeSnapshotInfo) {
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

// ── 批量上传 ──
interface BatchUploadItem {
  uid: string
  file: File
  fileName: string
  status: 'waiting' | 'uploading' | 'parsing' | 'success' | 'failed'
  taskId?: string
  errorMsg?: string
}

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
  let successCount = 0

  for (const item of batchUploadModal.fileList) {
    if ((item.status as string) === 'success') continue
    item.status = 'uploading'
    item.errorMsg = undefined

    try {
      // 上传文件
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
      const result = await resp.json()

      if (result.code !== 200 && result.code !== 0) {
        throw new Error(result.msg || '上传失败')
      }

      const taskId: string = result.data?.taskId
      if (!taskId) throw new Error('服务端未返回 taskId')

      item.taskId = taskId
      item.status = 'parsing'

      // 轮询解析结果
      await pollTaskResult(item)

      if ((item.status as string) === 'success') successCount++
    } catch (err: any) {
      item.status = 'failed'
      item.errorMsg = err?.message || '上传失败'
    }
  }

  batchUploadModal.uploading = false

  if (successCount > 0) {
    queryClient.invalidateQueries({ queryKey: queryKeys.resumeSnapshots.all })
    message.success(`批量上传完成：${successCount}/${batchUploadModal.fileList.length} 成功`)
  } else {
    message.warning('批量上传完成，全部失败')
  }
}

function pollTaskResult(item: BatchUploadItem): Promise<void> {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        const result = await resumeResumeParseResult({
          query: { taskId: item.taskId! },
        })
        const resp = result.data as any
        const status: string = resp?.data?.status ?? ''

        if (status === 'done') {
          clearInterval(interval)
          item.status = 'success'
          resolve()
        } else if (status === 'failed') {
          clearInterval(interval)
          item.status = 'failed'
          item.errorMsg = resp?.data?.msg || '解析失败'
          resolve()
        }
      } catch {
        // 网络错误继续轮询
      }
    }, 2000)

    // 5 分钟超时
    setTimeout(() => {
      clearInterval(interval)
      if (item.status === 'parsing') {
        item.status = 'failed'
        item.errorMsg = '解析超时'
      }
      resolve()
    }, 5 * 60 * 1000)
  })
}

function closeBatchUploadModal() {
  if (batchUploadModal.uploading) {
    message.warning('上传进行中，请等待完成')
    return
  }
  batchUploadModal.visible = false
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
        <a-button v-permission="PermissionCode.RESUME_CREATE" type="primary" @click="openBatchUploadModal">
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
      @change="handlePageChange"
      :scroll="{ x: 'max-content' }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button v-if="record.raw" type="link" size="small" @click="openResumePreview(record.raw)">
            查看简历
          </a-button>
          <a-button type="link" size="small" @click="openRecommend(record as ResumeSnapshotInfo)">
            推荐到岗位
          </a-button>
          <a-button v-permission="PermissionCode.RESUME_UPDATE" type="link" size="small" @click="openEdit(record as ResumeSnapshotInfo)">
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

    <!-- 批量上传 Modal -->
    <a-modal
      v-model:open="batchUploadModal.visible"
      title="批量上传简历"
      width="680px"
      :footer="null"
      :mask-closable="!batchUploadModal.uploading"
      :closable="!batchUploadModal.uploading"
    >
      <!-- 配置区域 -->
      <div v-if="!batchUploadModal.uploading">
        <a-form :label-col="{ span: 4 }">
          <a-form-item label="简历来源" required>
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
        <div v-if="batchUploadModal.fileList.length > 0" class="mb-4">
          <div class="text-sm text-gray-500 mb-2">
            已选择 {{ batchUploadModal.fileList.length }} 个文件：
          </div>
          <div
            v-for="item in batchUploadModal.fileList"
            :key="item.uid"
            class="flex items-center justify-between py-1 px-2 bg-gray-50 rounded mb-1"
          >
            <span class="text-sm truncate flex-1">{{ item.fileName }}</span>
            <span class="text-red-400 text-xs cursor-pointer ml-2 shrink-0" @click="removeBatchFile(item.uid)">
              移除
            </span>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <a-button @click="closeBatchUploadModal">取消</a-button>
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
        </div>
        <div
          v-for="item in batchUploadModal.fileList"
          :key="item.uid"
          class="flex items-center gap-2 py-2 px-3 border-b last:border-b-0"
        >
          <span class="text-sm truncate flex-1" :title="item.fileName">{{ item.fileName }}</span>
          <a-tag v-if="item.status === 'waiting'" color="default">等待中</a-tag>
          <a-tag v-else-if="item.status === 'uploading'" color="processing">上传中</a-tag>
          <a-tag v-else-if="item.status === 'parsing'" color="blue">
            <span class="animate-pulse">解析中</span>
          </a-tag>
          <a-tag v-else-if="item.status === 'success'" color="success">成功</a-tag>
          <a-tag v-else-if="item.status === 'failed'" color="error">失败</a-tag>
          <span v-if="item.errorMsg" class="text-xs text-red-400 truncate max-w-[200px]" :title="item.errorMsg">
            {{ item.errorMsg }}
          </span>
        </div>
      </div>
    </a-modal>
  </div>
</template>
