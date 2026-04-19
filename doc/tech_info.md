# 生产级前端重建 2.0 计划

> 技术栈：Vue 3.5 + Vite 6 + TypeScript 5.7（strict）+ TanStack Vue Query v5 + AntDV 4 + Tailwind CSS v4 + pnpm

## 1. 总览

### 1.1 架构分层

```
┌─────────────────────────────────────────────────────────┐
│  Pages / Views（纯渲染，零业务逻辑）                       │
├─────────────────────────────────────────────────────────┤
│  Composables（业务逻辑、状态编排、CRUD 抽象）              │
├──────────┬──────────────────────────────┬───────────────┤
│ TanStack │          Pinia               │    Vue ref    │
│  Query   │  (auth/app 全局 UI 状态)      │  (组件内状态)  │
│(服务端缓存)│                              │               │
├──────────┴──────────────────────────────┴───────────────┤
│  @hey-api SDK（自动生成的类型化接口函数）                   │
├─────────────────────────────────────────────────────────┤
│  Infrastructure（拦截器、权限引擎、路由守卫）               │
└─────────────────────────────────────────────────────────┘
```

### 1.2 状态管理铁律

| 状态类型 | 归属 | 示例 |
|---------|------|------|
| 服务端数据 | TanStack Query（缓存 + 自动刷新） | 用户列表、职位列表、简历详情 |
| 全局 UI 状态 | Pinia | token、用户角色、侧边栏折叠、主题 |
| 组件内 UI 状态 | `ref` / `reactive` | 弹窗开关、表单输入、选中行 |

### 1.3 质量规则

- **禁止 `any`**：ESLint `@typescript-eslint/no-explicit-any: error`
- **禁止 CSS/Less 文件**：布局用 Tailwind class，复杂 UI 用 AntDV 组件
- **禁止直接 `axios`**：所有请求走 `@hey-api` 生成的 SDK
- **关键操作二次确认**：删除/提交/状态变更必须有 `Popconfirm` + `Message` 提示
- **组件职责单一**：一个文件只做一件事

---

## 2. 项目脚手架

### 2.1 依赖清单

**运行时**：

| 包 | 版本 | 用途 |
|---|------|------|
| `vue` | ^3.5 | 框架 |
| `vue-router` | ^4.5 | 路由 |
| `pinia` | ^3 | 全局状态 |
| `@tanstack/vue-query` | ^5 | 服务端状态 |
| `ant-design-vue` | ^4 | UI 组件库 |
| `@ant-design/icons-vue` | ^7 | 图标 |
| `@vueuse/core` | ^12 | 工具集 |

**开发时**：

| 包 | 版本 | 用途 |
|---|------|------|
| `vite` | ^6 | 构建工具 |
| `@vitejs/plugin-vue` | ^5 | Vue SFC 支持 |
| `tailwindcss` | ^4 | 原子化 CSS |
| `@tailwindcss/vite` | ^4 | Tailwind Vite 插件 |
| `typescript` | ~5.7 | 类型系统 |
| `vue-tsc` | ^2 | Vue TS 类型检查 |
| `eslint` | ^9 | 代码规范 |
| `typescript-eslint` | ^8 | TS ESLint 适配 |
| `eslint-plugin-vue` | ^10 | Vue ESLint 规则 |
| `unplugin-vue-components` | ^0.28 | AntDV 按需导入 |
| `@hey-api/openapi-ts` | ^0.96 | API 客户端生成 |
｜pnpm｜default｜替代npm｜

### 2.2 package.json 关键字段

```jsonc
{
  "name": "recruit-web",
  "private": true,
  "type": "module",  // 必须是 ESM
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "typecheck": "vue-tsc --noEmit",
    "generate:client": "openapi-ts"
  }
}
```

### 2.3 vite.config.ts

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  plugins: [
    vue(),
    tailwindcss(),
    // AntDV 组件按需自动注册
    Components({
      resolvers: [AntDesignVueResolver({ importStyle: false })],
      dts: 'src/infrastructure/components.d.ts',
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      // 顺序重要：/api/user 先匹配，走微服务网关
      '/api/user': { target: 'http://127.0.0.1:9000', changeOrigin: true },
      '/api': { target: 'http://127.0.0.1:9100', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ant-design-vue': ['ant-design-vue', '@ant-design/icons-vue'],
          vue: ['vue', 'vue-router', 'pinia'],
          query: ['@tanstack/vue-query'],
        },
      },
    },
  },
})
```

### 2.4 tsconfig.json

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue", "env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 2.5 eslint.config.ts（ESLint 9 flat config）

```ts
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default tseslint.config(
  // 全局忽略
  { ignores: ['dist/**', 'node_modules/**', 'src/client/**'] },

  // JS 基线
  js.configs.recommended,

  // TS 严格规则
  ...tseslint.configs.strict,

  // Vue 推荐规则
  ...pluginVue.configs['flat/recommended'],

  // Vue 文件解析器
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  // 自定义规则
  {
    files: ['src/**/*.{ts,vue}'],
    rules: {
      // 禁止 any
      '@typescript-eslint/no-explicit-any': 'error',
      // 未使用变量（下划线前缀除外）
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Vue 规则
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
    },
  },
)
```

### 2.6 Tailwind CSS v4 配置

**v4 核心变更**：不再使用 `tailwind.config.ts` 文件。所有配置通过 CSS `@theme` 指令完成。

`src/styles.css`（Tailwind 入口 + AntDV 共存）：

```css
/* 不加载 preflight，防止覆盖 AntDV 样式 */
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);

/* 自定义设计令牌 */
@theme {
  --color-primary: #1677ff;
  --color-primary-hover: #4096ff;
  --color-success: #52c41a;
  --color-warning: #faad14;
  --color-danger: #ff4d4f;

  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;

  --breakpoint-xs: 480px;
  --breakpoint-3xl: 1920px;
}

/* 仅保留 AntDV 必需的基础重置 */
@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
}
```

**关键设计决策**：
- 跳过 `@import "tailwindcss/preflight.css"` — AntDV 自带样式重置，加载 Tailwind Preflight 会覆盖 AntDV 按钮/输入框/表格样式
- 手动保留 `box-sizing: border-box` — 这是 Tailwind Preflight 中唯一需要保留的规则
- 所有自定义主题通过 `@theme` 的 CSS 变量定义，颜色与 AntDV 主色 `#1677ff` 对齐

### 2.7 index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>智慧招聘系统</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

## 3. 目录结构（Feature-based）

```
web/src/
├── client/                          # @hey-api 生成代码（禁止手动编辑）
│
├── app.vue                          # 根组件
├── main.ts                          # 入口
├── styles.css                       # Tailwind 入口（v4 @theme）
│
├── infrastructure/                  # 框架层
│   ├── api/
│   │   ├── client.ts                # 客户端初始化 + 请求/响应拦截器
│   │   ├── interceptors.ts          # Token 注入 + 401 刷新 + 请求队列
│   │   ├── types.ts                 # ApiResponse / PaginatedData
│   │   └── normalize.ts             # 响应规范化
│   ├── router/
│   │   ├── index.ts                 # 实例 + 全局守卫
│   │   ├── admin.ts                 # Admin 路由定义
│   │   ├── frontend.ts              # 前台路由定义
│   │   └── routes.types.ts          # 路由元信息类型
│   ├── query/
│   │   ├── plugin.ts                # VueQueryPlugin 配置
│   │   └── query-keys.ts           # 统一 QueryKey 工厂
│   ├── permission/
│   │   ├── directive.ts             # v-permission 指令
│   │   ├── guard.ts                 # 按钮级权限判断函数
│   │   └── types.ts                 # PermissionCode 枚举
│   └── store/
│       ├── auth.ts                  # 认证 store（双 token + 角色信息）
│       └── app.ts                   # 全局 UI store（侧边栏/主题）
│
├── layouts/
│   ├── AdminLayout.vue              # 管理端：侧边栏 + 顶栏 + 内容区
│   └── FrontendLayout.vue           # 前台：顶栏 + 内容区 + 底栏
│
├── features/                        # 业务功能模块
│   ├── auth/
│   │   ├── composables/
│   │   │   ├── useAdminLogin.ts
│   │   │   ├── useUserLogin.ts
│   │   │   └── useRegister.ts
│   │   └── pages/
│   │       ├── AdminLoginPage.vue
│   │       ├── UserLoginPage.vue
│   │       └── RegisterPage.vue
│   ├── job/
│   │   ├── composables/
│   │   │   └── useJob.ts            # queryOptions + mutations 统一导出
│   │   ├── components/
│   │   │   ├── JobCard.vue
│   │   │   └── JobSelect.vue
│   │   └── pages/
│   │       ├── JobListPage.vue
│   │       ├── JobDetailPage.vue
│   │       └── JobAdminPage.vue
│   ├── post/
│   │   ├── composables/usePost.ts
│   │   ├── components/RecruitmentStatusTag.vue
│   │   └── pages/
│   │       ├── MyPostPage.vue
│   │       ├── CompanyPostPage.vue
│   │       └── PostAdminPage.vue
│   ├── resume/
│   │   ├── composables/useResume.ts
│   │   ├── components/ResumeDrawer.vue
│   │   └── pages/
│   │       ├── ResumeEditPage.vue
│   │       └── ResumeAdminPage.vue
│   ├── resume-snapshot/
│   │   ├── composables/useResumeSnapshot.ts
│   │   └── pages/SnapshotAdminPage.vue
│   ├── company/
│   │   ├── composables/useCompany.ts
│   │   └── pages/CompanyAdminPage.vue
│   ├── department/
│   │   ├── composables/useDepartment.ts
│   │   └── pages/DepartmentAdminPage.vue
│   ├── interview/
│   │   └── composables/useInterview.ts
│   ├── offer/
│   │   ├── composables/useOffer.ts
│   │   └── pages/
│   │       ├── OfferAdminPage.vue
│   │       ├── MyOfferPage.vue
│   │       └── OfferViewPage.vue
│   ├── talent-pool/
│   │   ├── composables/useTalentPool.ts
│   │   └── pages/TalentPoolPage.vue
│   ├── user/
│   │   ├── composables/useUser.ts
│   │   └── pages/UserAdminPage.vue
│   ├── oplog/
│   │   ├── composables/useOpLog.ts
│   │   └── pages/OpLogAdminPage.vue
│   └── user-center/
│       ├── composables/useUserCenter.ts
│       ├── components/UserCenterLayout.vue
│       └── pages/
│           ├── UserInfoPage.vue
│           └── SecurityPage.vue
│
└── shared/                          # 跨模块共享
    ├── composables/
    │   ├── usePagination.ts         # 分页参数管理
    │   ├── useCrudTable.ts          # 通用 CRUD 表格抽象
    │   └── useConfirmAction.ts      # 二次确认 + Message 反馈
    ├── components/
    │   └── CrudTable.vue            # 通用 CRUD 表格组件
    ├── types/
    │   ├── recruitment.ts           # 13 状态枚举 + 状态流转配置
    │   └── index.ts                 # 通用业务类型
    └── utils/
        ├── auth.ts                  # Token 存取 + JWT 解码
        └── constants.ts             # localStorage key + 角色常量
```

---

## 4. 基础设施详解

### 4.1 API 拦截器闭环（client.ts + interceptors.ts）

拦截器分为三层：**请求层**（Token 注入）、**响应层**（业务码校验）、**错误层**（401 处理 + 请求队列）。

`infrastructure/api/interceptors.ts`：

```ts
import type { Client } from '@hey-api/client-fetch'
import { useAuthStore } from '@/infrastructure/store/auth'
import { ADMIN_TOKEN_KEY, USER_TOKEN_KEY } from '@/shared/utils/constants'

/**
 * 请求拦截：Token 注入
 * 根据当前路径自动选择 admin token 或 user token
 */
export function attachRequestInterceptor(client: Client) {
  client.interceptors.request.use((request) => {
    const auth = useAuthStore()
    const isAdminRoute = window.location.pathname.startsWith('/admin')
    const token = isAdminRoute ? auth.adminToken : auth.userToken

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  })
}

/**
 * 响应拦截：业务码校验
 * 后端 code 非 0/200 视为业务错误
 */
export function attachResponseInterceptor(client: Client) {
  client.interceptors.response.use((response) => {
    const body = response.data as Record<string, unknown> | undefined
    if (body && typeof body.code === 'number' && body.code !== 0 && body.code !== 200) {
      const error = new Error(body.msg as string ?? '请求失败')
      ;(error as Error & { code: number }).code = body.code
      throw error
    }
    return response
  })
}

/**
 * 401 拦截器闭环：
 * 1. 捕获 401 → 清除 token → 跳转登录页
 * 2. 无自动刷新（当前后端 JWT 无 refresh token 机制）
 * 3. 如后续后端支持 refresh token，在此处添加：
 *    - 请求队列（pendingRequests）
 *    - 刷新锁（isRefreshing）
 *    - 刷新后重放队列中的请求
 */

// 预留：Refresh Token 队列机制
let isRefreshing = false
let pendingRequests: Array<() => void> = []

export function attachErrorInterceptor(client: Client) {
  client.interceptors.error.use((error, response) => {
    if (response?.status === 401 || response?.status === 403) {
      const auth = useAuthStore()
      const isAdmin = window.location.pathname.startsWith('/admin')

      // 预留：如果有 refresh token
      // if (!isRefreshing) {
      //   isRefreshing = true
      //   return refreshToken().then(newToken => {
      //     isRefreshing = false
      //     pendingRequests.forEach(cb => cb())
      //     pendingRequests = []
      //     // 重放原始请求
      //     return client.request(originalRequest)
      //   })
      // }
      // return new Promise(resolve => {
      //   pendingRequests.push(() => resolve(client.request(originalRequest)))
      // })

      // 当前方案：直接清除 + 跳转
      auth.logout(isAdmin)
      const loginPath = isAdmin ? '/admin/login' : '/index/login'
      window.location.href = `${loginPath}?redirect=${encodeURIComponent(window.location.pathname)}`
    }
    return Promise.reject(error)
  })
}
```

`infrastructure/api/client.ts`：

```ts
import { client } from '@/client/client.gen'
import {
  attachRequestInterceptor,
  attachResponseInterceptor,
  attachErrorInterceptor,
} from './interceptors'

// 初始化客户端
client.setConfig({ baseUrl: '' })

// 注册拦截器（顺序重要）
attachRequestInterceptor(client)
attachResponseInterceptor(client)
attachErrorInterceptor(client)

// 导出供 main.ts 副作用导入
export { client }
```

### 4.2 响应类型 + 规范化

`infrastructure/api/types.ts`：

```ts
/** 后端统一响应信封 */
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data?: T
  timestamp?: number
  trace?: string
}

/** 分页数据结构 */
export interface PaginatedData<T> {
  list: T[]
  total: number
  page?: number
  pageSize?: number
}

/** 业务成功判断 */
export function isSuccess(resp: ApiResponse): boolean {
  return resp.code === 0 || resp.code === 200
}
```

`infrastructure/api/normalize.ts`：

```ts
import type { ApiResponse, PaginatedData } from './types'

/**
 * 后端 data 可能是：
 * 1. { list: T[], total: number } — 标准分页
 * 2. T[] — 裸数组
 * 3. null / undefined — 空值
 */
export function normalizePaginated<T>(raw: unknown): PaginatedData<T> {
  if (Array.isArray(raw)) {
    return { list: raw as T[], total: raw.length }
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    return {
      list: (obj.list ?? []) as T[],
      total: (obj.total ?? 0) as number,
    }
  }
  return { list: [], total: 0 }
}

/** 安全提取 API 响应中的 data 字段 */
export function extractData<T>(response: ApiResponse<T>): T | undefined {
  if (!isSuccess(response)) {
    throw new Error(response.msg || '请求失败')
  }
  return response.data
}
```

### 4.3 TanStack Query 配置

`infrastructure/query/plugin.ts`：

```ts
import type { App } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,         // 30s 内不重新请求
      gcTime: 5 * 60_000,       // 5min 缓存保留
      retry: 1,                  // 仅重试一次
      refetchOnWindowFocus: false,
      throwOnError: false,       // 不抛到全局，由组件处理
    },
    mutations: {
      throwOnError: false,
    },
  },
})

export function installQueryPlugin(app: App) {
  app.use(VueQueryPlugin, { queryClient })
}

export { queryClient }
```

`infrastructure/query/query-keys.ts`（QueryKey 工厂）：

```ts
/**
 * 集中管理所有 QueryKey，避免散落在各处导致冲突。
 * 层级结构：[模块, 操作, 参数]
 */
export const queryKeys = {
  // 用户
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  // 职位
  jobs: {
    all: ['jobs'] as const,
    list: (params?: Record<string, unknown>) => ['jobs', 'list', params] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    categories: ['jobs', 'categories'] as const,
    userJobs: (params?: Record<string, unknown>) => ['jobs', 'user', params] as const,
  },
  // 公司
  companies: {
    all: ['companies'] as const,
    list: (params?: Record<string, unknown>) => ['companies', 'list', params] as const,
  },
  // 部门
  departments: {
    all: ['departments'] as const,
    list: (params?: Record<string, unknown>) => ['departments', 'list', params] as const,
  },
  // 简历
  resumes: {
    all: ['resumes'] as const,
    list: (params?: Record<string, unknown>) => ['resumes', 'list', params] as const,
    detail: (userId: string) => ['resumes', 'detail', userId] as const,
  },
  // 投递
  posts: {
    all: ['posts'] as const,
    list: (params?: Record<string, unknown>) => ['posts', 'list', params] as const,
    userPosts: (userId: string, params?: Record<string, unknown>) => ['posts', 'user', userId, params] as const,
    companyPosts: (companyId: string, params?: Record<string, unknown>) => ['posts', 'company', companyId, params] as const,
    statusLogs: (targetType: string, targetId: string) => ['posts', 'statusLogs', targetType, targetId] as const,
  },
  // 简历快照
  resumeSnapshots: {
    all: ['resumeSnapshots'] as const,
    list: (params?: Record<string, unknown>) => ['resumeSnapshots', 'list', params] as const,
    detail: (id: string) => ['resumeSnapshots', 'detail', id] as const,
  },
  // 人才库
  talentPool: {
    all: ['talentPool'] as const,
    list: (params?: Record<string, unknown>) => ['talentPool', 'list', params] as const,
  },
  // 面试
  interviews: {
    all: ['interviews'] as const,
    list: (postId: string) => ['interviews', postId] as const,
  },
  // Offer
  offers: {
    all: ['offers'] as const,
    list: (params?: Record<string, unknown>) => ['offers', 'list', params] as const,
    detail: (postId: string) => ['offers', 'detail', postId] as const,
  },
  // 操作日志
  opLogs: {
    all: ['opLogs'] as const,
    list: (params?: Record<string, unknown>) => ['opLogs', 'list', params] as const,
    loginLogs: (params?: Record<string, unknown>) => ['opLogs', 'loginLogs', params] as const,
  },
} as const
```

### 4.4 Auth Store（Pinia Setup Store）

`infrastructure/store/auth.ts`：

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  ADMIN_TOKEN_KEY, ADMIN_USER_ID_KEY, ADMIN_USERNAME_KEY,
  USER_TOKEN_KEY, USER_ID_KEY, USERNAME_KEY, USER_ROLE_KEY,
} from '@/shared/utils/constants'

export const useAuthStore = defineStore('auth', () => {
  // ── Admin 状态 ──
  const adminToken = ref(localStorage.getItem(ADMIN_TOKEN_KEY) ?? '')
  const adminUserId = ref(localStorage.getItem(ADMIN_USER_ID_KEY) ?? '')
  const adminUsername = ref(localStorage.getItem(ADMIN_USERNAME_KEY) ?? '')

  // ── User 状态 ──
  const userToken = ref(localStorage.getItem(USER_TOKEN_KEY) ?? '')
  const userId = ref(localStorage.getItem(USER_ID_KEY) ?? '')
  const username = ref(localStorage.getItem(USERNAME_KEY) ?? '')
  const userRole = ref(localStorage.getItem(USER_ROLE_KEY) ?? '1')

  // ── Getters ──
  const isAdminLoggedIn = computed(() => !!adminToken.value)
  const isUserLoggedIn = computed(() => !!userToken.value)
  const currentUserRole = computed(() => userRole.value)

  // ── Actions ──
  function setAdminAuth(data: { token: string; userId: string; username: string }) {
    adminToken.value = data.token
    adminUserId.value = data.userId
    adminUsername.value = data.username
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
    localStorage.setItem(ADMIN_USER_ID_KEY, data.userId)
    localStorage.setItem(ADMIN_USERNAME_KEY, data.username)
  }

  function setUserAuth(data: { token: string; userId: string; username: string; role: string }) {
    userToken.value = data.token
    userId.value = data.userId
    username.value = data.username
    userRole.value = data.role
    localStorage.setItem(USER_TOKEN_KEY, data.token)
    localStorage.setItem(USER_ID_KEY, data.userId)
    localStorage.setItem(USERNAME_KEY, data.username)
    localStorage.setItem(USER_ROLE_KEY, data.role)
  }

  function logout(isAdmin: boolean) {
    if (isAdmin) {
      adminToken.value = ''
      adminUserId.value = ''
      adminUsername.value = ''
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      localStorage.removeItem(ADMIN_USER_ID_KEY)
      localStorage.removeItem(ADMIN_USERNAME_KEY)
    } else {
      userToken.value = ''
      userId.value = ''
      username.value = ''
      userRole.value = '1'
      localStorage.removeItem(USER_TOKEN_KEY)
      localStorage.removeItem(USER_ID_KEY)
      localStorage.removeItem(USERNAME_KEY)
      localStorage.removeItem(USER_ROLE_KEY)
    }
  }

  return {
    adminToken, adminUserId, adminUsername,
    userToken, userId, username, userRole,
    isAdminLoggedIn, isUserLoggedIn, currentUserRole,
    setAdminAuth, setUserAuth, logout,
  }
})
```

### 4.5 路由守卫

`infrastructure/router/routes.types.ts`：

```ts
import type { RouteMeta } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 是否需要 Admin 认证 */
    requiresAdminAuth?: boolean
    /** 是否需要 User 认证 */
    requiresUserAuth?: boolean
    /** 允许访问的角色（空数组 = 不限制） */
    roles?: string[]
    /** 页面标题 */
    title?: string
    /** 按钮级权限白名单（空 = 不限制） */
    permissions?: string[]
  }
}
```

`infrastructure/router/index.ts`：

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/infrastructure/store/auth'
import adminRoutes from './admin'
import frontendRoutes from './frontend'

const router = createRouter({
  history: createWebHistory(),
  routes: [...frontendRoutes, ...adminRoutes],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智慧招聘系统`
  }

  // Admin 路由保护
  if (to.meta.requiresAdminAuth && !auth.isAdminLoggedIn) {
    return { path: '/admin/login', query: { redirect: to.fullPath } }
  }

  // 前台路由保护
  if (to.meta.requiresUserAuth && !auth.isUserLoggedIn) {
    return { path: '/index/login', query: { redirect: to.fullPath } }
  }

  // 角色检查
  const allowedRoles = to.meta.roles
  if (allowedRoles?.length && !allowedRoles.includes(auth.currentUserRole)) {
    // 角色不符时跳转到对应默认页
    return auth.currentUserRole === '2'
      ? { path: '/index/usercenter/myJobView' }
      : { path: '/index/usercenter/myPostView' }
  }
})

export default router
```

### 4.6 按钮级权限引擎

`infrastructure/permission/types.ts`：

```ts
/**
 * 权限码设计：模块:操作
 * 角色决定可访问的路由，权限码控制页面内按钮的显示。
 * 当前系统角色简单（3 种），权限码主要用于区分页面内操作。
 */
export enum PermissionCode {
  // 用户模块
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // 公司模块
  COMPANY_CREATE = 'company:create',
  COMPANY_UPDATE = 'company:update',
  COMPANY_DELETE = 'company:delete',

  // 部门模块
  DEPT_CREATE = 'dept:create',
  DEPT_UPDATE = 'dept:update',
  DEPT_DELETE = 'dept:delete',

  // 职位模块
  JOB_CREATE = 'job:create',
  JOB_UPDATE = 'job:update',
  JOB_DELETE = 'job:delete',

  // 简历模块
  RESUME_CREATE = 'resume:create',
  RESUME_UPDATE = 'resume:update',
  RESUME_DELETE = 'resume:delete',

  // 投递模块
  POST_CREATE = 'post:create',
  POST_UPDATE = 'post:update',
  POST_DELETE = 'post:delete',

  // Offer 模块
  OFFER_CREATE = 'offer:create',
  OFFER_UPDATE = 'offer:update',
  OFFER_DELETE = 'offer:delete',

  // 人才库
  TALENT_ADD = 'talent:add',
  TALENT_REMOVE = 'talent:remove',
  TALENT_UPDATE = 'talent:update',
}
```

`infrastructure/permission/guard.ts`：

```ts
import type { PermissionCode } from './types'

/** 角色 → 权限码映射 */
const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  // 管理员(3)：所有权限
  '3': Object.values(PermissionCode),
  // HR(2)：职位/投递/简历/Offer/人才库 操作权限
  '2': [
    PermissionCode.JOB_CREATE, PermissionCode.JOB_UPDATE, PermissionCode.JOB_DELETE,
    PermissionCode.POST_CREATE, PermissionCode.POST_UPDATE, PermissionCode.POST_DELETE,
    PermissionCode.RESUME_CREATE, PermissionCode.RESUME_UPDATE, PermissionCode.RESUME_DELETE,
    PermissionCode.OFFER_CREATE, PermissionCode.OFFER_UPDATE, PermissionCode.OFFER_DELETE,
    PermissionCode.TALENT_ADD, PermissionCode.TALENT_REMOVE, PermissionCode.TALENT_UPDATE,
  ],
  // 求职者(1)：无管理操作权限
  '1': [],
}

/** 检查当前用户是否拥有指定权限 */
export function hasPermission(code: PermissionCode): boolean {
  const role = localStorage.getItem('USER_ROLE') ?? '1'
  return ROLE_PERMISSIONS[role]?.includes(code) ?? false
}

/** 检查是否拥有任一权限 */
export function hasAnyPermission(...codes: PermissionCode[]): boolean {
  return codes.some(hasPermission)
}
```

`infrastructure/permission/directive.ts`：

```ts
import type { App, Directive } from 'vue'
import { hasPermission } from './guard'
import type { PermissionCode } from './types'

/**
 * v-permission 指令
 * 用法：v-permission="PermissionCode.USER_DELETE"
 * 无权限时移除 DOM 元素（v-if 语义）
 */
export const vPermission: Directive<HTMLElement, PermissionCode> = {
  mounted(el, binding) {
    if (!hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}

/** 注册到 Vue 实例 */
export function registerPermissionDirective(app: App) {
  app.directive('permission', vPermission)
}
```

**页面中的使用方式**：

```vue
<template>
  <a-button v-permission="PermissionCode.USER_CREATE" @click="handleCreate">
    新增用户
  </a-button>

  <a-popconfirm title="确认删除？" @confirm="handleDelete(record.id)">
    <a-button v-permission="PermissionCode.USER_DELETE" type="link" danger>
      删除
    </a-button>
  </a-popconfirm>
</template>
```

### 4.7 main.ts + app.vue

`main.ts`：

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app.vue'
import router from './infrastructure/router'
import { installQueryPlugin } from './infrastructure/query/plugin'
import { registerPermissionDirective } from './infrastructure/permission/directive'

// 副作用：初始化 API 客户端拦截器
import '@/infrastructure/api/client'

// AntDV CSS（全量导入，按需导入由 unplugin-vue-components 处理组件）
import 'ant-design-vue/dist/reset.css'

// Tailwind CSS v4 入口
import './styles.css'

const app = createApp(App)

// 注册顺序：Pinia → Query → Router → Directive
const pinia = createPinia()
app.use(pinia)

installQueryPlugin(app)
registerPermissionDirective(app)

app.use(router)
app.mount('#app')
```

`app.vue`：

```vue
<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN'
</script>

<template>
  <a-config-provider :locale="zhCN">
    <router-view />
  </a-config-provider>
</template>
```

---

## 5. 通用 CRUD 抽象

### 5.1 useCrudTable composable

`shared/composables/useCrudTable.ts`：

```ts
import { ref, computed, type MaybeRef, toValue } from 'vue'
import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/vue-query'
import { message } from 'ant-design-vue'
import type { ApiResponse, PaginatedData } from '@/infrastructure/api/types'
import { normalizePaginated } from '@/infrastructure/api/normalize'

/**
 * 通用 CRUD 表格逻辑封装
 *
 * @param options.queryKey   TanStack Query 缓存键
 * @param options.listFn     列表查询 SDK 函数
 * @param options.createFn   创建 SDK 函数
 * @param options.updateFn   更新 SDK 函数
 * @param options.deleteFn   删除 SDK 函数（接收 ids 字符串）
 */
export function useCrudTable<T extends { id?: string }>(options: {
  queryKey: MaybeRef<QueryKey>
  listFn: (params: Record<string, unknown>) => Promise<{ data?: ApiResponse<PaginatedData<T>> }>
  createFn?: (body: Record<string, unknown>) => Promise<{ data?: ApiResponse }>
  updateFn?: (body: Record<string, unknown>) => Promise<{ data?: ApiResponse }>
  deleteFn?: (ids: string) => Promise<{ data?: ApiResponse }>
}) {
  const queryClient = useQueryClient()

  // ── 分页参数 ──
  const page = ref(1)
  const pageSize = ref(10)
  const keyword = ref('')

  // ── 列表查询 ──
  const listQuery = useQuery({
    queryKey: computed(() => [
      ...toValue(options.queryKey),
      { page: page.value, pageSize: pageSize.value, keyword: keyword.value },
    ]),
    queryFn: async () => {
      const { data } = await options.listFn({
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value || undefined,
      })
      if (!data) throw new Error('列表查询失败')
      return normalizePaginated<T>(data.data)
    },
  })

  // ── 创建 ──
  const createMutation = options.createFn
    ? useMutation({
        mutationFn: (body: Record<string, unknown>) => options.createFn!(body),
        onSuccess: (result) => {
          const resp = result.data
          if (resp && resp.code !== 0 && resp.code !== 200) {
            message.error(resp.msg || '创建失败')
            return
          }
          message.success('创建成功')
          queryClient.invalidateQueries({ queryKey: toValue(options.queryKey) })
        },
        onError: (err: Error) => message.error(err.message || '创建失败'),
      })
    : undefined

  // ── 更新 ──
  const updateMutation = options.updateFn
    ? useMutation({
        mutationFn: (body: Record<string, unknown>) => options.updateFn!(body),
        onSuccess: (result) => {
          const resp = result.data
          if (resp && resp.code !== 0 && resp.code !== 200) {
            message.error(resp.msg || '更新失败')
            return
          }
          message.success('更新成功')
          queryClient.invalidateQueries({ queryKey: toValue(options.queryKey) })
        },
        onError: (err: Error) => message.error(err.message || '更新失败'),
      })
    : undefined

  // ── 删除 ──
  const deleteMutation = options.deleteFn
    ? useMutation({
        mutationFn: (ids: string) => options.deleteFn!(ids),
        onSuccess: (result) => {
          const resp = result.data
          if (resp && resp.code !== 0 && resp.code !== 200) {
            message.error(resp.msg || '删除失败')
            return
          }
          message.success('删除成功')
          queryClient.invalidateQueries({ queryKey: toValue(options.queryKey) })
        },
        onError: (err: Error) => message.error(err.message || '删除失败'),
      })
    : undefined

  // ── 批量删除 ──
  const selectedRowKeys = ref<string[]>([])

  function batchDelete() {
    if (selectedRowKeys.value.length === 0) {
      message.warning('请先选择要删除的项')
      return
    }
    deleteMutation?.mutate(selectedRowKeys.value.join(','))
    selectedRowKeys.value = []
  }

  // ── 导出 ──
  return {
    // 分页
    page, pageSize, keyword,
    // 列表
    listQuery,
    list: computed(() => listQuery.data?.value?.list ?? []),
    total: computed(() => listQuery.data?.value?.total ?? 0),
    loading: computed(() => listQuery.isLoading.value),
    // CRUD
    createMutation,
    updateMutation,
    deleteMutation,
    // 批量
    selectedRowKeys,
    batchDelete,
  }
}
```

### 5.2 Feature Composable 使用示例

`features/company/composables/useCompany.ts`：

```ts
import { useCrudTable } from '@/shared/composables/useCrudTable'
import { queryKeys } from '@/infrastructure/query/query-keys'
import { companyCompanyList, companyCompanyCreate, companyCompanyUpdate, companyCompanyDelete } from '@/client'

export interface CompanyItem {
  id?: string
  title: string
  guimo?: string
  hangye?: string
  description?: string
  location?: string
}

export function useCompanyTable() {
  return useCrudTable<CompanyItem>({
    queryKey: queryKeys.companies.all,
    listFn: async (params) => {
      return companyCompanyList({ query: params as { page?: number; pageSize?: number } })
    },
    createFn: (body) => companyCompanyCreate({ body: body as { title: string; guimo?: string; hangye?: string; description?: string; location?: string } }),
    updateFn: (body) => companyCompanyUpdate({ body: body as { id: string; title?: string; guimo?: string; hangye?: string; description?: string; location?: string } }),
    deleteFn: (ids) => companyCompanyDelete({ body: { ids } }),
  })
}
```

### 5.3 二次确认 + Message 封装

`shared/composables/useConfirmAction.ts`：

```ts
import { message, type ModalFuncProps } from 'ant-design-vue'
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/vue-query'
import type { MaybeRef, toValue } from 'vue'

interface ConfirmActionOptions {
  /** 弹窗标题 */
  title?: string
  /** 弹窗内容 */
  content: string
  /** 确认按钮文字 */
  okText?: string
  /** 成功提示 */
  successMsg?: string
  /** 失败提示 */
  errorMsg?: string
  /** 执行操作的函数 */
  mutationFn: () => Promise<unknown>
  /** 成功后需要失效的 queryKey */
  invalidateKeys?: MaybeRef<QueryKey>[]
  /** 成功后回调 */
  onSuccess?: () => void
}

/**
 * 带二次确认的操作封装
 * 用于删除、状态变更等需要 Popconfirm 确认的场景
 *
 * 使用方式 1：在 Popconfirm 的 @confirm 中调用
 *   const doDelete = useConfirmAction({ ... })
 *   <a-popconfirm @confirm="doDelete()">
 *
 * 使用方式 2：程序化调用（Modal.confirm）
 */
export function useConfirmAction(options: ConfirmActionOptions) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: options.mutationFn,
    onSuccess: () => {
      message.success(options.successMsg ?? '操作成功')
      options.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: toValue(key) })
      })
      options.onSuccess?.()
    },
    onError: (err: Error) => {
      message.error(options.errorMsg ?? err.message ?? '操作失败')
    },
  })

  function execute() {
    mutation.mutate()
  }

  return { execute, mutation }
}
```

---

## 6. 页面组件示例

### 6.1 Admin CRUD 页面模板

以 `CompanyAdminPage.vue` 为例展示标准 CRUD 页面模式：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCompanyTable, type CompanyItem } from '../composables/useCompany'
import { PermissionCode } from '@/infrastructure/permission/types'
import { useConfirmAction } from '@/shared/composables/useConfirmAction'
import { queryKeys } from '@/infrastructure/query/query-keys'

const {
  list, total, loading, page, pageSize, keyword,
  createMutation, updateMutation, deleteMutation,
  selectedRowKeys, batchDelete,
} = useCompanyTable()

// 弹窗状态
const modalVisible = ref(false)
const modalTitle = ref('新增公司')
const editingItem = ref<CompanyItem | null>(null)

// 表单默认值
const formState = ref<CompanyItem>({ title: '' })

function openCreate() {
  modalTitle.value = '新增公司'
  editingItem.value = null
  formState.value = { title: '' }
  modalVisible.value = true
}

function openEdit(record: CompanyItem) {
  modalTitle.value = '编辑公司'
  editingItem.value = record
  formState.value = { ...record }
  modalVisible.value = true
}

function handleSubmit() {
  if (editingItem.value?.id) {
    updateMutation?.mutate({ id: editingItem.value.id, ...formState.value })
  } else {
    createMutation?.mutate({ ...formState.value })
  }
  modalVisible.value = false
}

// 删除确认
function handleDelete(id: string) {
  deleteMutation?.mutate(id)
}

// 表格列定义
const columns = [
  { title: '公司名称', dataIndex: 'title', key: 'title' },
  { title: '规模', dataIndex: 'guimo', key: 'guimo' },
  { title: '行业', dataIndex: 'hangye', key: 'hangye' },
  { title: '地点', dataIndex: 'location', key: 'location' },
  { title: '操作', key: 'action', width: 200 },
]
</script>

<template>
  <div class="p-6">
    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex gap-3">
        <a-input v-model:value="keyword" placeholder="搜索公司" class="w-60" allow-clear />
        <a-button v-permission="PermissionCode.COMPANY_CREATE" type="primary" @click="openCreate">
          新增公司
        </a-button>
        <a-popconfirm
          v-if="selectedRowKeys.length > 0"
          title="确认批量删除选中的公司？"
          @confirm="batchDelete"
        >
          <a-button v-permission="PermissionCode.COMPANY_DELETE" danger>
            批量删除 ({{ selectedRowKeys.length }})
          </a-button>
        </a-popconfirm>
      </div>
    </div>

    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :row-selection="{ selectedRowKeys, onChange: (keys: string[]) => selectedRowKeys = keys }"
      row-key="id"
      :pagination="{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
      @change="(pag: any) => { page = pag.current; pageSize = pag.pageSize }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button v-permission="PermissionCode.COMPANY_UPDATE" type="link" @click="openEdit(record)">
            编辑
          </a-button>
          <a-popconfirm title="确认删除该公司？" @confirm="handleDelete(record.id)">
            <a-button v-permission="PermissionCode.COMPANY_DELETE" type="link" danger>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <a-form :label-col="{ span: 4 }">
        <a-form-item label="公司名称" required>
          <a-input v-model:value="formState.title" />
        </a-form-item>
        <a-form-item label="规模">
          <a-input v-model:value="formState.guimo" />
        </a-form-item>
        <a-form-item label="行业">
          <a-input v-model:value="formState.hangye" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="formState.description" :rows="3" />
        </a-form-item>
        <a-form-item label="地点">
          <a-input v-model:value="formState.location" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
```

---

## 7. 交互规范

### 7.1 二次确认矩阵

| 操作类型 | 确认方式 | 成功提示 | 失败提示 |
|---------|---------|---------|---------|
| 单条删除 | `<a-popconfirm>` | `message.success('删除成功')` | `message.error(错误信息)` |
| 批量删除 | `<a-popconfirm>` | `message.success('删除成功')` | `message.error(错误信息)` |
| 创建 | Modal 内确认按钮 | `message.success('创建成功')` | `message.error(错误信息)` |
| 更新 | Modal 内确认按钮 | `message.success('更新成功')` | `message.error(错误信息)` |
| 状态变更 | `<a-popconfirm>` | `message.success('状态已更新')` | `message.error(错误信息)` |
| 文件上传 | 直接上传 | `message.success('上传成功')` | `message.error(错误信息)` |

### 7.2 Loading 状态管理

- **列表加载**：`a-table` 的 `:loading` 绑定 `listQuery.isLoading`
- **按钮提交**：`a-button` 的 `:loading` 绑定 `mutation.isPending`
- **全局加载**：不使用全局 loading bar，由各组件自行管理

### 7.3 空状态

- 列表为空时显示 `<a-empty description="暂无数据" />`
- 搜索无结果时显示 `<a-empty description="未找到匹配结果" />`

---

## 8. 实施顺序

| 阶段 | 内容 | 文件数 | 验证标准 |
|------|------|--------|---------|
| **P1 脚手架** | package.json + vite.config + tsconfig + eslint + styles.css + index.html + env.d.ts | 7 | `pnpm dev` 启动空白页不崩溃 |
| **P2 基础设施** | client.ts + interceptors + types + normalize + query plugin + query-keys + auth store + constants + router + permission engine | 13 | Token 注入 + 路由守卫 + v-permission 指令生效 |
| **P3 布局** | AdminLayout + FrontendLayout | 2 | 侧边栏/顶栏正确渲染 |
| **P4 Auth** | 登录/注册 pages + composables | 5 | 三种角色登录 + token 存储 + 重定向 |
| **P5 共享层** | useCrudTable + useConfirmAction + CrudTable + Paginator + recruitment types | 5 | CRUD 抽象可复用 |
| **P6 Admin CRUD** | company → department → user → job → resume → resume-snapshot → post → interview → offer → talent-pool → oplog（按依赖序） | ~30 | 每个模块可列表/创建/编辑/删除 |
| **P7 前台功能** | job 公共页 → user-center → post 用户视图 → resume 编辑 → interview/offer 用户视图 | ~15 | 求职者 + HR 两条角色线完整 |

### 验证清单

```bash
pnpm typecheck       # 零 TS 错误
pnpm lint            # 零 ESLint 错误
pnpm build           # 构建成功
```

- 浏览器 `localhost:3000` 可见页面
- 三种角色登录 → token 存储 → 路由跳转正确
- Admin CRUD：列表 → 创建（Modal）→ 编辑（Modal）→ 删除（Popconfirm）→ Message 提示
- `v-permission` 指令正确隐藏无权限按钮
- 前台：职位搜索 → 投递 → 用户中心各子页可访问
