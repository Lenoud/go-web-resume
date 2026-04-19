<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserLogin } from '../composables/useUserLogin'

const router = useRouter()
const { mutate: login, isPending } = useUserLogin()

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
  <div class="min-h-[80vh] flex items-center justify-center py-12">
    <div class="w-96 p-8 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold text-center mb-8 text-primary">
        用户登录
      </h1>

      <a-form :label-col="{ span: 0 }" @finish="handleSubmit">
        <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名/邮箱' }]">
          <a-input
            v-model:value="formState.username"
            placeholder="用户名 / 邮箱"
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

      <div class="text-center">
        <span class="text-gray-400">还没有账号？</span>
        <a-button type="link" @click="router.push('/index/register')">
          立即注册
        </a-button>
      </div>
    </div>
  </div>
</template>
