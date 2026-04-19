<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/infrastructure/store/auth'
import { ROLE } from '@/shared/utils/constants'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const activeMenu = computed(() => {
  const path = route.path
  const match = path.match(/\/usercenter\/(\w+)$/)
  return match?.[1] ?? ''
})

const isHR = computed(() => auth.currentUserRole === ROLE.HR)

const menuItems = computed(() => {
  if (isHR.value) {
    return [
      { key: 'myJobView', label: '我的职位' },
      { key: 'companyPostView', label: '投递管理' },
      { key: 'resumeManagementView', label: '简历管理' },
      { key: 'offerView', label: 'Offer管理' },
      { key: 'talentPoolView', label: '人才库' },
    ]
  }
  return [
    { key: 'myPostView', label: '我的投递' },
    { key: 'myInterviewView', label: '我的面试' },
    { key: 'myOfferView', label: '我的Offer' },
    { key: 'resumeEditView', label: '我的简历' },
  ]
})

const commonItems = [
  { key: 'userInfoEditView', label: '个人信息' },
  { key: 'securityView', label: '安全设置' },
]

function handleMenuClick({ key }: { key: string | number }) {
  router.push(`/index/usercenter/${key}`)
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <div class="flex gap-6">
      <!-- 侧边栏 -->
      <div class="w-48 shrink-0">
        <a-menu
          mode="inline"
          :selected-keys="[activeMenu]"
          :items="[...menuItems, ...commonItems]"
          @click="handleMenuClick"
          class="border-r-0"
        />
      </div>

      <!-- 内容区 -->
      <div class="flex-1 min-w-0">
        <router-view />
      </div>
    </div>
  </div>
</template>
