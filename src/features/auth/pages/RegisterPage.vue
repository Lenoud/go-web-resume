<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useRegister } from '../composables/useRegister.js'

const router = useRouter()
const { mutate: register, isPending } = useRegister()

const formState = reactive({
  username: '',
  password: '',
  rePassword: '',
  email: '',
  mobile: '',
  nickname: '',
})

function handleSubmit() {
  if (!formState.username || !formState.password || !formState.rePassword) return
  if (formState.password !== formState.rePassword) {
    return
  }
  register(formState)
}

function validateRePassword(_rule: unknown, value: string) {
  return value === formState.password ? Promise.resolve() : Promise.reject('两次密码不一致')
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center py-12">
    <div class="w-96 p-8 bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold text-center mb-8 text-primary">
        用户注册
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
          />
        </a-form-item>

        <a-form-item
          name="rePassword"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validateRePassword },
          ]"
        >
          <a-input-password
            v-model:value="formState.rePassword"
            placeholder="确认密码"
            size="large"
          />
        </a-form-item>

        <a-form-item name="email">
          <a-input
            v-model:value="formState.email"
            placeholder="邮箱（选填）"
            size="large"
          />
        </a-form-item>

        <a-form-item name="nickname">
          <a-input
            v-model:value="formState.nickname"
            placeholder="昵称（选填）"
            size="large"
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
            注册
          </a-button>
        </a-form-item>
      </a-form>

      <div class="text-center">
        <span class="text-gray-400">已有账号？</span>
        <a-button type="link" @click="router.push('/index/login')">
          去登录
        </a-button>
      </div>
    </div>
  </div>
</template>
