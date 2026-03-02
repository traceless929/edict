## ADDED Requirements

### Requirement: 默认端口为 19527
服务器 SHALL 将默认监听端口从 7891 改为 19527。`--port` 参数的默认值 SHALL 为 19527。

#### Scenario: 无参数启动使用新端口
- **WHEN** 用户运行 `python3 dashboard/server.py` 不带 `--port` 参数
- **THEN** 服务器 SHALL 监听 19527 端口

#### Scenario: 命令行覆盖端口
- **WHEN** 用户运行 `python3 dashboard/server.py --port 8080`
- **THEN** 服务器 SHALL 监听 8080 端口

### Requirement: 默认绑定地址为 0.0.0.0
服务器 SHALL 将默认绑定 host 从 `127.0.0.1` 改为 `0.0.0.0`，以接受来自所有网络接口的连接。

#### Scenario: 无参数启动接受公网访问
- **WHEN** 用户运行 `python3 dashboard/server.py` 不带 `--host` 参数
- **THEN** 服务器 SHALL 绑定 `0.0.0.0`，可从局域网或公网访问

#### Scenario: 命令行覆盖绑定地址
- **WHEN** 用户运行 `python3 dashboard/server.py --host 127.0.0.1`
- **THEN** 服务器 SHALL 仅监听本机回环地址

### Requirement: CORS 默认源同步更新
`_DEFAULT_ORIGINS` 常量中的端口引用 SHALL 从 7891 更新为 19527，确保默认 CORS 策略与新端口一致。

#### Scenario: 默认 CORS 允许新端口
- **WHEN** 浏览器从 `http://localhost:19527` 发起跨域请求
- **THEN** 服务器 SHALL 在 `Access-Control-Allow-Origin` 中返回匹配的源

### Requirement: 所有硬编码端口引用同步更新
代码中所有硬编码的 `7891` 端口引用（包括文档字符串、CORS fallback、飞书推送链接） SHALL 统一更新为 `19527`。

#### Scenario: 文件内无残留旧端口
- **WHEN** 在 `dashboard/server.py` 中搜索字符串 `7891`
- **THEN** SHALL 无匹配结果
