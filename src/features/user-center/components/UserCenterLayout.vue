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
  const groups: { title: string; items: { key: string; label: string }[] }[] = []

  if (auth.currentUserRole === ROLE.HR) {
    groups.push({
      title: '招聘中心',
      items: [
        { key: 'myJobView', label: '岗位管理' },
        { key: 'companyPostView', label: '投递管理' },
        { key: 'resumeManagementView', label: '简历快照管理' },
        { key: 'offerView', label: 'Offer管理' },
        { key: 'talentPoolView', label: '人才库' },
      ],
    })
  } else {
    groups.push({
      title: '求职中心',
      items: [
        { key: 'resumeEditView', label: '我的简历' },
        { key: 'myPostView', label: '应聘记录' },
        { key: 'myInterviewView', label: '面试通知' },
        { key: 'myOfferView', label: '我的Offer' },
      ],
    })
  }

  groups.push({
    title: '个人设置',
    items: [
      { key: 'userInfoEditView', label: '编辑资料' },
      { key: 'securityView', label: '账号安全' },
    ],
  })

  return groups
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto py-[72px] px-6 flex gap-5 items-start">
    <!-- 左侧个人信息卡 -->
    <div class="w-[240px] shrink-0 border border-border-light bg-white">
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

      <div class="border-t border-border-light mt-4" v-for="group in menuGroups" :key="group.title">
        <div class="px-4 pt-4 pb-2">
          <div class="text-sm font-semibold text-text-primary">{{ group.title }}</div>
        </div>
        <div class="px-4 pb-2">
          <div
            v-for="item in group.items" :key="item.key"
            class="border-t border-dashed border-border-light flex items-center h-12 cursor-pointer hover:text-primary transition-colors"
            :class="isActive(item.key) ? 'text-primary font-medium' : 'text-text-primary'"
            @click="goMenu(item.key)"
          >
            <span class="text-sm">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="flex-1 min-w-0">
      <router-view />
    </div>
  </div>
</template>
