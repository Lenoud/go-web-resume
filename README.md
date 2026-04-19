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
| 工具 | VueUse 12 | Composition 工具函数 |
| 规范 | ESLint 9 | 严格规则，禁止显式 `any` |

## 目录结构

```
web/
├── src/
│   ├── main.ts                  # 入口
│   ├── app.vue                  # 根组件
│   ├── styles.css               # Tailwind + 自定义主题
│   ├── client/                  # 自动生成的 API 客户端（勿手改）
│   │   ├── index.ts             # 统一导出
│   │   ├── sdk.gen.ts           # API 调用函数
│   │   ├── types.gen.ts         # TypeScript 类型定义
│   │   └── core/                # 客户端核心（认证、序列化等）
│   ├── infrastructure/          # 基础设施（自动生成的组件声明等）
│   └── shared/                  # 共享工具
│       └── utils/
│           ├── auth.ts          # JWT 解码、过期检查
│           └── constants.ts     # 角色、localStorage key 常量
├── vite.config.ts               # Vite 配置（代理、分包）
├── tsconfig.json                # TypeScript 严格模式
├── eslint.config.ts             # ESLint 规则
└── package.json
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 3000，自动代理到后端 9100）
pnpm dev

# 从 Swagger 重新生成 API 客户端
pnpm generate:client
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
| `pnpm generate:client` | 从 Swagger 生成类型化 API 客户端 |

## API 客户端生成

后端 Swagger 文档位于 `../api/doc/swagger/swagger.json`。类型化客户端通过 `@hey-api/openapi-ts` 生成：

```bash
pnpm generate:client
```

生成后 `src/client/` 目录包含：
- `sdk.gen.ts` — 类型化的 API 调用函数
- `types.gen.ts` — 所有请求/响应的 TypeScript 接口
- `client.gen.ts` — 客户端实例（含拦截器）

**注意**：`src/client/` 目录由工具自动生成，禁止手动修改。ESLint 已配置忽略此目录。

## 代理配置

开发服务器将 `/api/*` 请求代理到后端：

```
前端 :3000/api/* → 后端 :9100/api/*
```

## 用户角色

| 角色 | 值 | Token Key | 说明 |
|------|-----|-----------|------|
| 求职者 | `1` | `user_token` | 前台登录 |
| HR | `2` | `user_token` | 前台登录 |
| 管理员 | `3` | `admin_token` | 管理后台登录 |

## 构建优化

Vite 配置了手动分包策略：
- `vue-vendor`：Vue 核心 + Router + Pinia
- `antd`：Ant Design Vue 独立分包
- `vendor`：其余第三方库
