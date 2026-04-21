# 智慧招聘系统 - 前端

Vue 3 + TypeScript + Ant Design Vue + Vite 构建的招聘管理系统前端。

### 核心成果

- **零手写接口**：所有 API 类型由 `@hey-api/openapi-ts` 从 Swagger 自动生成，composable 直接引用生成的 `XxxInfo` / `XxxListData` 类型
- **零页面 code 校验**：拦截器统一处理业务错误码，composable / page 层不检查 `resp.code`
- **零 `any`**：ESLint 严格禁止显式 `any`，全链路类型由生成器保证（`XxxListResp.data` → `XxxListData` → `XxxInfo`）

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3.5 + TypeScript 5.7 | Composition API + `<script setup>` |
| 构建 | Vite 6 | 开发服务器 + 生产构建 |
| UI | Ant Design Vue 4 | 组件库（按需自动导入） |
| 样式 | Tailwind CSS 4 | 原子化 CSS，与 AntDV 共存 |
| 路由 | Vue Router 4 | 客户端路由 |
| 状态 | Pinia 3 + TanStack Vue Query 5 | 本地状态 + 服务端状态 |
| API 客户端 | @hey-api/openapi-ts | 从 Swagger 自动生成类型化 SDK |
| 工具 | VueUse 12 + Day.js | Composition 工具函数 + 日期处理 |
| 规范 | ESLint 9 | 严格规则，禁止显式 `any` |

## 目录结构

```
web/
├── src/
│   ├── main.ts                        # 入口
│   ├── app.vue                        # 根组件
│   ├── styles.css                     # Tailwind + 自定义主题
│   │
│   ├── client/                        # 自动生成的 API 客户端（勿手改）
│   │   ├── client/client.gen.ts       # 客户端实例
│   │   ├── client/types.gen.ts        # TS 类型定义
│   │   ├── client/utils.gen.ts        # 工具函数
│   │   └── core/                      # 客户端核心（认证、序列化等）
│   │
│   ├── features/                      # 业务功能模块（按领域划分）
│   │   ├── auth/                      # 登录注册（管理员/求职者登录、注册）
│   │   ├── company/                   # 公司管理
│   │   ├── department/                # 部门管理
│   │   ├── interview/                 # 面试管理
│   │   ├── job/                       # 职位管理（含前台职位列表/详情）
│   │   ├── offer/                     # Offer 管理
│   │   ├── oplog/                     # 操作日志
│   │   ├── post/                      # 投递管理（含招聘流水线组件）
│   │   ├── resume/                    # 简历管理（含编辑页、附件上传）
│   │   ├── resume-snapshot/           # 简历快照
│   │   ├── talent-pool/               # 人才库
│   │   ├── user/                      # 用户管理
│   │   └── user-center/               # 用户中心（个人信息、安全设置）
│   │
│   ├── layouts/                       # 布局组件
│   │   ├── AdminLayout.vue            # 管理后台布局（侧边栏 + 顶栏）
│   │   └── FrontendLayout.vue         # 前台布局（顶部导航）
│   │
│   ├── infrastructure/                # 基础设施层
│   │   ├── api/                       # HTTP 客户端 + 拦截器 + 响应规范化
│   │   ├── permission/                # 路由守卫 + 权限指令
│   │   ├── query/                     # TanStack Query 插件 + Query Keys
│   │   ├── router/                    # 路由配置（admin / frontend 分文件）
│   │   ├── store/                     # Pinia Store（auth / app）
│   │   └── components.d.ts            # 自动生成的组件声明
│   │
│   └── shared/                        # 共享模块
│       ├── composables/               # 通用 Composable（useCrudTable、useConfirmAction）
│       ├── types/                     # 全局类型（招聘状态等）
│       └── utils/                     # 工具函数（auth、constants）
│
├── vite.config.ts                     # Vite 配置（代理、分包、按需导入）
├── tsconfig.json                      # TypeScript 严格模式
├── eslint.config.ts                   # ESLint 规则
├── openapi-ts.config.ts               # API 客户端生成配置
└── package.json
```

### Feature 模块内部结构

每个 feature 模块遵循统一的分层约定：

```
features/xxx/
├── components/      # 模块专属组件
├── composables/     # 模块逻辑（useXxx）
└── pages/           # 页面组件
```

### 页面路由映射

| 页面文件 | 路由 | 布局 | 说明 |
|----------|------|------|------|
| AdminLoginPage.vue | /admin/login | - | 管理员登录 |
| UserLoginPage.vue | /login | FrontendLayout | 求职者/HR 登录 |
| RegisterPage.vue | /register | FrontendLayout | 注册 |
| JobListPage.vue | /jobs | FrontendLayout | 前台职位列表 |
| JobDetailPage.vue | /jobs/:id | FrontendLayout | 职位详情 |
| MyPostPage.vue | /my/posts | FrontendLayout | 我的投递 |
| MyInterviewPage.vue | /my/interviews | FrontendLayout | 我的面试 |
| MyOfferPage.vue | /my/offers | FrontendLayout | 我的 Offer |
| ResumeEditPage.vue | /resume/edit | FrontendLayout | 简历编辑 |
| UserInfoPage.vue | /user/info | FrontendLayout | 个人信息 |
| SecurityPage.vue | /user/security | FrontendLayout | 安全设置 |
| TalentPoolPage.vue | /talent-pool | FrontendLayout | 人才库 |
| CompanyPostPage.vue | /company/posts | FrontendLayout | 企业投递管理 |
| *AdminPage.vue | /admin/xxx | AdminLayout | 管理后台各模块 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 3000，自动代理到后端 9100）
pnpm dev

# 从 Swagger 重新生成 API 客户端
pnpm generate:client

# 仅生成命名后的 Swagger（写入 ../api/doc/swagger/swagger.named.json）
pnpm generate:swagger:named
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动 Vite 开发服务器（端口 3000） |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览生产构建 |
| `pnpm typecheck` | 仅类型检查 |
| `pnpm lint` | ESLint 检查 |
| `pnpm lint:fix` | ESLint 自动修复 |
| `pnpm generate:swagger:named` | 用 `job.api` 为 Swagger 成功响应补齐命名 schema，并写出 `swagger.named.json` |
| `pnpm generate:client` | 先 postprocess 再从 `swagger.named.json` 生成类型化 API 客户端 |
| `pnpm test:scripts` | 运行 swagger 后处理脚本的单元测试 |

## API 客户端生成

客户端生成分两步执行：

1. `pnpm generate:swagger:named`
   - 读取 `../api/job.api` 作为命名来源
   - 读取 `../api/doc/swagger/swagger.json`
   - 生成 `../api/doc/swagger/swagger.named.json`
   - 写出前会先做一次结构校验，确保命名后的响应 schema 在解引用后与原始 Swagger 保持一致
2. `pnpm generate:client`
   - 先自动执行上面的 postprocess 步骤
   - 再让 `@hey-api/openapi-ts` 基于 `swagger.named.json` 生成 axios 客户端

```bash
pnpm generate:swagger:named
pnpm generate:client
```

`swagger.named.json` 位于后端目录下，不属于 `web/` 仓库提交内容。脚本会自动兼容 `web/.worktrees/*` 形式的隔离工作区，始终定位到真实的兄弟 `api/` 目录。

生成后 `src/client/` 目录包含：
- `client/client.gen.ts` — 客户端实例配置
- `client/types.gen.ts` — 所有请求/响应的 TypeScript 接口（含命名类型：`CompanyInfo`、`JobInfo` 等）
- `client/utils.gen.ts` — 工具函数
- `core/` — 认证、序列化等核心逻辑
- `schemas.gen.ts` — JSON Schema 定义

**注意**：
- `src/client/` 目录由工具自动生成，禁止手动修改。ESLint 已配置忽略此目录。
- 修改后端 `.api` 文件后，先重新产出最新 `swagger.json`，再运行 `pnpm generate:client`。

后处理脚本的详细说明见 `scripts/swagger/README.md`。

## 代理配置

开发服务器将 `/api/*` 请求代理到后端：

```
前端 :3000/api/* → 后端 :9100/api/*
```

## 用户角色

| 角色 | 值 | Token Key | 登录入口 | 说明 |
|------|-----|-----------|----------|------|
| 求职者 | `1` | `user_token` | /login | 前台登录 |
| HR | `2` | `user_token` | /login | 前台登录 |
| 管理员 | `3` | `admin_token` | /admin/login | 管理后台登录 |

## 构建优化

Vite 配置了手动分包策略：
- `vue-vendor`：Vue 核心 + Router + Pinia
- `ant-design-vue`：Ant Design Vue 独立分包
- `query`：TanStack Query 独立分包
- `vendor`：其余第三方库

## 架构约定

### 分层：API → Composable → Page

- **API 层**（`client/`）：自动生成的类型化 SDK，负责数据获取
- **Composable 层**（`features/xxx/composables/`）：封装业务逻辑、TanStack Query 缓存策略
- **Page 层**（`features/xxx/pages/`）：纯展示，调用 composable 获取数据

### 请求全链路运行机制

一个前端请求的完整生命周期：

```
Page 调用 composable
  → composable 调用 SDK 函数（client/ 自动生成）
    → 请求拦截器注入 Token（按 /admin 路径选择 admin_token 或 user_token）
      → axios 发送请求 → Vite proxy 转发到后端 :9100
        → 后端返回信封 { code, msg, data, timestamp, trace }
      → 响应拦截器校验 code（非 0/200 直接 throw Error）
    → SDK throwOnError: true → 错误走 TanStack Query 的 onError，成功走 data
  → composable 通过 result.data?.data 提取业务数据
→ Page 渲染
```

关键设计决策：
- **错误处理归拦截器**：composable / page 不写 `if (resp.code !== 0)` 或 `if (result.error)`
- **Token 自动注入**：请求拦截器根据 `window.location.pathname` 自动选择 admin / user token
- **401/403 闭环**：错误拦截器自动清除 token 并跳转登录页，URL 携带 `redirect` 参数

### 信封响应处理规范

后端统一响应格式 `{ code, msg, data, timestamp, trace }`，前端处理分层：

| 层 | 职责 | 示例 |
|----|------|------|
| 拦截器 | 校验 `code`，非 0/200 throw；注入 token；401/403 清 token 跳登录 | `interceptors.ts` |
| SDK | `throwOnError: true`，错误走 `onError`，成功返回 `AxiosResponse<T>` | `client.gen.ts` |
| Composable | `result.data?.data` 一行提取业务数据 | `const result = await companyList(...)` |
| useCrudTable | 通用 CRUD 表格逻辑，mutation 成功自动 invalidate + message 提示 | `useCrudTable.ts` |

**禁止事项**：
- 禁止在 composable 中检查 `resp.code` 或 `result.error`
- 禁止手写 interface 替代生成类型
- 禁止使用 `any`（ESLint 已强制）

### AntDV 表格类型断言约定

Vue 模板中的表格回调（`customRender`、`bodyCell` slot）无法携带泛型，`record` 类型为 `unknown`。约定：

- **模板回调中**：`record as XxxInfo` 断言是必要的，这是 Vue 模板的已知限制
- **composable / script 中**：禁止 `as` 断言，数据类型由 SDK 返回值和 `useCrudTable<T>` 泛型保证
- **columns 定义**：`dataIndex` 必须与生成类型的字段名一致，否则运行时取不到值

### 双 Token 认证

两套独立 token 共存于 localStorage，由请求拦截器根据路径自动选择：

| 场景 | Token Key | 路由前缀 | 角色 |
|------|-----------|----------|------|
| 管理后台 | `admin_token` | `/admin/*` | 管理员(3) |
| 前台页面 | `user_token` | `/index/*` | 求职者(1) / HR(2) |

**注意**：判断依据是 `window.location.pathname.startsWith('/admin')`，同一浏览器不同标签页同时使用 admin 和 user 登录时，请求拦截器依据各自标签页路径独立工作，不会错乱。

## 风险边界与已知限制

当前架构在 TS 严格模式 + 代码生成 + AntDV + TanStack Query 组合下的合理边界，非 bug：

| 风险点 | 说明 | 影响程度 |
|--------|------|----------|
| `result.data?.data` 可选链静默空值 | 后端正常返回时必有 `data`，空值仅在网络异常时出现（此时走 `onError`） | 低 |
| 模板 `record as XxxInfo` 断言 | Vue 模板无法携带泛型，断言后无运行时校验，字段不匹配会显示空白而非报错 | 低 |
| 生成类型与实际接口漂移 | 后端改了 `.api` 未重新生成前端 client 时发生，`pnpm generate:client` 一条命令解决 | 需流程保证 |
| 部门下拉 `pageSize=100` 假设全量 | 当前部门数远小于 100，超量时需改为滚动加载或专用接口 | 低 |

## 日常维护指南

### 后端接口变更同步流程

后端修改 `job.api` 后，前端必须重新生成客户端：

```bash
# 1. 后端生成 swagger
cd api && goctl api swagger --api job.api --dir doc/swagger --filename swagger

# 2. 前端生成客户端（内部先 postprocess 再生成）
cd web && pnpm generate:client
```

**如果生成类型影响了 composable 层**（如字段重命名、新增必填字段），需同步更新对应 composable。

### 新增管理后台页面的标准流程

1. 后端在 `job.api` 定义类型和路由 → `goctl` 生成 → `goctl api swagger` 生成 Swagger
2. 前端 `pnpm generate:client` 生成 SDK 类型
3. 创建 `features/xxx/composables/useXxx.ts`，使用 `useCrudTable<XxxInfo>` 封装 CRUD
4. 创建 `features/xxx/pages/XxxAdminPage.vue`，调用 composable 渲染表格 + 弹窗
5. 在 `infrastructure/router/admin.ts` 注册路由
6. 在 `layouts/AdminLayout.vue` 添加侧边栏菜单项

### 文件上传模块特殊处理

简历等文件上传模块使用 `multipart/form-data`，需显式设置 `useFormData: true`：

```ts
// resume composable 中
createFn: (body) => resumeCreate(body, { useFormData: true })
```
