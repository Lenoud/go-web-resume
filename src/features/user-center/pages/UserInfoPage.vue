<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useUserInfo, useUpdateUserInfo } from '../composables/useUserCenter.js'
import { useAuthStore } from '@/infrastructure/store/auth'

const auth = useAuthStore()
const { userInfo, loading } = useUserInfo()
const updateMutation = useUpdateUserInfo()

const formState = reactive({
  id: '',
  nickname: '',
  email: '',
  mobile: '',
  pushEmail: '',
  pushSwitch: '',
})

watch(userInfo, (info) => {
  if (info) {
    formState.id = auth.userId
    formState.nickname = info.nickname ?? ''
    formState.email = info.email ?? ''
    formState.mobile = info.mobile ?? ''
    formState.pushEmail = info.pushEmail ?? ''
    formState.pushSwitch = info.pushSwitch ?? ''
  }
}, { immediate: true })

function handleSubmit() {
  updateMutation.mutate({ ...formState })
}
</script>

<template>
  <div class="bg-white rounded-lg p-6">
    <h2 class="text-lg font-medium mb-6">个人信息</h2>
    <a-spin :spinning="loading">
      <a-form :label-col="{ span: 4 }" class="max-w-lg">
        <a-form-item label="用户名">
          <span class="text-text-secondary">{{ auth.username }}</span>
        </a-form-item>
        <a-form-item label="昵称">
          <a-input v-model:value="formState.nickname" />
        </a-form-item>
        <a-form-item label="邮箱">
          <a-input v-model:value="formState.email" />
        </a-form-item>
        <a-form-item label="手机">
          <a-input v-model:value="formState.mobile" />
        </a-form-item>
        <a-form-item label="推送邮箱">
          <a-input v-model:value="formState.pushEmail" />
        </a-form-item>
        <a-form-item label="推送开关">
          <a-select v-model:value="formState.pushSwitch">
            <a-select-option value="1">开启</a-select-option>
            <a-select-option value="0">关闭</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :wrapper-col="{ offset: 4 }">
          <a-button type="primary" :loading="updateMutation.isPending.value" @click="handleSubmit">
            保存
          </a-button>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>
