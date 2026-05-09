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

check_node() {
    log_info "检查 Node.js 环境..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_success "Node.js 版本: $NODE_VERSION"
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "npm 版本: $(npm --version)"
}

check_docker() {
    log_info "检查 Docker 环境..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    log_success "Docker 版本: $(docker --version)"
    
    log_info "检查 PostgreSQL 容器 dev-postgres..."
    if ! docker ps -a --format '{{.Names}}' | grep -q '^dev-postgres$'; then
        log_error "Docker 容器 dev-postgres 不存在，请先创建 PostgreSQL 容器"
        log_info "提示: 使用以下命令创建容器:"
        log_info "  docker run --name dev-postgres -e POSTGRES_PASSWORD=dev123456 -e POSTGRES_USER=dev -p 5432:5432 -d postgres"
        exit 1
    fi
    
    if ! docker ps --format '{{.Names}}' | grep -q '^dev-postgres$'; then
        log_warning "PostgreSQL 容器未运行，正在启动..."
        docker start dev-postgres
        sleep 3
    fi
    
    log_success "PostgreSQL 容器正在运行"
}

check_redis() {
    log_info "检查 Redis 连接..."
    if ! command -v redis-cli &> /dev/null; then
        log_warning "redis-cli 未安装，跳过 Redis 健康检查"
        log_warning "请确保 Redis 服务运行在 redis://default:redis123456@localhost:6379"
        return 0
    fi
    
    if ! redis-cli -u "redis://default:redis123456@localhost:6379" ping &> /dev/null; then
        log_error "无法连接到 Redis，请确保 Redis 服务运行在 redis://default:redis123456@localhost:6379"
        exit 1
    fi
    
    log_success "Redis 连接正常"
}

create_database() {
    log_info "创建数据库 db_zj_60010..."
    
    if docker exec dev-postgres psql -U dev -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'db_zj_60010'" | grep -q "1 row"; then
        log_warning "数据库 db_zj_60010 已存在"
    else
        log_info "执行建库命令..."
        if docker exec -e PGPASSWORD=dev123456 dev-postgres psql -U dev -d postgres -c "CREATE DATABASE db_zj_60010"; then
            log_success "数据库创建成功"
        else
            log_error "数据库创建失败"
            exit 1
        fi
    fi
}

install_backend_dependencies() {
    log_info "安装后端依赖..."
    cd "${BACKEND_DIR}"
    
    if [ -d "node_modules" ]; then
        log_warning "node_modules 已存在，跳过安装"
    else
        if npm install; then
            log_success "后端依赖安装成功"
        else
            log_error "后端依赖安装失败"
            exit 1
        fi
    fi
}

install_frontend_dependencies() {
    log_info "安装前端依赖..."
    cd "${FRONTEND_DIR}"
    
    if [ -d "node_modules" ]; then
        log_warning "node_modules 已存在，跳过安装"
    else
        if npm install; then
            log_success "前端依赖安装成功"
        else
            log_error "前端依赖安装失败"
            exit 1
        fi
    fi
}

run_prisma_migrations() {
    log_info "运行 Prisma 迁移..."
    cd "${BACKEND_DIR}"
    
    log_info "生成 Prisma Client..."
    if npx prisma generate; then
        log_success "Prisma Client 生成成功"
    else
        log_error "Prisma Client 生成失败"
        exit 1
    fi
    
    log_info "运行数据库迁移..."
    if npx prisma migrate dev --name init --skip-seed; then
        log_success "数据库迁移成功"
    else
        log_warning "迁移可能已存在或失败，尝试直接运行种子数据..."
    fi
}

run_prisma_seed() {
    log_info "运行 Prisma 种子数据..."
    cd "${BACKEND_DIR}"
    
    if npx prisma db seed; then
        log_success "种子数据填充成功"
    else
        log_error "种子数据填充失败"
        exit 1
    fi
}

start_backend() {
    log_info "启动后端服务 (端口 3000)..."
    cd "${BACKEND_DIR}"
    
    if lsof -i :3000 &> /dev/null; then
        log_warning "端口 3000 已被占用，正在终止..."
        kill -9 $(lsof -t -i:3000) 2>/dev/null || true
        sleep 1
    fi
    
    nohup npm run start:dev > "${PROJECT_DIR}/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    log_info "后端服务启动中 (PID: $BACKEND_PID)..."
    echo "$BACKEND_PID" > "${PROJECT_DIR}/backend.pid"
    
    for i in {1..30}; do
        if curl -s "http://localhost:3000/api/auth/login" &> /dev/null; then
            log_success "后端服务已启动: http://localhost:3000"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            log_warning "后端服务启动超时，请手动检查日志: ${PROJECT_DIR}/backend.log"
        fi
    done
}

start_frontend() {
    log_info "启动前端服务 (端口 5173)..."
    cd "${FRONTEND_DIR}"
    
    if lsof -i :5173 &> /dev/null; then
        log_warning "端口 5173 已被占用，正在终止..."
        kill -9 $(lsof -t -i:5173) 2>/dev/null || true
        sleep 1
    fi
    
    nohup npm run dev > "${PROJECT_DIR}/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    log_info "前端服务启动中 (PID: $FRONTEND_PID)..."
    echo "$FRONTEND_PID" > "${PROJECT_DIR}/frontend.pid"
    
    for i in {1..60}; do
        if curl -s "http://localhost:5173" &> /dev/null; then
            log_success "前端服务已启动: http://localhost:5173"
            break
        fi
        sleep 1
        if [ $i -eq 60 ]; then
            log_warning "前端服务启动超时，请手动检查日志: ${PROJECT_DIR}/frontend.log"
        fi
    done
}

main() {
    echo "=========================================="
    echo "  公考资料分析速算训练系统 - 启动脚本"
    echo "=========================================="
    echo ""
    
    check_node
    check_docker
    check_redis
    create_database
    install_backend_dependencies
    install_frontend_dependencies
    run_prisma_migrations
    run_prisma_seed
    start_backend
    start_frontend
    
    echo ""
    echo "=========================================="
    echo "  启动完成！"
    echo "=========================================="
    echo ""
    echo "  前端地址: http://localhost:5173"
    echo "  后端地址: http://localhost:3000"
    echo ""
    echo "  后端日志: ${PROJECT_DIR}/backend.log"
    echo "  前端日志: ${PROJECT_DIR}/frontend.log"
    echo ""
    echo "  停止服务命令: pkill -f 'npm run'"
    echo "  或使用 restart.sh 重启服务"
    echo ""
}

main "$@"
