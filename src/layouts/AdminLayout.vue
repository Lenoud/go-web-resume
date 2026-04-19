<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/infrastructure/store/auth'
import { useAppStore } from '@/infrastructure/store/app'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const app = useAppStore()

const selectedKeys = computed(() => {
  const path = route.path
  const match = path.match(/^\/admin\/(\w+)/)
  return match?.[1] ? [match[1]] : ['job']
})

const menuItems = [
  { key: 'job', label: '职位管理' },
  { key: 'resume', label: '简历管理' },
  { key: 'resumeSnapshot', label: '简历快照' },
  { key: 'talentPool', label: '人才库' },
  { key: 'company', label: '公司管理' },
  { key: 'user', label: '用户管理' },
  { key: 'department', label: '部门管理' },
  { key: 'offer', label: 'Offer管理' },
  { key: 'opLog', label: '操作日志' },
]

function handleMenuClick({ key }: { key: string | number }) {
  router.push(`/admin/${key}`)
}

function handleLogout() {
  auth.logout(true)
  router.push('/admin/login')
}
</script>

<template>
  <a-layout class="min-h-screen">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="app.sidebarCollapsed"
      collapsible
      :trigger="null"
      class="bg-white"
    >
      <div class="h-16 flex items-center justify-center border-b border-gray-100">
        <h1 v-if="!app.sidebarCollapsed" class="text-lg font-bold text-primary m-0">
          智慧招聘
        </h1>
        <h1 v-else class="text-base font-bold text-primary m-0">招聘</h1>
      </div>
      <a-menu
        mode="inline"
        :selected-keys="selectedKeys"
        @click="handleMenuClick"
        :items="menuItems"
      />
    </a-layout-sider>

    <a-layout>
      <!-- 顶栏 -->
      <a-layout-header class="bg-white px-6 flex items-center justify-between shadow-sm">
        <component
          :is="app.sidebarCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
          class="text-xl cursor-pointer"
          @click="app.toggleSidebar()"
        />
        <div class="flex items-center gap-3">
          <span class="text-gray-600">{{ auth.adminUsername || '管理员' }}</span>
          <a-button type="text" @click="handleLogout">
            <template #icon><LogoutOutlined /></template>
            退出
          </a-button>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="m-4 p-6 bg-white rounded-lg min-h-0 overflow-auto">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
