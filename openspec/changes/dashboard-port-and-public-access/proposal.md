## Why

看板服务器当前默认端口为 7891，默认绑定 `127.0.0.1` 仅允许本机访问。需要将端口改为 19527，并将默认绑定地址改为 `0.0.0.0` 以支持公网/局域网远程访问看板。由于开放了公网访问，需要增加 auth_token 认证机制防止未授权访问。

## What Changes

- 将 `dashboard/server.py` 的默认端口从 `7891` 改为 `19527`
- 将默认绑定 host 从 `127.0.0.1` 改为 `0.0.0.0`，接受所有网络接口的连接
- 更新代码中所有硬编码的 `7891` 端口引用（CORS 默认源、文档注释、飞书推送链接等）
- 新增 `--auth-token` 启动参数，支持手动指定或随机生成 token
- 后端所有 `/api/*` 请求需携带 `Authorization: Bearer <token>` 才能访问
- 前端新增 token 输入页面，验证通过后进入看板；token 保存在 localStorage

## Capabilities

### New Capabilities

- `public-network-access`: 看板服务器支持公网访问，默认监听 `0.0.0.0:19527`
- `auth-token`: 基于 Bearer Token 的简单认证机制，保护看板 API 不被未授权访问

### Modified Capabilities

（无已有 spec 需要修改）

## Impact

- **代码**: `dashboard/server.py` — 端口/host 默认值、认证中间件、token 生成逻辑
- **前端**: `edict/frontend/src/api.ts` — 请求头注入 token；新增 token 输入界面组件；`App.tsx` 增加认证门控
- **依赖**: 无新增外部依赖（使用 Python 标准库 `secrets` 生成 token）
- **安全**: auth_token 认证防止公网未授权访问；token 在启动时输出到控制台供用户使用
