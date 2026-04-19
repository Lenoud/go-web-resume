<script setup lang="ts">
import { reactive } from 'vue'
import { useUpdatePwd } from '../composables/useUserCenter'
import { useAuthStore } from '@/infrastructure/store/auth'

const auth = useAuthStore()
const updatePwd = useUpdatePwd()

const formState = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function validateConfirm(_rule: unknown, value: string) {
  return value === formState.newPassword ? Promise.resolve() : Promise.reject('两次密码不一致')
}

function handleSubmit() {
  if (!formState.oldPassword || !formState.newPassword) return
  updatePwd.mutate({
    userId: auth.userId,
    oldPassword: formState.oldPassword,
    newPassword: formState.newPassword,
  }, {
    onSuccess: () => {
      formState.oldPassword = ''
      formState.newPassword = ''
      formState.confirmPassword = ''
    },
  })
}
</script>

<template>
  <div class="bg-white rounded-lg p-6">
    <h2 class="text-lg font-medium mb-6">修改密码</h2>
    <a-form :model="formState" :label-col="{ span: 4 }" class="max-w-lg" @finish="handleSubmit">
      <a-form-item label="旧密码" name="oldPassword" :rules="[{ required: true, message: '请输入旧密码' }]">
        <a-input-password v-model:value="formState.oldPassword" />
      </a-form-item>
      <a-form-item label="新密码" name="newPassword" :rules="[{ required: true, message: '请输入新密码' }]">
        <a-input-password v-model:value="formState.newPassword" />
      </a-form-item>
      <a-form-item
        label="确认密码"
        name="confirmPassword"
        :rules="[{ required: true, message: '请确认密码' }, { validator: validateConfirm }]"
      >
        <a-input-password v-model:value="formState.confirmPassword" />
      </a-form-item>
      <a-form-item :wrapper-col="{ offset: 4 }">
        <a-button type="primary" html-type="submit" :loading="updatePwd.isPending.value">
          修改密码
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
