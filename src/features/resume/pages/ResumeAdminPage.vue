<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { useResumeTable, type ResumeItem } from '../composables/useResume.js'
import { PermissionCode } from '@/infrastructure/permission/types'
import { EDUCATION_OPTIONS, SEX_OPTIONS, RESUME_SOURCE_OPTIONS } from '@/shared/utils/constants'
import { useAuthStore } from '@/infrastructure/store/auth'

const auth = useAuthStore()

const {
  list, total, loading, page, pageSize, keyword, handlePageChange,
  updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useResumeTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增简历')
const editingItem = ref<ResumeItem | null>(null)

// 基本信息表单
const formState = ref<ResumeItem>({ name: '' })

// 头像上传
const coverPreview = ref('')
const coverFile = ref<File | null>(null)

// 简历附件上传
const rawFile = ref<File | null>(null)

// 动态列表
interface EduItem { school: string; major: string; degree: string; start: string; end: string }
interface ExpItem { company: string; position: string; start: string; end: string }
interface ProjItem { name: string; role: string; description: string }

const eduList = reactive<EduItem[]>([])
const expList = reactive<ExpItem[]>([])
const projList = reactive<ProjItem[]>([])

const ext = reactive({
  summary: '',
  expectedSalary: '',
  jobIntention: '',
  source: '',
  skills: '',
})

const degreeOptions = EDUCATION_OPTIONS.filter(o => o.value !== '不限').map(o => o.value)

function handleCoverUpload(file: File) {
  coverFile.value = file
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = URL.createObjectURL(file)
  return false
}

function handleRawUpload(file: File) {
  rawFile.value = file
  return false
}

function tryParse<T>(jsonStr: string | undefined, target: T[]) {
  target.length = 0
  if (!jsonStr) return
  try {
    const arr = JSON.parse(jsonStr)
    if (Array.isArray(arr)) target.push(...arr)
  } catch { /* ignore */ }
}

function splitDuration(duration: string) {
  const match = duration.match(/^(\d{4}-\d{1,2})-(\d{4}-\d{1,2})$/)
  if (match) return { start: match[1], end: match[2] }
  return { start: duration, end: '' }
}

function parseExperience(jsonStr: string | undefined) {
  expList.length = 0
  if (!jsonStr) return
  try {
    const arr = JSON.parse(jsonStr)
    if (!Array.isArray(arr)) return
    for (const item of arr) {
      if (item.duration && !item.start) {
        const { start, end } = splitDuration(item.duration)
        item.start = start
        item.end = end
      }
      expList.push(item)
    }
  } catch { /* ignore */ }
}

function parseEdu(jsonStr: string | undefined) {
  eduList.length = 0
  if (!jsonStr) return
  try {
    const arr = JSON.parse(jsonStr)
    if (!Array.isArray(arr)) return
    for (const item of arr) {
      if (item.duration && !item.start) {
        const { start, end } = splitDuration(item.duration)
        item.start = start
        item.end = end
      }
      eduList.push(item)
    }
  } catch { /* ignore */ }
}

function resetForm() {
  formState.value = { name: '' }
  coverPreview.value = ''
  coverFile.value = null
  rawFile.value = null
  eduList.length = 0
  expList.length = 0
  projList.length = 0
  Object.assign(ext, { summary: '', expectedSalary: '', jobIntention: '', source: '', skills: '' })
}

function openCreate() {
  modalTitle.value = '新增简历'
  editingItem.value = null
  resetForm()
  modalVisible.value = true
}

function openEdit(record: unknown) {
  const item = record as ResumeItem
  modalTitle.value = '编辑简历'
  editingItem.value = item
  formState.value = { ...item }

  // 头像预览
  coverPreview.value = item.cover ? `/api/staticfiles/resume/${item.cover}` : ''
  coverFile.value = null
  rawFile.value = null

  // 解析动态列表
  parseEdu(item.eduDetail)
  parseExperience(item.experience)
  tryParse(item.projects, projList)

  ext.summary = item.summary ?? ''
  ext.expectedSalary = item.expectedSalary ?? ''
  ext.jobIntention = item.jobIntention ?? ''
  ext.source = item.source ?? ''
  ext.skills = item.skills ?? ''

  modalVisible.value = true
}

async function handleSubmit() {
  const fd = new FormData()

  // 文件
  if (coverFile.value) fd.append('coverFile', coverFile.value)
  if (rawFile.value) fd.append('rawFile', rawFile.value)

  // 基本信息
  if (editingItem.value?.id) fd.append('id', editingItem.value.id)
  fd.append('name', formState.value.name)
  if (formState.value.sex) fd.append('sex', formState.value.sex)
  if (formState.value.birthday) fd.append('birthday', formState.value.birthday)
  if (formState.value.email) fd.append('email', formState.value.email)
  if (formState.value.mobile) fd.append('mobile', formState.value.mobile)
  fd.append('summary', ext.summary)
  fd.append('skills', ext.skills || '[]')
  fd.append('expectedSalary', ext.expectedSalary)
  fd.append('jobIntention', ext.jobIntention)
  fd.append('source', ext.source)
  fd.append('experience', JSON.stringify(expList.filter(e => e.company || e.position)))
  fd.append('projects', JSON.stringify(projList.filter(p => p.name)))
  fd.append('eduDetail', JSON.stringify(eduList.filter(e => e.school || e.major)))

  // 第一条教育经历回填 school/education
  const firstEdu = eduList.find(e => e.school)
  fd.append('school', firstEdu?.school ?? formState.value.school ?? '')
  fd.append('education', firstEdu?.degree ?? formState.value.education ?? '')

  // 使用 FormData 直接提交（不走 composable 的 JSON mutation）
  try {
    const url = editingItem.value?.id ? '/api/resume/update' : '/api/resume/create'
    const token = auth.adminToken
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd,
    })
    const result = await resp.json()
    if (result.code !== 0 && result.code !== 200) {
      message.error(result.msg || '操作失败')
      return
    }
    message.success(editingItem.value?.id ? '更新成功' : '创建成功')
    modalVisible.value = false
    // 刷新列表
    updateMutation?.mutate({} as any)
  } catch (err) {
    message.error((err as Error).message || '操作失败')
  }
}

function handleDelete(id: string) {
  deleteMutation?.mutate(id)
}

// 简历预览 Drawer
const previewVisible = ref(false)
const previewUrl = ref('')

function openPreview(raw: string) {
  if (!raw) { message.warn('暂无简历附件'); return }
  previewUrl.value = `/api/staticfiles/resume/${raw}`
  previewVisible.value = true
}

// 表格列定义
const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '性别', dataIndex: 'sex', key: 'sex' },
  { title: '学历', dataIndex: 'education', key: 'education' },
  { title: '学校', dataIndex: 'school', key: 'school' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机', dataIndex: 'mobile', key: 'mobile' },
  { title: '求职意向', dataIndex: 'jobIntention', key: 'jobIntention', ellipsis: true },
  { title: '来源', dataIndex: 'source', key: 'source' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 240, fixed: 'right' as const },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索简历" class="w-60" allow-clear />
        <a-button v-permission="PermissionCode.RESUME_CREATE" type="primary" @click="openCreate">
          新增简历
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的简历？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.RESUME_DELETE" danger>
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
          <a-button v-if="record.raw" type="link" size="small" @click="openPreview(record.raw)">
            预览
          </a-button>
          <a-button v-permission="PermissionCode.RESUME_UPDATE" type="link" size="small" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该简历？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.RESUME_DELETE" type="link" size="small" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" width="880px">
      <a-form :label-col="{ span: 4 }">
        <!-- 基本信息 -->
        <div class="flex items-center gap-4 mb-4 ml-[16.67%]">
          <div class="w-14 h-14 rounded-full border-2 border-gray-200 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
            <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover" />
            <span v-else class="text-gray-300 text-2xl">👤</span>
          </div>
          <div>
            <a-upload :before-upload="handleCoverUpload" :show-upload-list="false" accept="image/*">
              <a-button size="small">上传照片</a-button>
            </a-upload>
          </div>
        </div>

        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="姓名" required>
              <a-input v-model:value="formState.name" placeholder="请输入姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="性别">
              <a-select v-model:value="formState.sex" :options="SEX_OPTIONS" allow-clear placeholder="请选择" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="出生日期">
              <a-date-picker
                v-model:value="formState.birthday"
                value-format="YYYY-MM-DD"
                placeholder="请选择出生日期"
                class="w-full"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机">
              <a-input v-model:value="formState.mobile" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱">
              <a-input v-model:value="formState.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="简历附件">
              <div class="flex items-center gap-2">
                <a-upload :before-upload="handleRawUpload" :show-upload-list="false" accept=".pdf,.doc,.docx">
                  <a-button size="small">选择文件</a-button>
                </a-upload>
                <span v-if="rawFile" class="text-xs text-gray-500">{{ rawFile.name }}</span>
                <span v-else-if="formState.raw" class="text-xs text-gray-500">已上传</span>
              </div>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 教育经历 -->
        <a-divider>教育经历</a-divider>
        <div v-for="(edu, i) in eduList" :key="i" class="bg-gray-50 rounded p-3 mb-2">
          <div class="flex flex-wrap gap-2 items-center">
            <a-input v-model:value="edu.school" placeholder="学校" class="w-[140px]" />
            <a-select v-model:value="edu.degree" placeholder="学历" class="w-[100px]" allow-clear>
              <a-select-option v-for="d in degreeOptions" :key="d" :value="d">{{ d }}</a-select-option>
            </a-select>
            <a-input v-model:value="edu.major" placeholder="专业" class="w-[110px]" />
            <a-date-picker v-model:value="edu.start" picker="month" value-format="YYYY-MM" placeholder="开始" class="w-[110px]" />
            <span class="text-gray-400 text-sm">至</span>
            <a-date-picker v-model:value="edu.end" picker="month" value-format="YYYY-MM" placeholder="结束" class="w-[110px]" />
            <span class="text-red-500 text-sm cursor-pointer shrink-0" @click="eduList.splice(i, 1)">删除</span>
          </div>
        </div>
        <a-button type="dashed" block @click="eduList.push({ school: '', major: '', degree: '', start: '', end: '' })">
          + 添加教育经历
        </a-button>

        <!-- 工作经历 -->
        <a-divider>工作经历</a-divider>
        <div v-for="(exp, i) in expList" :key="i" class="bg-gray-50 rounded p-3 mb-2">
          <div class="flex flex-wrap gap-2 items-center">
            <a-input v-model:value="exp.company" placeholder="公司名称" class="w-[140px]" />
            <a-input v-model:value="exp.position" placeholder="职位" class="w-[110px]" />
            <a-date-picker v-model:value="exp.start" picker="month" value-format="YYYY-MM" placeholder="开始" class="w-[110px]" />
            <span class="text-gray-400 text-sm">至</span>
            <a-date-picker v-model:value="exp.end" picker="month" value-format="YYYY-MM" placeholder="结束" class="w-[110px]" />
            <span class="text-red-500 text-sm cursor-pointer shrink-0" @click="expList.splice(i, 1)">删除</span>
          </div>
        </div>
        <a-button type="dashed" block @click="expList.push({ company: '', position: '', start: '', end: '' })">
          + 添加工作经历
        </a-button>

        <!-- 项目经历 -->
        <a-divider>项目经历</a-divider>
        <div v-for="(proj, i) in projList" :key="i" class="bg-gray-50 rounded p-3 mb-2">
          <div class="flex flex-wrap gap-2 items-center mb-2">
            <a-input v-model:value="proj.name" placeholder="项目名称" class="w-[140px]" />
            <a-input v-model:value="proj.role" placeholder="担任角色" class="w-[110px]" />
            <span class="text-red-500 text-sm cursor-pointer shrink-0" @click="projList.splice(i, 1)">删除</span>
          </div>
          <a-textarea v-model:value="proj.description" placeholder="项目描述（选填）" :rows="2" />
        </div>
        <a-button type="dashed" block @click="projList.push({ name: '', role: '', description: '' })">
          + 添加项目经历
        </a-button>

        <!-- 其他信息 -->
        <a-divider>其他信息</a-divider>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="期望薪资">
              <a-input v-model:value="ext.expectedSalary" placeholder="如 15K-20K" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="求职意向">
              <a-input v-model:value="ext.jobIntention" placeholder="如 后端开发" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="来源">
              <a-select v-model:value="ext.source" :options="RESUME_SOURCE_OPTIONS" allow-clear placeholder="请选择来源" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="技能" :label-col="{ span: 4 }">
          <a-textarea v-model:value="ext.skills" placeholder="如: Go, Java, Docker..." :rows="2" />
        </a-form-item>
        <a-form-item label="自我评价" :label-col="{ span: 4 }">
          <a-textarea v-model:value="ext.summary" placeholder="简要介绍自己的优势和特点" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 简历预览 Drawer -->
    <a-drawer v-model:open="previewVisible" title="简历预览" width="700px">
      <iframe v-if="previewUrl" :src="previewUrl" class="w-full h-[80vh] border-none" />
      <a-empty v-else description="暂无简历附件" />
    </a-drawer>
  </div>
</template>
