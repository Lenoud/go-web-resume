# 智慧招聘系统 - 前端

Vue 3 + TypeScript + Ant Design Vue + Vite 构建的招聘管理系统前端。

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

### 数据规范化

后端统一响应信封 `{ code, msg, data, timestamp, trace }`。拦截器校验 `code`，非 0/200 直接 throw。Composable 层通过 `result.data?.data` 一行提取业务数据，类型由生成器全链路贯通（`CompanyListResp.data` → `CompanyListData` → `CompanyInfo`）。

`shared/composables/useCrudTable` 提供通用 CRUD 表格逻辑，管理后台页面统一使用。
