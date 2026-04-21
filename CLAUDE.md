# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install              # 安装依赖
pnpm dev                  # 启动开发服务器（端口 3000，代理到后端 9100）
pnpm build                # 类型检查 + 生产构建
pnpm typecheck            # 仅类型检查（vue-tsc）
pnpm lint                 # ESLint 检查
pnpm lint:fix             # ESLint 自动修复
pnpm generate:swagger:named  # 用 job.api 命名元数据后处理 swagger.json → swagger.named.json
pnpm generate:client         # 先 postprocess 再基于 swagger.named.json 生成 axios 客户端
```

后端必须先启动（`cd ../api && scripts/dev.sh`），前端 dev server 通过 Vite proxy 将 `/api/*` 转发到 `127.0.0.1:9100`。

## Architecture

### 技术栈

Vue 3.5 + TypeScript 5.7（strict、禁止显式 `any`）+ Ant Design Vue 4（按需自动导入）+ Tailwind CSS 4 + Pinia 3 + TanStack Vue Query 5 + @hey-api/openapi-ts（从 Swagger 自动生成类型化 SDK）。

### 分层：client → composable → page

```
src/client/               ← 自动生成，勿手改（ESLint 已忽略）
     ↓
src/features/xxx/composables/useXxx.ts   ← 业务逻辑，TanStack Query 缓存
     ↓
src/features/xxx/pages/XxxPage.vue       ← 纯展示，调用 composable
```

### 目录结构要点

```
src/
├── client/                # @hey-api/openapi-ts 自动生成的 SDK
├── features/              # 按业务领域划分的模块
│   ├── auth/              #   登录注册（管理员登录 / 前台登录 / 注册）
│   ├── job/               #   职位（前台列表/详情 + 管理后台）
│   ├── resume/            #   简历（编辑页含文件上传）
│   ├── post/              #   投递（含 RecruitmentPipeline 组件）
│   ├── interview/         #   面试
│   ├── offer/             #   Offer
│   ├── resume-snapshot/   #   简历快照
│   ├── talent-pool/       #   人才库
│   ├── user-center/       #   用户中心（个人信息、安全设置）
│   ├── company/           #   公司管理
│   ├── department/        #   部门管理
│   ├── oplog/             #   操作日志
│   └── user/              #   用户管理
├── infrastructure/        # 基础设施
│   ├── api/               #   HTTP 客户端、拦截器（token 注入 + 业务错误 throw + 401 跳转）
│   ├── permission/        #   路由守卫 + v-permission 指令
│   ├── query/             #   TanStack Query 插件 + 集中 queryKeys
│   ├── router/            #   路由（admin.ts / frontend.ts 分文件）
│   └── store/             #   Pinia Store（auth / app）
├── layouts/               # AdminLayout / FrontendLayout
└── shared/                # 跨模块共享
    ├── composables/       #   useCrudTable / useConfirmAction
    ├── types/             #   recruitment.ts（招聘 13 状态）
    └── utils/             #   auth.ts / constants.ts

scripts/swagger/              # Swagger 后处理（见 scripts/swagger/README.md）
```

每个 feature 模块内部统一：`components/` → `composables/` → `pages/`。

### 双认证体系

两套独立 token，共存于 localStorage：
- **Admin**（`admin_token`）：`/admin/*` 路由，角色=3，登录接口 `/api/user/login`
- **User**（`user_token`）：`/index/*` 路由，角色=1（求职者）/2（HR），登录接口 `/api/user/userLogin`

请求拦截器根据 `window.location.pathname.startsWith('/admin')` 自动注入对应 token。401/403 时清除对应 token 并跳转登录页。

### 权限系统

路由守卫控制页面访问（`meta.requiresAdminAuth` / `meta.requiresUserAuth` / `meta.roles`），`v-permission` 指令控制按钮显示。权限码定义在 `infrastructure/permission/types.ts`（`PermissionCode` 枚举），角色→权限映射在 `guard.ts`。

### TanStack Query 使用模式

Query keys 集中管理在 `infrastructure/query/query-keys.ts`，层级结构 `[模块, 操作, 参数]`。CRUD 操作后通过 `queryClient.invalidateQueries` 刷新列表。

### useCrudTable 通用逻辑

`shared/composables/useCrudTable.ts` 封装了管理后台表格的完整 CRUD 流程：分页状态、列表查询（含 `normalizePaginated`）、创建/更新/删除 mutation（含自动 invalidate + message 提示）、批量删除。拦截器 + `throwOnError` 已处理错误，composable 内无需检查 `code`。

### 招聘流程 13 状态

定义在 `shared/types/recruitment.ts`，与后端 `common/recruitment_status.go` 保持一致。11 步主流程 + 2 分支（rejected / on_hold）。`STATUS_LABEL` 和 `STATUS_COLOR` 提供中文标签和 AntDV Tag 颜色映射。

### API 客户端生成

修改后端接口后需重新生成：
```bash
pnpm generate:client
```
生成链路：
1. `goctl api swagger`（后端）→ `swagger.json`
2. `pnpm generate:swagger:named` → 用 `job.api` 命名元数据后处理 `swagger.json`，写出 `swagger.named.json`
3. `@hey-api/openapi-ts` → 基于 `swagger.named.json` 生成 `src/client/`

后处理脚本见 `scripts/swagger/`，详细说明见 `scripts/swagger/README.md`。

生成后类型全链路贯通：`CompanyListResp.data` → `CompanyListData` → `CompanyInfo`，无需手写任何 interface。

`swagger.named.json` 位于后端目录，不属于 `web/` 仓库提交内容。脚本兼容 `web/.worktrees/*` 工作区。生成后 `src/client/` 全部覆盖，禁止手动修改。

### 响应处理架构

后端统一信封 `{ code, msg, data, timestamp, trace }`：
- **拦截器**：校验 `code`，非 0/200 直接 throw；注入 token；401/403 清除 token 并跳转
- **SDK**：全局 `throwOnError: true`，错误走 `onError`，成功直接返回 `AxiosResponse<T>`
- **Composable**：`result.data?.data` 一行提取业务数据，类型由生成器保证
- **useCrudTable**：通用 CRUD 表格逻辑，mutation 成功自动 invalidate + message 提示

无需在 composable 中检查 `resp.code`，无需手写 interface，零 `any`。

### 样式约定

Ant Design Vue 组件按需自动导入（`unplugin-vue-components`），无需手动 import。Tailwind CSS 4 与 AntDV 共存，自定义 CSS 变量在 `styles.css`（主色 `#4684e2`）。
