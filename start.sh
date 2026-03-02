#!/bin/bash
# ══════════════════════════════════════════════════════════════
# 三省六部 · 一键启动（后台守护模式）
# 用法:
#   bash start.sh                          # 启动（token 自动持久化）
#   AUTH_TOKEN=xxx bash start.sh           # 指定 token
#   bash start.sh --regen-token            # 重新生成 token
#   bash start.sh --port 8080             # 传递额外参数给 server.py
# 停止:
#   bash stop.sh
# ══════════════════════════════════════════════════════════════
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDFILE_SERVER="/tmp/sansheng_server.pid"
PIDFILE_LOOP="/tmp/sansheng_liubu_refresh.pid"
LOG_SERVER="$REPO_DIR/data/server.log"

# ── 检查是否已在运行 ──
if [ -f "$PIDFILE_SERVER" ]; then
  OLD_PID=$(cat "$PIDFILE_SERVER" 2>/dev/null)
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo -e "\033[1;33m⚠️  服务已在运行中 (PID=$OLD_PID)，请先执行 bash stop.sh\033[0m"
    exit 1
  fi
  rm -f "$PIDFILE_SERVER"
fi

echo ""
echo -e "\033[0;34m╔══════════════════════════════════════════╗\033[0m"
echo -e "\033[0;34m║  🏛️  三省六部 · 启动中                    ║\033[0m"
echo -e "\033[0;34m╚══════════════════════════════════════════╝\033[0m"
echo ""

# ── 1. 构建前端（如有 Node.js） ──
if command -v node &>/dev/null && [ -f "$REPO_DIR/edict/frontend/package.json" ]; then
  echo -e "\033[0;34mℹ️  检测到 Node.js，构建前端...\033[0m"
  cd "$REPO_DIR/edict/frontend"
  npm install --silent 2>/dev/null || npm install
  npm run build 2>/dev/null
  cd "$REPO_DIR"
  if [ -f "$REPO_DIR/dashboard/dist/index.html" ]; then
    echo -e "\033[0;32m✅ 前端构建完成\033[0m"
  else
    echo -e "\033[1;33m⚠️  前端构建可能失败，将使用已有版本\033[0m"
  fi
else
  if [ -f "$REPO_DIR/dashboard/dist/index.html" ]; then
    echo -e "\033[0;34mℹ️  使用已构建的前端\033[0m"
  else
    echo -e "\033[1;33m⚠️  未找到 Node.js 且无预构建前端，看板可能无法正常显示\033[0m"
  fi
fi

mkdir -p "$REPO_DIR/data"

# ── 2. 启动数据刷新循环（后台） ──
nohup bash "$REPO_DIR/scripts/run_loop.sh" >> /tmp/sansheng_liubu_refresh.log 2>&1 &
sleep 0.5
if [ -f /tmp/sansheng_liubu_refresh.pid ]; then
  LOOP_PID=$(cat /tmp/sansheng_liubu_refresh.pid)
  echo -e "\033[0;32m✅ 数据刷新循环已启动 (PID=$LOOP_PID)\033[0m"
else
  echo -e "\033[1;33m⚠️  数据刷新循环启动中...\033[0m"
fi

# ── 3. 构建 server.py 启动参数 ──
AUTH_ARG=""
if [ -n "$AUTH_TOKEN" ]; then
  AUTH_ARG="--auth-token $AUTH_TOKEN"
fi
export DASHBOARD_AUTH_TOKEN="${AUTH_TOKEN:-}"

# ── 4. 启动看板服务器（后台） ──
nohup python3 "$REPO_DIR/dashboard/server.py" $AUTH_ARG "$@" >> "$LOG_SERVER" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PIDFILE_SERVER"

# 等一秒确认启动成功
sleep 1
if kill -0 "$SERVER_PID" 2>/dev/null; then
  echo -e "\033[0;32m✅ 看板服务器已启动 (PID=$SERVER_PID)\033[0m"
else
  echo -e "\033[0;31m❌ 看板服务器启动失败，请查看日志: $LOG_SERVER\033[0m"
  exit 1
fi

# ── 5. 输出启动信息 ──
echo ""
# 读取 token（从持久化文件）
TOKEN_FILE="$REPO_DIR/data/.auth_token"
if [ -f "$TOKEN_FILE" ]; then
  echo -e "\033[0;32m   🔑 Auth Token: $(cat "$TOKEN_FILE")\033[0m"
fi
echo "   📋 服务器日志: $LOG_SERVER"
echo "   🛑 停止命令:   bash stop.sh"
echo ""
