## Context

看板服务器 `dashboard/server.py` 当前使用 Python 内置 `http.server` 模块，默认端口 7891、绑定 `127.0.0.1`。端口号 7891 在代码中多处硬编码（默认参数、CORS 白名单、飞书推送按钮链接等）。前端为 React + TypeScript（Vite 构建），通过 `edict/frontend/src/api.ts` 中的 `fetchJ` / `postJ` 封装发起 API 请求，当前无任何认证机制。

## Goals / Non-Goals

**Goals:**
- 默认端口改为 `19527`
- 默认 host 改为 `0.0.0.0`，支持公网/局域网访问
- 保持 `--port` / `--host` 命令行参数可覆盖
- 新增 auth_token 认证：启动时可通过 `--auth-token` 指定或自动随机生成
- 后端 `/api/*` 端点全部受 token 保护
- 前端新增 token 输入页，验证通过后进入看板

**Non-Goals:**
- 不新增 HTTPS / TLS 支持（用户可在前端用 nginx 反代）
- 不做用户体系/多用户管理
- 不做 token 过期/刷新机制（长期有效的静态 token）

## Decisions

### 1. 端口选择 19527
直接采用用户指定的端口号 19527，替换原有的 7891。

### 2. 默认 host 改为 `0.0.0.0`
将 `argparse` 中 `--host` 的默认值从 `127.0.0.1` 改为 `0.0.0.0`，使服务器默认监听所有网络接口。用户仍可通过 `--host 127.0.0.1` 恢复仅本机访问。

### 3. CORS 默认源列表同步更新
`_DEFAULT_ORIGINS` 中硬编码的 `7891` 端口需同步改为 `19527`，确保浏览器跨域请求正常。

### 4. 飞书推送链接更新
`push_to_feishu()` 中的 `http://127.0.0.1:7891` 链接改为 `http://127.0.0.1:19527`。

### 5. Token 认证方案

**后端：**
- 新增 `--auth-token` 参数。若未指定，使用 `secrets.token_urlsafe(32)` 自动生成
- 启动时将 token 打印到控制台，方便用户复制
- 全局变量 `AUTH_TOKEN` 存储当前 token
- 在 `Handler` 的 `do_GET` / `do_POST` 入口处检查：
  - `/healthz` 和静态资源（非 `/api/` 路径）免认证
  - `/api/auth/verify` 免认证（用于前端验证 token）
  - 其余 `/api/*` 请求须携带 `Authorization: Bearer <token>` 或查询参数 `?token=<token>`
  - 认证失败返回 `401 {"ok": false, "error": "未授权"}`
- 新增 `GET /api/auth/verify` 端点：校验请求中的 token，返回 `{"ok": true}` 或 `401`

**前端：**
- `api.ts` 中 `fetchJ` / `postJ` 注入 `Authorization: Bearer <token>` 请求头，token 从 `localStorage` 读取
- 新增 `AuthGate` 组件（在 `App.tsx` 中包裹主内容）：
  - 进入页面时检查 localStorage 中是否有 token，并调用 `/api/auth/verify` 验证
  - 未认证时显示 token 输入框
  - 验证通过后存入 localStorage 并渲染主看板
  - 提供"退出"按钮清除 token
- 新增 `api.verifyToken(token)` 方法

### 6. 选择 Bearer Token 而非 Cookie

Bearer Token 通过请求头传递，不依赖浏览器 Cookie 机制，在无 HTTPS 的场景下更简单直接。同时支持 `?token=` 查询参数方式，方便 API 调试。

## Risks / Trade-offs

- **[安全风险] 绑定 0.0.0.0 暴露服务** → auth_token 认证兜底防护
- **[安全风险] Token 明文传输** → 无 HTTPS 时 token 可被中间人截获；建议生产环境配合 nginx + TLS
- **[兼容性] 已在运行的旧配置可能需要更新** → `--port` / `--host` / `--auth-token` 参数向后兼容
- **[用户体验] 每次首次打开需输入 token** → localStorage 缓存减少重复输入
