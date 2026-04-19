<script setup lang="ts">
import { reactive } from 'vue'
import { useAdminLogin } from '../composables/useAdminLogin'

const { mutate: login, isPending } = useAdminLogin()

const formState = reactive({
  username: '',
  password: '',
})

function handleSubmit() {
  if (!formState.username || !formState.password) return
  login(formState)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-96 p-8 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold text-center mb-8 text-primary">
        智慧招聘 · 管理后台
      </h1>

      <a-form :model="formState" :label-col="{ span: 0 }" @finish="handleSubmit">
        <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input
            v-model:value="formState.username"
            placeholder="用户名"
            size="large"
          />
        </a-form-item>

        <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password
            v-model:value="formState.password"
            placeholder="密码"
            size="large"
            @press-enter="handleSubmit"
          />
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="isPending"
            block
            size="large"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>
