<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserLogin } from '../composables/useUserLogin'
import { useRegister } from '../composables/useRegister'

const router = useRouter()
const route = useRoute()
const { mutate: login, isPending: loginPending } = useUserLogin()
const { mutate: register, isPending: registerPending } = useRegister()

const isRegister = ref(route.query.mode === 'register')

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', password: '', rePassword: '' })

function handleLogin() {
  if (!loginForm.username || !loginForm.password) return
  login(loginForm)
}

function handleRegister() {
  if (!registerForm.username || !registerForm.password || !registerForm.rePassword) return
  if (registerForm.password !== registerForm.rePassword) return
  register(registerForm, {
    onSuccess: () => {
      isRegister.value = false
      loginForm.username = registerForm.username
    },
  })
}
</script>

<template>
  <div class="flex" style="height: calc(100vh - 56px)">
    <!-- 左侧品牌面板 -->
    <div
      class="hidden md:flex relative w-[45%] min-w-[400px] items-center justify-center overflow-hidden transition-all duration-700"
      :style="{ background: 'linear-gradient(160deg, #0f1b3d 0%, #1a2f6b 40%, #2a4a9e 70%, #3b6bc7 100%)' }"
    >
      <!-- 网格覆盖 -->
      <div
        class="absolute inset-0"
        style="
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, black 30%, transparent 80%);
        "
      />

      <!-- 登录品牌 -->
      <div v-show="!isRegister" class="relative text-center px-16 z-10">
        <h2 class="text-4xl font-bold text-white m-0 mb-4 tracking-wider">欢迎回来</h2>
        <p class="text-white/65 text-sm leading-relaxed m-0 mb-10 max-w-xs mx-auto">登录你的账号，查看投递进度与最新岗位</p>
        <button
          class="inline-flex items-center gap-2 px-8 py-3 border border-white/30 rounded-full bg-transparent text-white text-sm cursor-pointer hover:bg-white/10 hover:border-white/50 transition-all"
          @click="isRegister = true"
        >没有账号？立即注册 →</button>
      </div>

      <!-- 注册品牌 -->
      <div v-show="isRegister" class="relative text-center px-16 z-10">
        <h2 class="text-4xl font-bold text-white m-0 mb-4 tracking-wider">欢迎加入</h2>
        <p class="text-white/65 text-sm leading-relaxed m-0 mb-10 max-w-xs mx-auto">创建账号，开启你的求职之旅</p>
        <button
          class="inline-flex items-center gap-2 px-8 py-3 border border-white/30 rounded-full bg-transparent text-white text-sm cursor-pointer hover:bg-white/10 hover:border-white/50 transition-all"
          @click="isRegister = false"
        >已有账号？立即登录 →</button>
      </div>
    </div>

    <!-- 右侧表单 -->
    <div class="flex-1 flex items-center justify-center bg-white p-10">
      <div class="w-full max-w-[400px]">
        <!-- 登录表单 -->
        <div v-if="!isRegister">
          <div class="mb-10">
            <h1 class="text-3xl font-bold text-text-primary m-0 mb-2">登录</h1>
            <p class="text-sm text-text-muted m-0">使用邮箱和密码登录</p>
          </div>
          <div class="flex flex-col gap-5">
            <div>
              <label class="block text-[13px] font-medium text-text-secondary mb-2">邮箱</label>
              <div class="flex items-center gap-3 px-4 h-12 border border-border rounded-md bg-white transition-all focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(70,132,226,0.1)]">
                <input v-model="loginForm.username" type="text" placeholder="请输入注册邮箱" class="flex-1 border-none outline-none text-sm text-text-primary bg-transparent h-full placeholder:text-text-muted" @keyup.enter="handleLogin" />
              </div>
            </div>
            <div>
              <label class="block text-[13px] font-medium text-text-secondary mb-2">密码</label>
              <div class="flex items-center gap-3 px-4 h-12 border border-border rounded-md bg-white transition-all focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(70,132,226,0.1)]">
                <input v-model="loginForm.password" type="password" placeholder="请输入密码" class="flex-1 border-none outline-none text-sm text-text-primary bg-transparent h-full placeholder:text-text-muted" @keyup.enter="handleLogin" />
              </div>
            </div>
            <button
              class="w-full h-12 border-none rounded-md bg-primary text-white text-base font-medium cursor-pointer hover:bg-primary-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(70,132,226,0.3)] active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              :disabled="loginPending"
              @click="handleLogin"
            >{{ loginPending ? '登录中...' : '登录' }}</button>
            <div class="text-center text-[13px] text-text-muted md:hidden">
              还没有账号？<a class="text-primary font-medium cursor-pointer hover:underline" @click="isRegister = true">立即注册</a>
            </div>
          </div>
        </div>

        <!-- 注册表单 -->
        <div v-else>
          <div class="mb-10">
            <h1 class="text-3xl font-bold text-text-primary m-0 mb-2">注册</h1>
            <p class="text-sm text-text-muted m-0">创建一个新的账号</p>
          </div>
          <div class="flex flex-col gap-5">
            <div>
              <label class="block text-[13px] font-medium text-text-secondary mb-2">邮箱</label>
              <div class="flex items-center gap-3 px-4 h-12 border border-border rounded-md bg-white transition-all focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(70,132,226,0.1)]">
                <input v-model="registerForm.username" type="text" placeholder="请输入邮箱" class="flex-1 border-none outline-none text-sm text-text-primary bg-transparent h-full placeholder:text-text-muted" />
              </div>
            </div>
            <div>
              <label class="block text-[13px] font-medium text-text-secondary mb-2">密码</label>
              <div class="flex items-center gap-3 px-4 h-12 border border-border rounded-md bg-white transition-all focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(70,132,226,0.1)]">
                <input v-model="registerForm.password" type="password" placeholder="请输入密码" class="flex-1 border-none outline-none text-sm text-text-primary bg-transparent h-full placeholder:text-text-muted" />
              </div>
            </div>
            <div>
              <label class="block text-[13px] font-medium text-text-secondary mb-2">确认密码</label>
              <div class="flex items-center gap-3 px-4 h-12 border border-border rounded-md bg-white transition-all focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(70,132,226,0.1)]">
                <input v-model="registerForm.rePassword" type="password" placeholder="请再次输入密码" class="flex-1 border-none outline-none text-sm text-text-primary bg-transparent h-full placeholder:text-text-muted" @keyup.enter="handleRegister" />
              </div>
            </div>
            <button
              class="w-full h-12 border-none rounded-md bg-primary text-white text-base font-medium cursor-pointer hover:bg-primary-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(70,132,226,0.3)] active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              :disabled="registerPending"
              @click="handleRegister"
            >{{ registerPending ? '注册中...' : '注册' }}</button>
            <div class="text-center text-[13px] text-text-muted md:hidden">
              已有账号？<a class="text-primary font-medium cursor-pointer hover:underline" @click="isRegister = false">立即登录</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
