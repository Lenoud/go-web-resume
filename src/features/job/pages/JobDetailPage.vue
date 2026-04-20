<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { marked } from 'marked'
import { jobJobDetail, jobJobList, resumeResumeDetail, postPostCreate } from '@/client'
import { normalizePaginated } from '@/infrastructure/api/normalize'
import { useAuthStore } from '@/infrastructure/store/auth'
import { message } from 'ant-design-vue'
import JobCard from '../components/JobCard.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const jobId = computed(() => (route.query.id as string) ?? '')

const detailQuery = useQuery({
  queryKey: ['jobDetail', jobId],
  queryFn: async () => {
    const result = await jobJobDetail({ query: { id: jobId.value } })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return resp.data
  },
  enabled: !!jobId.value,
})

// 相关岗位
const recommendQuery = useQuery({
  queryKey: ['jobRecommend'],
  queryFn: async () => {
    const result = await jobJobList({ query: { page: 1, pageSize: 10 } as Record<string, unknown> })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) return []
    const paginated = normalizePaginated<{ id: string; title: string; companyTitle: string; location: string; education: string; workExpe: string; minSalary: number; maxSalary: number; salaryShow: string; category: string; status: number }>(resp.data)
    return paginated.list.filter(j => String(j.id) !== jobId.value).slice(0, 6)
  },
})

const detail = computed(() => detailQuery.data?.value)
const loading = computed(() => detailQuery.isLoading.value)
const recommendList = computed(() => recommendQuery.data?.value ?? [])

const statusLabel = (status: number | undefined) => {
  const map: Record<number, string> = { 0: '草稿', 1: '招聘中', 2: '已关闭', 3: '已删除', 4: '已招满' }
  return map[status ?? -1] ?? '--'
}

// ── 投递简历 ──
const applying = ref(false)

async function handleApply() {
  if (!auth.isUserLoggedIn) {
    message.warning('请先登录')
    router.push({ name: 'login' })
    return
  }
  if (auth.userRole !== '1') {
    message.warning('仅求职者可投递简历')
    return
  }
  applying.value = true
  try {
    // 获取简历
    const resumeResult = await resumeResumeDetail({ query: { userId: auth.userId } })
    const resumeResp = resumeResult.data
    if (!resumeResp || (resumeResp.code !== undefined && resumeResp.code !== 0 && resumeResp.code !== 200)) {
      message.error(resumeResp?.msg ?? '获取简历失败')
      return
    }
    const resumeData = resumeResp.data
    if (!resumeData?.id) {
      message.warning('请先完善简历')
      router.push({ name: 'resumeEditView' })
      return
    }
    // 提交投递
    const result = await postPostCreate({
      body: {
        userId: auth.userId,
        jobId: jobId.value,
        resumeId: String(resumeData.id),
        companyId: detail.value?.companyId ?? '',
      },
    })
    const resp = result.data
    if (resp && resp.code !== undefined && resp.code !== 0 && resp.code !== 200) {
      message.error(resp.msg ?? '投递失败')
      return
    }
    message.success('投递成功')
  } catch (err) {
    message.error((err as Error).message || '投递失败')
  } finally {
    applying.value = false
  }
}

// Markdown → HTML（使用 marked 库）
function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text, { async: false }) as string
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto px-4 py-[72px]">
    <a-spin :spinning="loading">
      <template v-if="detail">
        <div class="flex gap-6 items-start">
          <!-- 左栏 -->
          <div class="flex-1 min-w-0">
            <!-- 基本信息卡片 -->
            <div class="bg-white border border-border rounded-md p-6 mb-4">
              <div class="flex items-center gap-2">
                <h1 class="m-0 text-[28px] font-semibold text-text-primary leading-[42px]">{{ detail.title ?? '-' }}</h1>
                <span class="text-xs px-2 py-0.5 rounded-sm shrink-0 border"
                  :class="detail.status === 1 ? 'text-green-500 bg-green-50/80 border-green-200' : detail.status === 2 ? 'text-red-500 bg-red-50 border-red-200' : 'text-blue-500 bg-blue-50 border-blue-200'"
                >{{ statusLabel(detail.status) }}</span>
              </div>
              <div class="text-accent text-xl font-medium my-2">{{ detail.salaryShow || '--' }}</div>
              <div class="flex flex-wrap gap-2 mb-4">
                <span class="text-sm px-2.5 py-[3px] bg-bg-page rounded-sm text-text-secondary">{{ detail.recruitType === 'experienced' ? '社招' : detail.recruitType === 'campus' ? '校招' : '--' }}</span>
                <span class="text-sm px-2.5 py-[3px] bg-bg-page rounded-sm text-text-secondary">{{ detail.jobNature === 'fulltime' ? '全职' : detail.jobNature === 'parttime' ? '兼职' : detail.jobNature === 'intern' ? '实习' : '--' }}</span>
                <span class="text-sm px-2.5 py-[3px] bg-bg-page rounded-sm text-text-secondary">{{ detail.education || '学历不限' }}</span>
                <span class="text-sm px-2.5 py-[3px] bg-bg-page rounded-sm text-text-secondary">{{ detail.workExpe || '经验不限' }}</span>
                <span class="text-sm px-2.5 py-[3px] bg-primary-light rounded-sm text-primary">{{ detail.location || '--' }}</span>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-text-secondary">
                <span v-if="detail.departmentTitle">部门：{{ detail.departmentTitle }}</span>
                <span v-if="detail.category">分类：{{ detail.category }}</span>
                <span v-if="detail.address">地址：{{ detail.address }}</span>
              </div>
              <!-- 投递按钮 -->
              <div class="mt-5 flex items-center gap-3">
                <button
                  class="h-11 px-8 border-none rounded-md bg-primary text-white text-base font-medium cursor-pointer hover:bg-primary-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(70,132,226,0.3)] active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  :disabled="applying || detail.status !== 1"
                  @click="handleApply"
                >{{ applying ? '投递中...' : detail.status === 1 ? '投递简历' : '该岗位已关闭' }}</button>
                <span v-if="detail.pv" class="text-sm text-text-muted">{{ detail.pv }} 次浏览</span>
              </div>
            </div>

            <!-- 岗位描述 -->
            <div v-if="detail.description" class="bg-white border border-border rounded-md p-6 mb-4">
              <div class="font-medium text-base text-text-primary mb-4 pb-2 border-b border-border">岗位描述</div>
              <div class="markdown-body text-text-secondary text-sm leading-[22px] break-words" v-html="renderMarkdown(detail.description)" />
            </div>

            <!-- 岗位要求 -->
            <div v-if="detail.requirement" class="bg-white border border-border rounded-md p-6 mb-4">
              <div class="font-medium text-base text-text-primary mb-4 pb-2 border-b border-border">岗位要求</div>
              <div class="markdown-body text-text-secondary text-sm leading-[22px] break-words" v-html="renderMarkdown(detail.requirement)" />
            </div>
          </div>

          <!-- 右栏：相关岗位 -->
          <div class="w-[280px] shrink-0 sticky top-16 max-h-[calc(100vh-80px)] overflow-y-auto">
            <div class="font-medium text-base text-text-primary mb-4 pb-2 border-b border-border">相关岗位</div>
            <div class="flex flex-col gap-4">
              <JobCard v-for="item in recommendList" :key="item.id" :record="item" />
            </div>
          </div>
        </div>
      </template>

      <div v-else-if="!loading" class="flex flex-col items-center py-20">
        <p class="text-text-muted">职位不存在</p>
      </div>
    </a-spin>

    <div class="mt-4 text-center">
      <a-button @click="router.back()">返回</a-button>
    </div>
  </div>
</template>

<style scoped>
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}
.markdown-body :deep(li) {
  margin: 0.25em 0;
}
.markdown-body :deep(p) {
  margin: 0.5em 0;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 0.8em 0 0.4em;
  font-weight: 600;
  color: var(--text-primary, #152844);
}
.markdown-body :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}
.markdown-body :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid #d0d5dd;
  padding-left: 12px;
  margin: 0.5em 0;
  color: #6b7280;
}
</style>
