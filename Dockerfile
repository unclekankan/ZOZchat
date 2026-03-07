# 构建前端
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 后端服务
FROM node:18-alpine
WORKDIR /app

# 安装依赖
COPY backend/package*.json ./
RUN npm install --production

# 复制后端代码
COPY backend/ ./

# 复制构建好的前端
COPY --from=frontend-builder /app/frontend/dist ./../frontend/dist

# 创建上传目录
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
