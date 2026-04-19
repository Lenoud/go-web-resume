<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/infrastructure/store/auth'
import { ROLE } from '@/shared/utils/constants'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const currentTab = computed(() => {
  const path = route.path
  if (path.startsWith('/index/usercenter')) return ''
  if (path === '/index/experienced') return 'experienced'
  if (path === '/index/campus') return 'campus'
  if (path.startsWith('/index/detail')) return 'home'
  if (path === '/index/home' || path === '/index' || path === '/') return 'home'
  return ''
})

const navTabs = [
  { key: 'home', label: '首页' },
  { key: 'experienced', label: '社招' },
  { key: 'campus', label: '校招' },
]

function handleNav(key: string) {
  if (key === 'home') router.push('/index/home')
  else if (key === 'experienced') router.push('/index/experienced')
  else if (key === 'campus') router.push('/index/campus')
}

function goUserCenter(menuName: string) {
  router.push(`/index/usercenter/${menuName}`)
}

function handleLogout() {
  auth.logout(false)
  router.push('/index/home')
}
</script>

<template>
  <div class="min-h-screen bg-bg-page">
    <!-- 固定顶栏 -->
    <header class="fixed top-0 left-0 w-full h-14 bg-white shadow-sm z-16 flex items-center px-6">
      <!-- Logo -->
      <h1 class="text-xl font-bold text-primary m-0 cursor-pointer mr-8 shrink-0" @click="router.push('/index/home')">
        智慧招聘系统
      </h1>

      <!-- 导航 Tab -->
      <nav class="flex items-center gap-4 mr-auto">
        <span
          v-for="tab in navTabs" :key="tab.key"
          class="text-sm cursor-pointer px-3 py-1 rounded-sm transition-all duration-150"
          :class="currentTab === tab.key ? 'text-primary font-semibold' : 'text-text-secondary hover:text-primary'"
          @click="handleNav(tab.key)"
        >{{ tab.label }}</span>
      </nav>

      <!-- 右侧 -->
      <div class="flex items-center gap-3">
        <template v-if="auth.isUserLoggedIn">
          <a-dropdown>
            <div class="flex items-center gap-2 cursor-pointer">
              <a-avatar :size="32" class="bg-primary/10">
                <template #icon><UserOutlined class="text-primary" /></template>
              </a-avatar>
              <span class="text-text-secondary text-sm">{{ auth.username }}</span>
            </div>
            <template #overlay>
              <a-menu>
                <template v-if="auth.currentUserRole === ROLE.HR">
                  <a-menu-item @click="goUserCenter('myJobView')">岗位管理</a-menu-item>
                  <a-menu-item @click="goUserCenter('companyPostView')">投递管理</a-menu-item>
                </template>
                <template v-else>
                  <a-menu-item @click="goUserCenter('resumeEditView')">我的简历</a-menu-item>
                  <a-menu-item @click="goUserCenter('myPostView')">应聘记录</a-menu-item>
                  <a-menu-item @click="goUserCenter('myOfferView')">我的Offer</a-menu-item>
                </template>
                <a-menu-divider />
                <a-menu-item @click="goUserCenter('userInfoEditView')">编辑资料</a-menu-item>
                <a-menu-item @click="goUserCenter('securityView')">账号安全</a-menu-item>
                <a-menu-divider />
                <a-menu-item @click="handleLogout" class="text-red-500">
                  <LogoutOutlined class="mr-1" />退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
        <template v-else>
          <button
            class="bg-primary text-white text-sm font-medium rounded-full px-5 h-8 border-none cursor-pointer hover:bg-primary-hover transition-colors"
            @click="router.push('/index/login')"
          >登录</button>
          <button
            class="text-text-secondary text-sm rounded-full px-5 h-8 border border-border cursor-pointer bg-transparent hover:text-primary hover:border-primary transition-colors"
            @click="router.push('/index/register')"
          >注册</button>
        </template>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="pt-14">
      <router-view />
    </main>

    <!-- 底栏 -->
    <footer class="text-center text-text-muted text-sm py-6">
      <a class="text-primary mx-4" href="/admin/login" target="_blank">后台管理</a>
      <span class="mx-4">智慧招聘系统 ©2024</span>
    </footer>
  </div>
</template>
