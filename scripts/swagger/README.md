# Swagger Postprocess

后处理 `goctl api swagger` 的输出，将匿名内联响应 schema 提升为具名 `definitions`，让前端代码生成器（`@hey-api/openapi-ts`）产出可复用的 TypeScript 类型。

## 问题

`goctl api swagger` 把 `job.api` 中的命名类型（`CompanyListResp`、`CompanyInfo` 等）拍平为匿名内联 schema。前端生成的 TypeScript 因此只有嵌套的匿名对象类型，无法跨接口复用。

## 方案

三阶段管道：

```
job.api ──解析──→ 命名元数据 ──重写──→ swagger.named.json
swagger.json ─────────────────────────────────────┘
```

1. **解析** `job.api`：提取类型声明、`Data` 字段指向、路由与返回类型映射
2. **重写** `swagger.json`：bottom-up 把匿名 schema 注册到 `definitions`，用 `$ref` 替换
3. **校验**：对每个重写的操作，将 `$ref` 解引用后与原始 schema 做规范化比对，确保结构一致

## 文件结构

```
scripts/swagger/
├── postprocess-swagger.mjs   # CLI 入口：读文件 → 调用解析/重写/校验 → 写出
├── parse-job-api.mjs         # job.api 行式状态机解析器
├── rewrite-swagger.mjs       # Swagger schema 重写引擎
├── project-paths.mjs         # 跨 worktree 的路径解析
├── __fixtures__/              # 测试固件
│   ├── job.api.fixture        # 模拟 job.api 片段
│   └── swagger.fixture.json   # 模拟 swagger.json 片段
└── __tests__/                 # 测试
    ├── parse-job-api.test.mjs
    └── rewrite-swagger.test.mjs
```

## 各模块说明

### `postprocess-swagger.mjs`

CLI 入口，被 `pnpm generate:swagger:named` 调用。流程：

1. 通过 `project-paths.mjs` 定位三个文件
2. 解析 `job.api` → 重写 Swagger → 结构校验
3. 写出 `swagger.named.json`
4. 打印摘要（路由数、definition 数、验证通过数）

### `parse-job-api.mjs`

行式状态机，从 `job.api` 提取两类数据：

- **`typesByName`**：类型名 → 字段列表 + `Data` 字段元信息（`ref` / `array` / `none`）
- **`routes`**：路由列表，含 method、path、operationId、requestType、responseType

支持的语法：
- `type Xxx { ... }` 单类型声明
- `type ( ... )` 分组声明
- `@server ( prefix: /api/xxx; group: xxx )` 路由前缀和分组
- `@handler xxx` → operationId 推导（`group + Handler` 驼峰拼接）
- `get/post /path (Req) returns (Resp)` 路由声明
- `//` 行注释、`/* */` 块注释

### `rewrite-swagger.mjs`

Swagger 2 schema 重写引擎。核心逻辑：

- **bottom-up 提升**：先提升最内层 item schema，再提升包裹它的 ListData，最后提升外层 Resp envelope
- **定义去重**：同名的 schema 用 SHA-256 哈希比较，相同则复用，不同则报错
- **路由匹配**：优先按 `operationId` 匹配，回退到 `METHOD + path` 匹配
- **兼容性校验**：data 形状不匹配（如 `.api` 说 `ref` 但 Swagger 是 `array`）时报错

### `project-paths.mjs`

路径解析工具，向上遍历找到 `web/` 目录（`basename === 'web'` 且兄弟 `../api/job.api` 存在），返回三个文件路径。兼容 `web/.worktrees/*` 工作区。

## 使用

```bash
# 仅生成 swagger.named.json
pnpm generate:swagger:named

# 生成 named swagger + 重新生成前端 client
pnpm generate:client
```

完整生成链路：
```bash
cd ../api && goctl api swagger --api job.api --dir doc/swagger --filename swagger
cd ../web  && pnpm generate:client
```

## 测试

```bash
node --test scripts/swagger/__tests__/*.test.mjs
```

或在项目根目录：
```bash
pnpm test:scripts
```

测试覆盖：
- 类型解析（单声明、分组声明、注释剥离、`Data` 字段推断）
- 路由解析（`@server` prefix/group、operationId 推导）
- Schema 重写（bottom-up 提升、去重、结构一致性校验）
- 错误边界（同名不同结构报错、路由未匹配报错、data 形状不兼容报错）
