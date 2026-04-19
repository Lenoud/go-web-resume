<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons-vue'
import { useAuthStore } from '@/infrastructure/store/auth'
import { ROLE } from '@/shared/utils/constants'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const currentMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/index/usercenter')) return 'usercenter'
  if (path.startsWith('/index/detail')) return 'home'
  if (path === '/index/home' || path === '/index' || path === '/') return 'home'
  return ''
})

const navItems = computed(() => {
  const items = [
    { key: 'home', label: '首页' },
  ]
  if (auth.isUserLoggedIn) {
    items.push({ key: 'usercenter', label: '用户中心' })
  }
  return items
})

function handleNav({ key }: { key: string | number }) {
  if (key === 'home') {
    router.push('/index/home')
  } else if (key === 'usercenter') {
    if (auth.currentUserRole === ROLE.HR) {
      router.push('/index/usercenter/myJobView')
    } else {
      router.push('/index/usercenter/myPostView')
    }
  }
}

function handleLogout() {
  auth.logout(false)
  router.push('/index/home')
}
</script>

<template>
  <a-layout class="min-h-screen">
    <!-- 顶栏 -->
    <a-layout-header class="bg-white px-8 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-8">
        <h1
          class="text-xl font-bold text-primary m-0 cursor-pointer"
          @click="router.push('/index/home')"
        >
          智慧招聘系统
        </h1>
        <a-menu
          mode="horizontal"
          :selected-keys="[currentMenu]"
          @click="handleNav"
          :items="navItems"
          class="border-none"
        />
      </div>

      <div class="flex items-center gap-3">
        <template v-if="auth.isUserLoggedIn">
          <a-avatar :size="32">
            <template #icon><UserOutlined /></template>
          </a-avatar>
          <span class="text-gray-600">{{ auth.username }}</span>
          <a-tag :color="auth.currentUserRole === ROLE.HR ? 'blue' : 'green'">
            {{ auth.currentUserRole === ROLE.HR ? 'HR' : '求职者' }}
          </a-tag>
          <a-button type="text" size="small" @click="handleLogout">
            <template #icon><LogoutOutlined /></template>
            退出
          </a-button>
        </template>
        <template v-else>
          <a-button type="primary" @click="router.push('/index/login')">登录</a-button>
          <a-button @click="router.push('/index/register')">注册</a-button>
        </template>
      </div>
    </a-layout-header>

    <!-- 内容区 -->
    <a-layout-content class="bg-gray-50">
      <router-view />
    </a-layout-content>

    <!-- 底栏 -->
    <a-layout-footer class="text-center text-gray-400 text-sm">
      智慧招聘系统 ©2024
    </a-layout-footer>
  </a-layout>
</template>
