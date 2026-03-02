#!/bin/bash
# ══════════════════════════════════════════════════════════════
# 三省六部 · 一键启动
# 用法:
#   bash start.sh                          # 自动生成 token
#   AUTH_TOKEN=xxx bash start.sh           # 指定 token
#   bash start.sh --port 8080             # 传递额外参数给 server.py
# ══════════════════════════════════════════════════════════════
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "\033[0;34m╔══════════════════════════════════════════╗\033[0m"
echo -e "\033[0;34m║  🏛️  三省六部 · 启动中                    ║\033[0m"
echo -e "\033[0;34m╚══════════════════════════════════════════╝\033[0m"
echo ""

# ── 退出时自动清理后台进程 ──
RUN_LOOP_PID=""
cleanup() {
  echo ""
  if [ -n "$RUN_LOOP_PID" ]; then
    echo "正在停止数据刷新循环 (PID=$RUN_LOOP_PID)..."
    kill "$RUN_LOOP_PID" 2>/dev/null || true
    wait "$RUN_LOOP_PID" 2>/dev/null || true
  fi
  echo "已停止"
}
trap cleanup EXIT INT TERM

# ── 1. 启动数据刷新循环（后台） ──
bash "$REPO_DIR/scripts/run_loop.sh" &
RUN_LOOP_PID=$!
echo -e "\033[0;32m✅ 数据刷新循环已启动 (PID=$RUN_LOOP_PID)\033[0m"

# ── 2. 构建 server.py 启动参数 ──
AUTH_ARG=""
if [ -n "$AUTH_TOKEN" ]; then
  AUTH_ARG="--auth-token $AUTH_TOKEN"
fi

# 同步 auth token 给 run_loop.sh（通过环境变量）
export DASHBOARD_AUTH_TOKEN="${AUTH_TOKEN:-}"

# ── 3. 启动看板服务器（前台，Ctrl+C 退出） ──
echo -e "\033[0;32m✅ 看板服务器启动中...\033[0m"
echo ""
python3 "$REPO_DIR/dashboard/server.py" $AUTH_ARG "$@"
