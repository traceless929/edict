#!/bin/bash
# ══════════════════════════════════════════════════════════════
# 三省六部 · 停止服务
# ══════════════════════════════════════════════════════════════

PIDFILE_SERVER="/tmp/sansheng_server.pid"
PIDFILE_LOOP="/tmp/sansheng_liubu_refresh.pid"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
stopped=0

# ── 停止看板服务器 ──
if [ -f "$PIDFILE_SERVER" ]; then
  PID=$(cat "$PIDFILE_SERVER" 2>/dev/null)
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null
    # 等待进程退出（最多 5 秒）
    for i in $(seq 1 10); do
      kill -0 "$PID" 2>/dev/null || break
      sleep 0.5
    done
    if kill -0 "$PID" 2>/dev/null; then
      kill -9 "$PID" 2>/dev/null
    fi
    echo -e "${GREEN}✅ 看板服务器已停止 (PID=$PID)${NC}"
    stopped=1
  else
    echo -e "${YELLOW}⚠️  看板服务器未在运行 (PID=$PID 已退出)${NC}"
  fi
  rm -f "$PIDFILE_SERVER"
else
  echo -e "${YELLOW}⚠️  未找到看板服务器 PID 文件${NC}"
fi

# ── 停止数据刷新循环 ──
if [ -f "$PIDFILE_LOOP" ]; then
  PID=$(cat "$PIDFILE_LOOP" 2>/dev/null)
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null
    for i in $(seq 1 10); do
      kill -0 "$PID" 2>/dev/null || break
      sleep 0.5
    done
    if kill -0 "$PID" 2>/dev/null; then
      kill -9 "$PID" 2>/dev/null
    fi
    echo -e "${GREEN}✅ 数据刷新循环已停止 (PID=$PID)${NC}"
    stopped=1
  else
    echo -e "${YELLOW}⚠️  数据刷新循环未在运行 (PID=$PID 已退出)${NC}"
  fi
  rm -f "$PIDFILE_LOOP"
else
  echo -e "${YELLOW}⚠️  未找到数据刷新循环 PID 文件${NC}"
fi

if [ $stopped -eq 1 ]; then
  echo -e "${GREEN}🏛️  三省六部已停止${NC}"
else
  echo -e "${YELLOW}🏛️  没有正在运行的服务${NC}"
fi
