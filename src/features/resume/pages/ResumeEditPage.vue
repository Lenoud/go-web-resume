<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { resumeResumeDetail } from '@/client'
import { useAuthStore } from '@/infrastructure/store/auth'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { message } from 'ant-design-vue'

const auth = useAuthStore()
const queryClient = useQueryClient()

const detailQuery = useQuery({
  queryKey: queryKeys.resumes.detail(auth.userId),
  queryFn: async () => {
    const result = await resumeResumeDetail({ query: { userId: auth.userId } })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return resp.data
  },
  enabled: !!auth.userId,
})

const loading = computed(() => detailQuery.isLoading.value)
const detail = computed(() => detailQuery.data?.value)

// ── 基本信息表单 ──
const base = reactive({
  id: '',
  name: '',
  sex: '',
  birthday: '',
  email: '',
  mobile: '',
  cover: '',
  raw: '',
})

// ── 头像预览 ──
const coverPreview = ref('')
const coverFile = ref<File | null>(null)
// ── 简历附件 ──
const rawFile = ref<File | null>(null)

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

// ── 扩展信息（动态列表） ──
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

// ── 从 detail 填充表单 ──
watch(detail, (data) => {
  if (!data) return
  Object.assign(base, {
    id: data.id ?? '',
    name: data.name ?? '',
    sex: data.sex ?? '',
    birthday: data.birthday ?? '',
    email: data.email ?? '',
    mobile: data.mobile ?? '',
    cover: data.cover ?? '',
    raw: data.raw ?? '',
  })

  if (data.cover) {
    coverPreview.value = `/api/staticfiles/resume/${data.cover}`
  }

  // 解析 JSON 字符串（拆分 duration → start/end）
  parseExperience(data.experience)
  parseEdu(data.eduDetail)
  tryParse(data.projects, projList)

  ext.summary = data.summary ?? ''
  ext.expectedSalary = data.expectedSalary ?? ''
  ext.jobIntention = data.jobIntention ?? ''
  ext.source = data.source ?? ''
  ext.skills = data.skills ?? ''
}, { immediate: true })

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

// ── 保存 ──
const saving = ref(false)

async function handleSave() {
  if (!base.name?.trim()) return message.warning('请输入姓名')
  if (!base.sex) return message.warning('请选择性别')
  if (!base.birthday) return message.warning('请输入出生日期')
  if (!base.mobile?.trim()) return message.warning('请输入手机号')
  if (!base.email?.trim()) return message.warning('请输入邮箱')

  saving.value = true
  try {
    const fd = new FormData()
    fd.append('userId', auth.userId)
    if (base.id) fd.append('id', base.id)
    if (coverFile.value) fd.append('coverFile', coverFile.value)
    if (rawFile.value) fd.append('rawFile', rawFile.value)
    fd.append('name', base.name)
    fd.append('sex', base.sex)
    fd.append('birthday', base.birthday)
    fd.append('email', base.email)
    fd.append('mobile', base.mobile)
    fd.append('summary', ext.summary)
    fd.append('skills', ext.skills || '[]')
    fd.append('expectedSalary', ext.expectedSalary)
    fd.append('jobIntention', ext.jobIntention)
    fd.append('source', ext.source)
    fd.append('experience', JSON.stringify(expList.filter(e => e.company || e.position)))
    fd.append('projects', JSON.stringify(projList.filter(p => p.name)))
    fd.append('eduDetail', JSON.stringify(eduList.filter(e => e.school || e.major)))

    // 取第一条教育经历作为 school/education 回填
    const firstEdu = eduList.find(e => e.school)
    fd.append('school', firstEdu?.school ?? '')
    fd.append('education', firstEdu?.degree ?? '')

    const url = base.id ? '/api/resume/update' : '/api/resume/create'
    const token = auth.userToken
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd,
    })
    const result = await resp.json()
    if (result.code !== 0 && result.code !== 200) {
      message.error(result.msg || '保存失败')
      return
    }
    message.success('保存成功')
    queryClient.invalidateQueries({ queryKey: queryKeys.resumes.detail(auth.userId) })
  } catch (err) {
    message.error((err as Error).message || '保存失败')
  } finally {
    saving.value = false
  }
}

const sourceOptions = [
  '官网投递', '内部推荐', '招聘网站', '校园招聘', '猎头推荐', '社交媒体', '其他',
]
</script>

<template>
  <div class="max-w-[800px] mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-[22px] font-semibold text-text-primary m-0 mb-1">我的简历</h2>
    </div>

    <a-spin :spinning="loading">
      <div class="bg-white rounded-xl border border-border-light p-6">
        <!-- ====== 基本信息 ====== -->
        <div class="mb-8">
          <h3 class="text-base font-semibold text-text-primary m-0 mb-5 pb-2 border-b border-border-light">基本信息</h3>

          <!-- 头像 -->
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-full border-2 border-border overflow-hidden shrink-0 bg-bg-page flex items-center justify-center">
              <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover" />
              <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c4c9d4" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div>
              <a-upload :before-upload="handleCoverUpload" :show-upload-list="false" accept="image/*">
                <a-button size="small">上传照片</a-button>
              </a-upload>
              <p class="text-xs text-text-muted m-0 mt-1">支持 PNG/JPG，小于 4MB</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">姓名 <span class="text-accent">*</span></label>
              <a-input v-model:value="base.name" placeholder="请输入姓名" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">性别 <span class="text-accent">*</span></label>
              <a-select v-model:value="base.sex" placeholder="请选择" allow-clear>
                <a-select-option value="男">男</a-select-option>
                <a-select-option value="女">女</a-select-option>
              </a-select>
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">出生日期 <span class="text-accent">*</span></label>
              <a-date-picker v-model:value="base.birthday" value-format="YYYY-MM-DD" placeholder="选择出生日期" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">手机号 <span class="text-accent">*</span></label>
              <a-input v-model:value="base.mobile" placeholder="请输入手机号" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">邮箱 <span class="text-accent">*</span></label>
              <a-input v-model:value="base.email" placeholder="请输入邮箱" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">简历附件</label>
              <div class="flex items-center gap-2">
                <a-upload :before-upload="handleRawUpload" :show-upload-list="false" accept=".pdf,.doc,.docx">
                  <a-button><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1 inline-block"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>选择文件</a-button>
                </a-upload>                <span class="text-xs text-text-muted">docx 或 pdf</span>
                <a v-if="base.raw" :href="`/api/staticfiles/resume/${base.raw}`" target="_blank" class="text-primary text-sm hover:underline">查看附件</a>
              </div>
            </div>
          </div>
        </div>

        <!-- ====== 扩展信息 ====== -->
        <div>
          <h3 class="text-base font-semibold text-text-primary m-0 mb-5 pb-2 border-b border-border-light">扩展信息</h3>

          <!-- 教育经历 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-text-primary mb-2">教育经历</label>
            <div v-for="(edu, i) in eduList" :key="i" class="bg-bg-page border border-border-light rounded-lg p-3 mb-2">
              <div class="flex flex-wrap gap-2 items-center">
                <a-input v-model:value="edu.school" placeholder="学校" class="w-[160px]" />
                <a-input v-model:value="edu.degree" placeholder="学历" class="w-[100px]" />
                <a-input v-model:value="edu.major" placeholder="专业" class="w-[120px]" />
                <a-date-picker v-model:value="edu.start" picker="month" value-format="YYYY-MM" placeholder="开始" class="w-[120px]" />
                <span class="text-text-muted text-sm">至</span>
                <a-date-picker v-model:value="edu.end" picker="month" value-format="YYYY-MM" placeholder="结束" class="w-[120px]" />
                <span class="text-red-500 text-sm cursor-pointer shrink-0 hover:text-red-600" @click="eduList.splice(i, 1)">删除</span>
              </div>
            </div>
            <button
              class="bg-transparent border border-dashed border-primary text-primary px-4 py-1 rounded text-sm cursor-pointer hover:bg-primary-light transition-colors"
              @click="eduList.push({ school: '', major: '', degree: '', start: '', end: '' })"
            >+ 添加教育经历</button>
          </div>

          <!-- 工作经历 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-text-primary mb-2">工作经历</label>
            <div v-for="(exp, i) in expList" :key="i" class="bg-bg-page border border-border-light rounded-lg p-3 mb-2">
              <div class="flex flex-wrap gap-2 items-center">
                <a-input v-model:value="exp.company" placeholder="公司名称" class="w-[160px]" />
                <a-input v-model:value="exp.position" placeholder="职位" class="w-[120px]" />
                <a-date-picker v-model:value="exp.start" picker="month" value-format="YYYY-MM" placeholder="开始" class="w-[120px]" />
                <span class="text-text-muted text-sm">至</span>
                <a-date-picker v-model:value="exp.end" picker="month" value-format="YYYY-MM" placeholder="结束" class="w-[120px]" />
                <span class="text-red-500 text-sm cursor-pointer shrink-0 hover:text-red-600" @click="expList.splice(i, 1)">删除</span>
              </div>
            </div>
            <button
              class="bg-transparent border border-dashed border-primary text-primary px-4 py-1 rounded text-sm cursor-pointer hover:bg-primary-light transition-colors"
              @click="expList.push({ company: '', position: '', start: '', end: '' })"
            >+ 添加工作经历</button>
          </div>

          <!-- 项目经验 -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-text-primary mb-2">项目经验</label>
            <div v-for="(proj, i) in projList" :key="i" class="bg-bg-page border border-border-light rounded-lg p-3 mb-2">
              <div class="flex flex-wrap gap-2 items-center mb-2">
                <a-input v-model:value="proj.name" placeholder="项目名称" class="w-[160px]" />
                <a-input v-model:value="proj.role" placeholder="担任角色" class="w-[120px]" />
                <span class="text-red-500 text-sm cursor-pointer shrink-0 hover:text-red-600" @click="projList.splice(i, 1)">删除</span>
              </div>
              <a-textarea v-model:value="proj.description" placeholder="项目描述（选填）" :rows="2" />
            </div>
            <button
              class="bg-transparent border border-dashed border-primary text-primary px-4 py-1 rounded text-sm cursor-pointer hover:bg-primary-light transition-colors"
              @click="projList.push({ name: '', role: '', description: '' })"
            >+ 添加项目经验</button>
          </div>

          <!-- 技能 -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-text-primary mb-1">技能</label>
            <a-textarea v-model:value="ext.skills" placeholder="如: Go, Java, Docker, K8s..." :rows="2" class="max-w-xl" />
          </div>

          <!-- 自我评价 -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-text-primary mb-1">自我评价</label>
            <a-textarea v-model:value="ext.summary" placeholder="简要介绍自己的优势和特点" :rows="3" class="max-w-xl" />
          </div>

          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-w-xl">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">期望薪资</label>
              <a-input v-model:value="ext.expectedSalary" placeholder="如: 15K-20K" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">求职意向</label>
              <a-input v-model:value="ext.jobIntention" placeholder="如: 后端开发" />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">来源渠道</label>
              <a-select v-model:value="ext.source" placeholder="请选择" allow-clear>
                <a-select-option v-for="s in sourceOptions" :key="s" :value="s">{{ s }}</a-select-option>
              </a-select>
            </div>
          </div>
        </div>

        <!-- Save -->
        <div class="mt-8 pt-4 border-t border-border-light">
          <a-button type="primary" size="large" :loading="saving" @click="handleSave">
            保存简历
          </a-button>
        </div>
      </div>
    </a-spin>
  </div>
</template>
