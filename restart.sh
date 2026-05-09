#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"

kill_port_process() {
    local PORT=$1
    local PROCESS_NAME=$2
    
    log_info "检查端口 ${PORT} (${PROCESS_NAME})..."
    
    if lsof -i :${PORT} &> /dev/null; then
        local PIDS=$(lsof -t -i:${PORT})
        log_warning "发现以下进程占用端口 ${PORT}: ${PIDS}"
        log_info "正在终止进程..."
        
        for PID in ${PIDS}; do
            if kill -9 ${PID} 2>/dev/null; then
                log_success "已终止进程 PID: ${PID}"
            else
                log_warning "无法终止进程 PID: ${PID}，可能需要手动处理"
            fi
        done
        
        sleep 2
        
        if lsof -i :${PORT} &> /dev/null; then
            log_error "端口 ${PORT} 仍被占用，请手动检查"
            return 1
        fi
        
        log_success "端口 ${PORT} 已释放"
    else
        log_info "端口 ${PORT} 未被占用"
    fi
    
    return 0
}

check_node() {
    log_info "检查 Node.js 环境..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    log_success "Node.js 版本: $(node --version)"
}

start_backend() {
    log_info "启动后端服务 (端口 3000)..."
    cd "${BACKEND_DIR}"
    
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules 不存在，正在安装依赖..."
        npm install
    fi
    
    nohup npm run start:dev > "${PROJECT_DIR}/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    log_info "后端服务启动中 (PID: $BACKEND_PID)..."
    echo "$BACKEND_PID" > "${PROJECT_DIR}/backend.pid"
    
    for i in {1..30}; do
        if curl -s "http://localhost:3000/api/auth/login" &> /dev/null; then
            log_success "后端服务已启动: http://localhost:3000"
            return 0
        fi
        sleep 1
    done
    
    log_warning "后端服务启动超时，请检查日志: ${PROJECT_DIR}/backend.log"
    return 1
}

start_frontend() {
    log_info "启动前端服务 (端口 5173)..."
    cd "${FRONTEND_DIR}"
    
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules 不存在，正在安装依赖..."
        npm install
    fi
    
    nohup npm run dev > "${PROJECT_DIR}/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    log_info "前端服务启动中 (PID: $FRONTEND_PID)..."
    echo "$FRONTEND_PID" > "${PROJECT_DIR}/frontend.pid"
    
    for i in {1..60}; do
        if curl -s "http://localhost:5173" &> /dev/null; then
            log_success "前端服务已启动: http://localhost:5173"
            return 0
        fi
        sleep 1
    done
    
    log_warning "前端服务启动超时，请检查日志: ${PROJECT_DIR}/frontend.log"
    return 1
}

main() {
    echo "=========================================="
    echo "  公考资料分析速算训练系统 - 重启脚本"
    echo "=========================================="
    echo ""
    
    check_node
    
    log_info "正在停止现有服务..."
    echo ""
    
    kill_port_process 3000 "后端服务"
    kill_port_process 5173 "前端服务"
    
    echo ""
    log_info "正在启动服务..."
    echo ""
    
    start_backend
    start_frontend
    
    echo ""
    echo "=========================================="
    echo "  重启完成！"
    echo "=========================================="
    echo ""
    echo "  前端地址: http://localhost:5173"
    echo "  后端地址: http://localhost:3000"
    echo ""
    echo "  后端日志: ${PROJECT_DIR}/backend.log"
    echo "  前端日志: ${PROJECT_DIR}/frontend.log"
    echo ""
}

main "$@"
