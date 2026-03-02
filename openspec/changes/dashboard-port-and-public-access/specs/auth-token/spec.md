## ADDED Requirements

### Requirement: 启动时生成或接收 auth_token
服务器 SHALL 支持 `--auth-token <value>` 命令行参数。若未指定，SHALL 使用 `secrets.token_urlsafe(32)` 自动生成一个随机 token。启动时 SHALL 将 token 值打印到控制台输出。

#### Scenario: 手动指定 token
- **WHEN** 用户运行 `python3 dashboard/server.py --auth-token my-secret-123`
- **THEN** 服务器 SHALL 使用 `my-secret-123` 作为认证 token

#### Scenario: 自动生成 token
- **WHEN** 用户运行 `python3 dashboard/server.py` 不带 `--auth-token` 参数
- **THEN** 服务器 SHALL 自动生成一个随机 token 并打印到控制台

### Requirement: API 请求须携带有效 token
所有 `/api/*` 端点（除 `/api/auth/verify` 外）SHALL 要求请求携带有效的认证 token。token SHALL 通过以下两种方式之一传递：
1. 请求头 `Authorization: Bearer <token>`
2. URL 查询参数 `?token=<token>`

#### Scenario: 有效 token 通过 Header 传递
- **WHEN** 客户端发送请求 `GET /api/live-status` 并在 Header 中携带 `Authorization: Bearer <正确token>`
- **THEN** 服务器 SHALL 正常返回数据

#### Scenario: 有效 token 通过查询参数传递
- **WHEN** 客户端发送请求 `GET /api/live-status?token=<正确token>`
- **THEN** 服务器 SHALL 正常返回数据

#### Scenario: 缺少 token
- **WHEN** 客户端发送请求 `GET /api/live-status` 未携带 token
- **THEN** 服务器 SHALL 返回 HTTP 401 和 `{"ok": false, "error": "未授权"}`

#### Scenario: 错误 token
- **WHEN** 客户端发送请求 `GET /api/live-status` 携带错误的 token
- **THEN** 服务器 SHALL 返回 HTTP 401 和 `{"ok": false, "error": "未授权"}`

### Requirement: 认证验证端点
服务器 SHALL 提供 `GET /api/auth/verify` 端点，用于前端验证 token 是否有效。该端点本身 SHALL 要求携带 token。

#### Scenario: 验证有效 token
- **WHEN** 客户端发送 `GET /api/auth/verify` 并携带正确的 token
- **THEN** 服务器 SHALL 返回 `{"ok": true}`

#### Scenario: 验证无效 token
- **WHEN** 客户端发送 `GET /api/auth/verify` 并携带错误的 token
- **THEN** 服务器 SHALL 返回 HTTP 401

### Requirement: 免认证路径
以下路径 SHALL 免除 token 认证：
- `/healthz` — 健康检查
- 所有非 `/api/` 开头的路径 — 静态资源和 SPA 页面

#### Scenario: 健康检查免认证
- **WHEN** 客户端发送 `GET /healthz` 不携带 token
- **THEN** 服务器 SHALL 正常返回健康状态

#### Scenario: 静态资源免认证
- **WHEN** 客户端发送 `GET /` 或 `GET /assets/index.js` 不携带 token
- **THEN** 服务器 SHALL 正常返回静态文件

### Requirement: 前端 token 输入门控
前端 SHALL 在加载时检查 localStorage 中是否有已保存的 token，并调用 `/api/auth/verify` 验证。未认证时 SHALL 显示 token 输入界面，验证通过后 SHALL 保存 token 到 localStorage 并渲染主看板。

#### Scenario: 首次访问显示 token 输入
- **WHEN** 用户首次打开看板，localStorage 中无 token
- **THEN** 前端 SHALL 显示 token 输入框

#### Scenario: 输入正确 token 进入看板
- **WHEN** 用户在输入框中输入正确的 token 并提交
- **THEN** 前端 SHALL 保存 token 到 localStorage 并显示主看板

#### Scenario: 输入错误 token 提示错误
- **WHEN** 用户在输入框中输入错误的 token 并提交
- **THEN** 前端 SHALL 显示错误提示，不进入看板

#### Scenario: 已缓存 token 自动进入
- **WHEN** 用户打开看板，localStorage 中已有有效 token
- **THEN** 前端 SHALL 自动验证并直接进入主看板

### Requirement: 前端所有 API 请求自动携带 token
前端 `api.ts` 中的 `fetchJ` / `postJ` 函数 SHALL 自动从 localStorage 读取 token 并附加到请求头 `Authorization: Bearer <token>` 中。

#### Scenario: API 请求自动携带 token
- **WHEN** 前端调用任意 API（如 `api.liveStatus()`）
- **THEN** 请求 SHALL 自动包含 `Authorization: Bearer <token>` 头

#### Scenario: token 失效时跳转到登录
- **WHEN** 任意 API 请求返回 HTTP 401
- **THEN** 前端 SHALL 清除 localStorage 中的 token 并显示 token 输入界面
