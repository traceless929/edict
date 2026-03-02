## 1. 端口与绑定地址修改

- [x] 1.1 将 `main()` 中 `argparse` 的 `--port` 默认值从 `7891` 改为 `19527`
- [x] 1.2 将 `main()` 中 `argparse` 的 `--host` 默认值从 `127.0.0.1` 改为 `0.0.0.0`

## 2. 硬编码端口引用同步更新

- [x] 2.1 更新文件头部文档字符串中的 `Port: 7891` 为 `Port: 19527`
- [x] 2.2 更新 `_DEFAULT_ORIGINS` 中的 `7891` 端口为 `19527`
- [x] 2.3 更新 `cors_headers()` 中 fallback origin 的 `7891` 端口为 `19527`
- [x] 2.4 更新 `push_to_feishu()` 中飞书卡片按钮链接的 `7891` 为 `19527`

## 3. 后端 auth_token 认证

- [x] 3.1 在 `main()` 中新增 `--auth-token` 参数，未指定时用 `secrets.token_urlsafe(32)` 生成
- [x] 3.2 启动时将 token 打印到控制台
- [x] 3.3 新增 `_check_auth(handler)` 函数：从 `Authorization: Bearer` 头或 `?token=` 查询参数提取 token 并校验
- [x] 3.4 在 `do_GET` 和 `do_POST` 入口处对 `/api/*` 路径（除 `/api/auth/verify` 外）调用认证检查，失败返回 401
- [x] 3.5 新增 `GET /api/auth/verify` 端点，校验 token 后返回 `{"ok": true}` 或 401

## 4. 前端 API 层 token 注入

- [x] 4.1 在 `api.ts` 中新增 `getAuthToken()` / `setAuthToken()` / `clearAuthToken()` 函数，操作 localStorage
- [x] 4.2 修改 `fetchJ` / `postJ` 自动从 localStorage 读取 token 并注入 `Authorization: Bearer` 请求头
- [x] 4.3 在 `fetchJ` / `postJ` 中检测 401 响应，触发 token 失效处理
- [x] 4.4 新增 `api.verifyToken(token)` 方法调用 `/api/auth/verify`

## 5. 前端 AuthGate 认证门控

- [x] 5.1 新建 `edict/frontend/src/components/AuthGate.tsx` 组件：包含 token 输入界面和验证逻辑
- [x] 5.2 在 `App.tsx` 中用 `AuthGate` 包裹主内容，未认证时显示输入页、认证后渲染看板

## 6. 验证

- [x] 6.1 在 `dashboard/server.py` 中搜索确认不再有 `7891` 的残留引用
- [x] 6.2 确认无 token 时 `/api/live-status` 返回 401，有 token 时正常返回
