# ZOZchat 部署指南

## 部署前准备

### 1. 安装依赖

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

### 2. 配置环境变量

复制示例配置文件并修改：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-mongodb-uri/chat
JWT_SECRET=your-super-secret-key-here
```

**重要**：
- 将 `JWT_SECRET` 改为一个强密码（至少32位随机字符）
- `MONGODB_URI` 使用你的 MongoDB 连接字符串

### 3. 构建前端

```bash
cd frontend
npm run build
```

这会创建 `frontend/dist` 目录，包含所有静态文件。

---

## 部署选项

### 选项 1：VPS/云服务器部署（推荐）

适合：有独立服务器，需要完全控制

#### 使用 PM2 进程管理

```bash
# 全局安装 PM2
npm install -g pm2

# 启动后端服务
cd backend
pm2 start server.js --name "zozchat-backend"

# 保存配置
pm2 save
pm2 startup
```

#### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /path/to/backend/uploads/;
    }
}
```

---

### 选项 2：Railway/Render 部署（最简单）

适合：快速部署，无需服务器管理

#### Railway 部署步骤：

1. 注册 [Railway](https://railway.app)
2. 创建新项目，连接 GitHub 仓库
3. 添加 MongoDB 插件
4. 设置环境变量：
   - `NODE_ENV=production`
   - `MONGODB_URI=${{MongoDB.MONGO_URL}}`
   - `JWT_SECRET=your-secret-key`
5. 部署自动完成

#### Render 部署步骤：

1. 注册 [Render](https://render.com)
2. 创建 Web Service，连接 GitHub
3. 设置：
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
4. 创建 MongoDB Atlas 数据库
5. 添加环境变量
6. 部署

---

### 选项 3：Docker 部署

适合：需要容器化，便于扩展

创建 `Dockerfile`：

```dockerfile
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

# 复制后端代码
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# 复制构建好的前端
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist

# 创建上传目录
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
```

构建和运行：

```bash
# 构建镜像
docker build -t zozchat .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://your-mongodb-uri/chat \
  -e JWT_SECRET=your-secret-key \
  -v $(pwd)/uploads:/app/uploads \
  --name zozchat \
  zozchat
```

---

## MongoDB 数据库设置

### 选项 A：MongoDB Atlas（推荐）

1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费集群（M0）
3. 创建数据库用户
4. 添加 IP 白名单（允许所有：`0.0.0.0/0`）
5. 获取连接字符串：
   ```
   mongodb+srv://username:password@cluster.mongodb.net/chat?retryWrites=true&w=majority
   ```

### 选项 B：服务器本地安装

```bash
# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb

# CentOS/RHEL
sudo yum install mongodb-org
sudo systemctl start mongod
```

---

## 生产环境检查清单

- [ ] 修改 `JWT_SECRET` 为强密码
- [ ] 配置正确的 `MONGODB_URI`
- [ ] 设置 `NODE_ENV=production`
- [ ] 前端已构建（`npm run build`）
- [ ] 上传目录有写入权限
- [ ] 配置防火墙（只开放 80/443 端口）
- [ ] 配置 HTTPS（使用 Let's Encrypt）
- [ ] 设置日志轮转
- [ ] 配置自动备份

---

## 常用命令

```bash
# 查看日志
pm2 logs zozchat-backend

# 重启服务
pm2 restart zozchat-backend

# 更新代码后重新构建
cd frontend && npm run build
pm2 restart zozchat-backend

# 备份数据库
mongodump --uri="your-mongodb-uri" --out=backup-$(date +%Y%m%d)
```

---

## 故障排查

### 问题：无法连接数据库
- 检查 MongoDB URI 是否正确
- 确认数据库用户权限
- 检查防火墙设置

### 问题：前端显示 404
- 确认已运行 `npm run build`
- 检查 `frontend/dist` 目录是否存在

### 问题：图片无法上传
- 检查 `uploads` 目录权限
- 确认磁盘空间充足

---

## 推荐服务商

| 服务商 | 类型 | 价格 | 适合 |
|--------|------|------|------|
| Railway | PaaS | 免费额度 | 快速部署 |
| Render | PaaS | 免费 | 个人项目 |
| Vercel | 前端 | 免费 | 仅前端 |
| MongoDB Atlas | 数据库 | 免费512MB | 数据库托管 |
| 阿里云/腾讯云 | VPS | ¥50+/月 | 国内访问 |
| DigitalOcean | VPS | $5/月 | 海外访问 |

---

有问题请查看项目文档或提交 Issue！
