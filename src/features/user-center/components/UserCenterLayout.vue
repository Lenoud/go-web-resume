<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/infrastructure/store/auth'
import { ROLE } from '@/shared/utils/constants'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const currentKey = computed(() => {
  const path = route.path
  const match = path.match(/\/index\/usercenter\/(\w+)$/)
  return match?.[1] ?? ''
})

function goMenu(name: string) {
  router.push(`/index/usercenter/${name}`)
}

function isActive(key: string) {
  return currentKey.value === key
}

const menuGroups = computed(() => {
  const groups: { title: string; items: { key: string; label: string; icon: string }[] }[] = []

  if (auth.currentUserRole === ROLE.HR) {
    groups.push({
      title: '招聘中心',
      items: [
        { key: 'myJobView', label: '岗位管理', icon: 'briefcase' },
        { key: 'companyPostView', label: '投递管理', icon: 'inbox' },
        { key: 'resumeManagementView', label: '简历快照管理', icon: 'file-text' },
        { key: 'offerView', label: 'Offer管理', icon: 'gift' },
        { key: 'talentPoolView', label: '人才库', icon: 'users' },
      ],
    })
  } else {
    groups.push({
      title: '求职中心',
      items: [
        { key: 'resumeEditView', label: '我的简历', icon: 'file-text' },
        { key: 'myPostView', label: '应聘记录', icon: 'send' },
        { key: 'myInterviewView', label: '面试通知', icon: 'message-square' },
        { key: 'myOfferView', label: '我的Offer', icon: 'gift' },
      ],
    })
  }

  groups.push({
    title: '个人设置',
    items: [
      { key: 'userInfoEditView', label: '编辑资料', icon: 'user' },
      { key: 'securityView', label: '账号安全', icon: 'shield' },
    ],
  })

  return groups
})

const iconPaths: Record<string, string> = {
  briefcase: 'M2 7a2 2 0 012-2h6l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z',
  inbox: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 12h-6l-2 3h-4l-2-3H2',
  'file-text': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  gift: 'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
  'message-square': 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto py-[72px] px-6 flex gap-5 items-start">
    <!-- Left sidebar -->
    <div class="w-[240px] shrink-0 bg-white rounded-xl border border-border-light overflow-hidden">
      <!-- User card -->
      <div class="flex items-center p-4 pb-0">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold mr-4 shrink-0">
          {{ (auth.username || '?')[0]!.toUpperCase() }}
        </div>
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-text-primary m-0 truncate">{{ auth.username }}</h2>
          <div class="text-xs text-text-muted mt-1">
            <a-tag :color="auth.currentUserRole === ROLE.HR ? 'blue' : 'green'" size="small">
              {{ auth.currentUserRole === ROLE.HR ? 'HR' : '求职者' }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- Menu groups -->
      <div v-for="group in menuGroups" :key="group.title" class="border-t border-border-light mt-4">
        <div class="px-5 pt-4 pb-2">
          <div class="text-sm font-semibold text-text-primary">{{ group.title }}</div>
        </div>
        <div class="px-3 pb-3">
          <div
            v-for="item in group.items" :key="item.key"
            class="relative flex items-center h-11 px-3 rounded-lg cursor-pointer transition-colors text-sm"
            :class="isActive(item.key)
              ? 'bg-primary-light text-primary font-medium'
              : 'text-text-primary hover:bg-bg-hover hover:text-primary'"
            @click="goMenu(item.key)"
          >
            <!-- Active indicator bar -->
            <div
              v-if="isActive(item.key)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r"
            />
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="mr-2.5 shrink-0 opacity-60"
            >
              <path v-if="iconPaths[item.icon]" :d="iconPaths[item.icon]" />
            </svg>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right content -->
    <div class="flex-1 min-w-0">
      <router-view />
    </div>
  </div>
</template>
