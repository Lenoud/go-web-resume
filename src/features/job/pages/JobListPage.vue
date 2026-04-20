<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { jobJobList, jobJobCategoryList } from '@/client'
import { normalizePaginated } from '@/infrastructure/api/normalize'
import { JOB_NATURE_MAP } from '@/shared/utils/constants'
import JobCard from '../components/JobCard.vue'

const route = useRoute()
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const category = ref('')
const activeSort = ref(0)
const jobNature = ref('')
const heroKeyword = ref('')

// 根据路由决定招聘类型
const recruitType = computed(() => {
  const name = route.name as string
  if (name === 'campus') return 'campus'
  if (name === 'experienced') return 'experienced'
  return '' // 首页：全部
})

// 是否显示 Hero（仅首页）
const showHero = computed(() => route.name === 'home')

const sortTabs = ['最新发布', '最热岗位', '推荐岗位']

// 分类列表
const categoryQuery = useQuery({
  queryKey: ['jobCategories'],
  queryFn: async () => {
    const result = await jobJobCategoryList()
    return result.data?.data?.categories ?? []
  },
})

// 职位列表
const listQuery = useQuery({
  queryKey: computed(() => ['jobList', { page: page.value, pageSize: pageSize.value, keyword: keyword.value, category: category.value, sort: activeSort.value, recruitType: recruitType.value, jobNature: jobNature.value }]),
  queryFn: async () => {
    const params: Record<string, unknown> = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      category: category.value || undefined,
      jobNature: jobNature.value || undefined,
    }
    if (recruitType.value) params.recruitType = recruitType.value
    const result = await jobJobList({
      query: params,
    })
    const resp = result.data
    if (!resp || (resp.code !== undefined && resp.code !== 0 && resp.code !== 200)) {
      throw new Error(resp?.msg ?? '查询失败')
    }
    return normalizePaginated<{ id: string; title: string; companyTitle: string; location: string; education: string; workExpe: string; minSalary: number; maxSalary: number; salaryShow: string; category: string; createTime: string; status: number }>(resp.data)
  },
})

const list = computed(() => listQuery.data?.value?.list ?? [])
const total = computed(() => listQuery.data?.value?.total ?? 0)
const loading = computed(() => listQuery.isLoading.value)
const categories = computed(() => categoryQuery.data?.value ?? [])

const hotTags = ['Java开发', '前端工程师', 'Go开发', '产品经理']

function handleSearch() {
  keyword.value = heroKeyword.value.trim()
  page.value = 1
}

function quickSearch(tag: string) {
  heroKeyword.value = tag
  handleSearch()
}

function selectCategory(cat: string) {
  category.value = category.value === cat ? '' : cat
  page.value = 1
}

function selectSort(index: number) {
  activeSort.value = index
  page.value = 1
}
</script>

<template>
  <div>
    <!-- Hero Section（仅首页显示） -->
    <section v-if="showHero" class="relative min-h-[520px] flex items-center justify-center overflow-hidden" style="background: linear-gradient(160deg, #0f1b3d 0%, #1a2f6b 40%, #2a4a9e 70%, #3b6bc7 100%)">
      <div class="absolute inset-0" style="
        background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size: 60px 60px;
        mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, black 30%, transparent 80%);
        -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, black 30%, transparent 80%);
      " />
      <div class="relative z-10 text-center px-6 py-20 max-w-[680px] w-full">
        <h1 class="m-0 mb-5 leading-tight">
          <span class="block text-xl font-normal text-white/70 tracking-widest mb-2">加入我们</span>
          <span class="block text-5xl font-bold text-white tracking-wider" style="background: linear-gradient(135deg, #fff 0%, #a8c8ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">共创未来</span>
        </h1>
        <p class="text-base text-white/60 m-0 mb-12 tracking-wider">寻找志同道合的伙伴，在这里施展才华、实现价值</p>
        <div class="max-w-[560px] mx-auto">
          <div class="flex bg-white rounded-b-xl overflow-hidden shadow-lg h-[52px]">
            <input
              v-model="heroKeyword"
              placeholder="搜索岗位关键词"
              class="flex-1 border-none outline-none px-5 text-[15px] text-text-primary bg-transparent placeholder:text-text-muted"
              @keyup.enter="handleSearch"
            />
            <button
              class="flex items-center gap-1.5 px-7 bg-primary text-white border-none text-[15px] font-medium cursor-pointer hover:bg-primary-hover transition-colors"
              @click="handleSearch"
            >搜索</button>
          </div>
          <div class="flex items-center gap-3 mt-4 flex-wrap justify-center">
            <span class="text-xs text-white/40">热门：</span>
            <span
              v-for="tag in hotTags" :key="tag"
              class="text-xs text-white/70 cursor-pointer px-2.5 py-0.5 rounded-full bg-white/8 hover:bg-white/18 hover:text-white transition-all"
              @click="quickSearch(tag)"
            >{{ tag }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 社招/校招 Banner -->
    <section v-if="!showHero" class="mt-14 py-12 text-center text-white" style="background: linear-gradient(160deg, #0f1b3d 0%, #1a2f6b 40%, #2a4a9e 70%, #3b6bc7 100%)">
      <h1 class="text-3xl font-bold m-0 mb-2">{{ recruitType === 'campus' ? '校园招聘' : '社会招聘' }}</h1>
      <p class="text-white/60 text-sm m-0">{{ recruitType === 'campus' ? '面向应届毕业生与实习生，开启职业生涯' : '面向有工作经验的候选人，欢迎各路人才加入' }}</p>
    </section>

    <!-- 首页品牌区（Feature + 入口 + 统计） -->
    <section v-if="showHero" class="bg-white">
      <!-- Feature 卡片 -->
      <div class="max-w-[1200px] mx-auto px-6 py-16">
        <h2 class="text-2xl font-bold text-text-primary text-center m-0 mb-3">为什么选择我们</h2>
        <p class="text-sm text-text-muted text-center m-0 mb-12">高效连接企业与人才，让招聘更简单</p>
        <div class="grid grid-cols-3 gap-8">
          <div class="text-center p-6">
            <div class="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-light flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4684e2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 class="text-lg font-semibold text-text-primary m-0 mb-2">海量优质岗位</h3>
            <p class="text-sm text-text-muted m-0">覆盖互联网、金融、制造等多个行业，精选优质职位</p>
          </div>
          <div class="text-center p-6">
            <div class="w-14 h-14 mx-auto mb-4 rounded-xl bg-green-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 class="text-lg font-semibold text-text-primary m-0 mb-2">高效投递反馈</h3>
            <p class="text-sm text-text-muted m-0">实时跟踪投递状态，面试/录用进度一目了然</p>
          </div>
          <div class="text-center p-6">
            <div class="w-14 h-14 mx-auto mb-4 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 class="text-lg font-semibold text-text-primary m-0 mb-2">安全隐私保护</h3>
            <p class="text-sm text-text-muted m-0">简历隐私可控，仅投递企业可查看您的详细信息</p>
          </div>
        </div>
      </div>

      <!-- 招聘类型入口 -->
      <div class="max-w-[1200px] mx-auto px-6 pb-16">
        <div class="grid grid-cols-2 gap-6">
          <div class="relative overflow-hidden rounded-xl p-8 cursor-pointer group transition-shadow hover:shadow-lg" style="background: linear-gradient(135deg, #0f1b3d, #2a4a9e)" @click="$router.push({ name: 'experienced' })">
            <div class="relative z-10">
              <h3 class="text-xl font-bold text-white m-0 mb-2">社会招聘</h3>
              <p class="text-sm text-white/60 m-0 mb-4">面向有经验的候选人，发现更好的职业机会</p>
              <span class="inline-flex items-center gap-1 text-sm text-white/80 group-hover:text-white transition-colors">查看岗位 →</span>
            </div>
            <div class="absolute right-4 bottom-4 opacity-10">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="white" stroke="none"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3h-8l-2 4h12z"/></svg>
            </div>
          </div>
          <div class="relative overflow-hidden rounded-xl p-8 cursor-pointer group transition-shadow hover:shadow-lg" style="background: linear-gradient(135deg, #1a3a2a, #16a34a)" @click="$router.push({ name: 'campus' })">
            <div class="relative z-10">
              <h3 class="text-xl font-bold text-white m-0 mb-2">校园招聘</h3>
              <p class="text-sm text-white/60 m-0 mb-4">应届生专属通道，开启精彩职业生涯</p>
              <span class="inline-flex items-center gap-1 text-sm text-white/80 group-hover:text-white transition-colors">查看岗位 →</span>
            </div>
            <div class="absolute right-4 bottom-4 opacity-10">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计数字 -->
      <div class="border-t border-border-light">
        <div class="max-w-[1200px] mx-auto px-6 py-10">
          <div class="grid grid-cols-4 gap-8 text-center">
            <div>
              <div class="text-3xl font-bold text-primary m-0 mb-1">{{ total > 0 ? total : '100+' }}</div>
              <div class="text-sm text-text-muted m-0">在招岗位</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-primary m-0 mb-1">50+</div>
              <div class="text-sm text-text-muted m-0">合作企业</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-primary m-0 mb-1">1000+</div>
              <div class="text-sm text-text-muted m-0">注册用户</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-primary m-0 mb-1">98%</div>
              <div class="text-sm text-text-muted m-0">用户满意度</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 职位列表区域 -->
    <section class="max-w-[1200px] mx-auto px-6 py-6 pb-12">
      <div class="flex gap-5 items-start">
        <!-- 左侧筛选侧边栏 -->
        <aside v-if="categories.length > 1" class="w-[220px] shrink-0 bg-white rounded-xl border border-border-light sticky top-[72px]">
          <!-- 岗位分类 -->
          <div class="p-5 border-b border-border-light">
            <h4 class="text-lg font-bold text-text-primary m-0 mb-3">岗位分类</h4>
            <div class="flex flex-col gap-1.5">
              <span
                class="block px-3 py-[7px] text-sm text-text-secondary bg-transparent rounded-md cursor-pointer transition-all hover:text-primary hover:bg-primary-bg select-none"
                :class="{ '!text-primary !bg-primary-light !font-medium': !category }"
                @click="category = ''; page = 1"
              >全部</span>
              <span
                v-for="cat in categories" :key="cat"
                class="block px-3 py-[7px] text-sm text-text-secondary bg-transparent rounded-md cursor-pointer transition-all hover:text-primary hover:bg-primary-bg select-none"
                :class="{ '!text-primary !bg-primary-light !font-medium': category === cat }"
                @click="selectCategory(cat)"
              >{{ cat }}</span>
            </div>
          </div>
          <!-- 工作性质 -->
          <div class="p-5">
            <h4 class="text-lg font-bold text-text-primary m-0 mb-3">工作性质</h4>
            <div class="flex flex-col gap-1.5">
              <span
                class="block px-3 py-[7px] text-sm text-text-secondary bg-transparent rounded-md cursor-pointer transition-all hover:text-primary hover:bg-primary-bg select-none"
                :class="{ '!text-primary !bg-primary-light !font-medium': !jobNature }"
                @click="jobNature = ''; page = 1"
              >全部</span>
              <span
                v-for="item in JOB_NATURE_MAP.all" :key="item.value"
                class="block px-3 py-[7px] text-sm text-text-secondary bg-transparent rounded-md cursor-pointer transition-all hover:text-primary hover:bg-primary-bg select-none"
                :class="{ '!text-primary !bg-primary-light !font-medium': jobNature === item.value }"
                @click="jobNature = jobNature === item.value ? '' : item.value; page = 1"
              >{{ item.label }}</span>
            </div>
          </div>
        </aside>

        <!-- 右侧列表 -->
        <div class="flex-1 min-w-0">
          <!-- 排序栏 -->
          <div class="flex items-center justify-between bg-white rounded-xl px-5 py-3 mb-3 border border-border-light">
            <div class="flex gap-1">
              <span
                v-for="(tab, idx) in sortTabs" :key="idx"
                class="px-4 py-1.5 text-sm text-text-secondary rounded-full cursor-pointer transition-all select-none hover:text-primary hover:bg-primary-bg"
                :class="{ '!text-primary !bg-primary-light !font-medium': activeSort === idx }"
                @click="selectSort(idx)"
              >{{ tab }}</span>
            </div>
            <span v-if="total > 0" class="text-sm text-text-secondary shrink-0">共 {{ total }} 个岗位</span>
          </div>

          <!-- 职位列表 -->
          <div class="bg-white rounded-xl border border-border-light min-h-[400px]">
            <a-spin :spinning="loading">
              <div v-if="list.length > 0">
                <template v-for="(item, idx) in list" :key="item.id">
                  <div v-if="idx > 0" class="border-b border-border-light" />
                  <JobCard :record="item" />
                </template>
              </div>
              <div v-else-if="!loading" class="flex flex-col items-center justify-center py-20">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c4c9d4" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <p class="mt-4 text-sm text-text-muted m-0">暂无符合条件的岗位</p>
              </div>
            </a-spin>
          </div>

          <!-- 分页 -->
          <div v-if="total > 0" class="flex justify-center mt-6">
            <a-pagination
              v-model:current="page"
              v-model:page-size="pageSize"
              :total="total"
              show-size-changer
              :show-total="(t: number) => `共 ${t} 个职位`"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
