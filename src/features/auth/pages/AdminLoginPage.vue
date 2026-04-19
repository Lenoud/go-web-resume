<script setup lang="ts">
import { reactive } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
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
  <div class="h-screen relative" style="background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)">
    <!-- 顶栏 -->
    <div class="h-20 px-6 flex items-center">
      <h1 class="text-3xl font-bold text-text-primary m-0">智慧招聘系统</h1>
    </div>

    <!-- 主区域 -->
    <div class="w-full h-[calc(100vh-160px)] bg-cover bg-center bg-no-repeat" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1440 900%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%25%22 stop-color=%22%234684e2%22 stop-opacity=%220.08%22/><stop offset=%22100%25%22 stop-color=%22%234684e2%22 stop-opacity=%220.03%22/></linearGradient></defs><rect fill=%22url(%23g)%22 width=%221440%22 height=%22900%22/></svg>')">
      <div class="absolute right-20 top-1/2 -translate-y-1/2 flex rounded-lg overflow-hidden shadow-[2px_2px_6px_#aaa]">
        <div class="bg-white p-6 w-[420px] select-none">
          <h2 class="text-2xl font-bold text-gray-800 m-0 pb-2">管理员登录</h2>
          <a-form :model="formState" layout="vertical" :hide-required-mark="true" class="mt-6">
            <a-form-item name="username" label="账号" :colon="false">
              <a-input
                v-model:value="formState.username"
                size="large"
                placeholder="请输入登录账号"
                @press-enter="handleSubmit"
              >
                <template #prefix><UserOutlined /></template>
              </a-input>
            </a-form-item>
            <a-form-item name="password" label="密码" :colon="false">
              <a-input
                v-model:value="formState.password"
                type="password"
                size="large"
                placeholder="请输入登录密码"
                @press-enter="handleSubmit"
              >
                <template #prefix><LockOutlined /></template>
              </a-input>
            </a-form-item>
            <a-form-item class="pt-6">
              <a-button
                class="admin-login-btn"
                type="primary"
                :loading="isPending"
                size="large"
                block
                @click="handleSubmit"
              >登录</a-button>
            </a-form-item>
          </a-form>
        </div>
      </div>
    </div>

    <!-- 底栏 -->
    <footer class="h-20" />
  </div>
</template>

<style scoped>
.admin-login-btn {
  background: linear-gradient(128deg, #00aaeb, #00c1cd 59%, #0ac2b0 100%) !important;
  border: none !important;
}
.admin-login-btn:hover {
  opacity: 0.9;
}
</style>
