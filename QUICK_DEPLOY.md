# ZOZchat 快速部署指南（短期使用）

> 适合使用 6 个月以内的场景，选择免费或低成本方案

## 推荐方案对比

| 方案 | 费用 | 难度 | 适合场景 |
|------|------|------|----------|
| **Railway** | 免费$5/月额度 | ⭐ 最简单 | 推荐首选 |
| **Render** | 免费 | ⭐ 简单 | 备用选择 |
| **Vercel + Railway** | 免费 | ⭐⭐ 中等 | 前后端分离 |

---

## 方案一：Railway（推荐 ⭐）

### 优点
- 每月 $5 免费额度，足够小型应用
- 一键部署，自动配置
- 自带数据库插件
- 自动 HTTPS

### 部署步骤

#### 1. 准备代码
确保代码已推送到 GitHub：
```bash
git add .
git commit -m "准备部署"
git push origin main
```

#### 2. 注册 Railway
1. 访问 https://railway.app
2. 用 GitHub 账号登录
3. 点击 "New Project"

#### 3. 部署后端
1. 选择 "Deploy from GitHub repo"
2. 选择你的仓库
3. 点击 "Add Variables" 添加环境变量：
   ```
   NODE_ENV=production
   JWT_SECRET=your-random-secret-key-here-32chars
   ```
4. 点击 "Add Plugin" → 选择 "MongoDB"
5. 等待部署完成（约 2-3 分钟）

#### 4. 获取数据库连接字符串
1. 点击 MongoDB 插件
2. 点击 "Connect" 标签
3. 复制 "MongoDB Connection String"
4. 添加到环境变量：`MONGODB_URI=复制的连接字符串`

#### 5. 生成域名
1. 点击后端服务
2. 点击 "Settings" → "Domains"
3. 点击 "Generate Domain"
4. 记录域名，例如：`https://zozchat-production.up.railway.app`

#### 6. 更新前端 API 地址
编辑 `frontend/.env.production`：
```env
VITE_API_URL=https://你的railway域名/api
```

重新构建并推送：
```bash
cd frontend
npm run build
cd ..
git add .
git commit -m "更新API地址"
git push
```

#### 7. 重新部署
在 Railway 控制台点击 "Redeploy"

**完成！** 访问 Railway 提供的域名即可使用。

---

## 方案二：Render（备用）

### 优点
- 完全免费（有休眠限制）
- 支持 WebSocket
- 自动部署

### 部署步骤

#### 1. 注册 Render
访问 https://render.com 用 GitHub 登录

#### 2. 创建 PostgreSQL 数据库（可选）
Render 的免费 PostgreSQL 可以存储数据，但我们用 MongoDB Atlas

#### 3. 注册 MongoDB Atlas
1. 访问 https://www.mongodb.com/cloud/atlas
2. 注册免费账户
3. 创建集群（选择 AWS/免费层）
4. 创建数据库用户
5. 添加 IP 白名单：`0.0.0.0/0`
6. 获取连接字符串

#### 4. 创建 Web Service
1. 在 Render 点击 "New Web Service"
2. 连接 GitHub 仓库
3. 配置：
   - **Name**: zozchat
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install && cd ../frontend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
4. 添加环境变量：
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://用户名:密码@cluster.mongodb.net/chat?retryWrites=true&w=majority
   JWT_SECRET=your-random-secret-key
   ```
5. 点击 "Create Web Service"

#### 5. 等待部署
约 5-10 分钟，Render 会自动完成构建和部署

---

## 方案三：Vercel + Railway（前后端分离）

适合：需要更好性能，前后端独立扩展

### 前端部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署前端
cd frontend
vercel

# 按提示操作，选择框架为 Vite
```

### 后端部署到 Railway
按方案一部署后端

### 配置 CORS
修改 `backend/server.js`，允许 Vercel 域名：
```javascript
app.use(cors({
  origin: ['https://你的vercel域名.vercel.app', 'http://localhost:5173'],
  credentials: true
}))
```

---

## MongoDB Atlas 详细配置

### 1. 创建集群
1. 登录 https://cloud.mongodb.com
2. 点击 "Build a Cluster"
3. 选择 "FREE" 套餐
4. 选择最近的区域（如 AWS / Singapore）
5. 点击 "Create Cluster"（等待 1-3 分钟）

### 2. 创建用户
1. 点击 "Database Access"
2. 点击 "Add New Database User"
3. 输入用户名和密码（记下来！）
4. 权限选择 "Read and write to any database"
5. 点击 "Add User"

### 3. 允许所有 IP
1. 点击 "Network Access"
2. 点击 "Add IP Address"
3. 点击 "Allow Access from Anywhere"（或输入 `0.0.0.0/0`）
4. 点击 "Confirm"

### 4. 获取连接字符串
1. 点击 "Clusters" → "Connect"
2. 选择 "Connect your application"
3. 复制字符串，替换 `<password>` 为刚才创建的密码
4. 格式示例：
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/chat?retryWrites=true&w=majority
   ```

---

## 部署前检查清单

- [ ] 代码已推送到 GitHub
- [ ] `backend/.env` 中的 `JWT_SECRET` 已修改为强密码
- [ ] `frontend/.env.production` 已更新为正确的 API 地址
- [ ] 已注册 MongoDB Atlas 并获取连接字符串
- [ ] 前端已构建：`npm run build`
- [ ] logo.jpg 已放入 `frontend/public/`

---

## 费用预估（6个月）

| 方案 | 月费用 | 6个月总费用 | 限制 |
|------|--------|-------------|------|
| Railway | $0-5 | $0-30 | 免费$5额度 |
| Render | $0 | $0 | 15分钟无访问休眠 |
| MongoDB Atlas | $0 | $0 | 512MB存储 |
| **总计** | **$0-5** | **$0-30** | - |

---

## 常见问题

### Q: 免费额度用完怎么办？
A: Railway 超过 $5 后会暂停服务，可以绑定信用卡继续按量付费，或迁移到 Render。

### Q: 数据会丢失吗？
A: 使用 MongoDB Atlas 数据不会丢失，即使更换部署平台数据也在。

### Q: 如何备份数据？
A: MongoDB Atlas 自动备份，也可以手动导出：
```bash
mongodump --uri="你的连接字符串" --out=backup
```

### Q: 自定义域名？
A: Railway/Render 都支持，在设置中添加自定义域名即可。

### Q: 如何更新代码？
A: 推送代码到 GitHub，平台会自动重新部署。

---

## 需要帮助？

1. 查看 [DEPLOY.md](DEPLOY.md) 详细文档
2. Railway 文档：https://docs.railway.app
3. Render 文档：https://render.com/docs
4. MongoDB Atlas 文档：https://docs.atlas.mongodb.com

---

**推荐顺序**：Railway → Render → Vercel+Railway

祝你部署顺利！🚀
