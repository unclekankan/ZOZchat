const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { MongoMemoryServer } = require('mongodb-memory-server')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const messageRoutes = require('./routes/message')
const groupRoutes = require('./routes/group')
const friendRoutes = require('./routes/friend')
const privateMessageRoutes = require('./routes/privateMessage')
const adminRoutes = require('./routes/admin')
const User = require('./models/User')
const Group = require('./models/Group')

const app = express()
const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI || ''
const NODE_ENV = process.env.NODE_ENV || 'development'

const DEFAULT_GROUP_INVITE_CODE = '6FC693'
const DEFAULT_FRIEND_CODE = 'ADMIN666'
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'zt20060509'
const ADMIN_NICKNAME = '堪堪大爷'
const ADMIN_NAME = '邹泽'
const ADMIN_AVATAR = '/uploads/admin-avatar.jpg'

console.log('📋 超级管理员头像路径:', ADMIN_AVATAR)

// 启用 CORS
app.use(cors())

// 解析 JSON 和 URL 编码的请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// 静态文件服务 - 必须在所有路由之前定义
const uploadsPath = path.join(__dirname, 'uploads')
console.log('📁 静态文件服务路径:', uploadsPath)
console.log('📁 静态文件服务存在:', fs.existsSync(uploadsPath))
app.use('/uploads', express.static(uploadsPath))

// 测试头像文件是否存在
app.get('/test-avatar', (req, res) => {
  const avatarPath = path.join(__dirname, 'uploads', 'admin-avatar.jpg')
  const exists = fs.existsSync(avatarPath)
  res.json({
    exists,
    path: avatarPath,
    avatarUrl: ADMIN_AVATAR
  })
})

// 查看管理员信息（调试用）
app.get('/admin-info', async (req, res) => {
  try {
    const admin = await User.findOne({ username: ADMIN_USERNAME }).select('-password')
    res.json(admin)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 查看数据库中所有用户的头像（调试用）
app.get('/all-users', async (req, res) => {
  try {
    const users = await User.find().select('username avatar');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/private-messages', privateMessageRoutes)
app.use('/api/admin', adminRoutes)

// 生产环境：提供前端静态文件
if (NODE_ENV === 'production') {
  try {
    const distPath = path.join(__dirname, '../frontend/dist')
    if (fs.existsSync(distPath)) {
      // 提供前端静态文件服务
      app.use(express.static(distPath))

      // 所有其他请求返回前端应用
      // 注意：这个路由必须在所有其他路由之后定义
      app.get('*', (req, res) => {
        // 排除 /uploads 路径，让静态文件服务处理
        if (req.path.startsWith('/uploads')) {
          // 让静态文件服务处理这个请求
          return res.status(404).send('File not found')
        }
        // 直接发送 index.html，让前端应用处理路由
        res.sendFile(path.join(distPath, 'index.html'))
      })
      console.log('✅ 前端静态文件已加载')
    } else {
      console.log('⚠️  前端构建目录不存在，仅提供 API 服务')
    }
  } catch (error) {
    console.error('加载前端文件错误:', error)
  }
}

// 连接数据库的函数
async function connectDatabase() {
  try {
    if (NODE_ENV === 'production' && MONGODB_URI) {
      // 生产环境：使用配置的 MongoDB URI
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      })
      console.log('✅ 已连接到 MongoDB 数据库')
    } else {
      // 开发环境或生产环境无 MONGODB_URI：使用内存数据库
      console.log('⚠️  未配置 MongoDB URI，正在启动内存数据库...')

      const mongod = await MongoMemoryServer.create()
      const uri = mongod.getUri()

      await mongoose.connect(uri, {})

      console.log('✅ 内存数据库启动成功')
      console.log('💡 提示：数据将在服务器重启后丢失')
    }
  } catch (err) {
    console.error('❌ 数据库连接失败:', err)
    if (NODE_ENV === 'production' && MONGODB_URI) {
      console.log('\n请检查 MongoDB 连接配置')
      process.exit(1)
    }
  }
}

// 初始化默认数据
async function initializeDefaultData() {
  try {
    // 创建超级管理员账号
    let adminUser = await User.findOne({ username: ADMIN_USERNAME })
    if (!adminUser) {
      // 确保头像路径正确，避免重复的 .jpg 后缀
      let cleanAvatar = ADMIN_AVATAR
      if (cleanAvatar.endsWith('.jpg.jpg')) {
        cleanAvatar = cleanAvatar.replace('.jpg.jpg', '.jpg')
      }
      adminUser = new User({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        nickname: ADMIN_NICKNAME,
        name: ADMIN_NAME,
        bio: '超级管理员账号',
        friendCode: DEFAULT_FRIEND_CODE,
        isAdmin: true,
        avatar: cleanAvatar
      })
      await adminUser.save()
      console.log('✅ 已创建超级管理员用户: ' + ADMIN_NICKNAME + ' (好友码: ' + DEFAULT_FRIEND_CODE + ')')
    } else {
      // 强制更新管理员的头像，确保路径正确
      console.log('🔧 更新前管理员头像:', adminUser.avatar)
      // 清理重复的 .jpg 后缀
      let cleanAvatar = '/uploads/admin-avatar.jpg'
      if (cleanAvatar.endsWith('.jpg.jpg')) {
        cleanAvatar = cleanAvatar.replace('.jpg.jpg', '.jpg')
      }
      adminUser.avatar = cleanAvatar
      await adminUser.save()
      console.log('✅ 已更新超级管理员头像为:', adminUser.avatar)

      // 重新查询确认
      const updatedUser = await User.findOne({ username: ADMIN_USERNAME })
      console.log('🔍 重新查询后的头像:', updatedUser.avatar)
      console.log('✅ 超级管理员用户已存在')
    }

    let defaultGroup = await Group.findOne({ inviteCode: DEFAULT_GROUP_INVITE_CODE })
    if (!defaultGroup) {
      defaultGroup = new Group({
        name: '公共聊天室',
        description: '欢迎所有用户加入的公共聊天室',
        inviteCode: DEFAULT_GROUP_INVITE_CODE,
        admin: adminUser._id,
        members: [{
          user: adminUser._id,
          role: 'admin'
        }]
      })
      await defaultGroup.save()
      console.log('✅ 已创建默认群组: 公共聊天室 (邀请码: ' + DEFAULT_GROUP_INVITE_CODE + ')')
    } else {
      console.log('✅ 默认群组已存在')
    }
  } catch (error) {
    console.error('初始化默认数据失败:', error)
  }
}

// 启动服务器
async function startServer() {
  await connectDatabase()
  await initializeDefaultData()

  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
    console.log(`📦 环境: ${NODE_ENV}`)

    if (NODE_ENV === 'development') {
      console.log('\n📋 API 端点：')
      console.log('   POST /api/auth/register - 注册')
      console.log('   POST /api/auth/login - 登录')
      console.log('   GET  /api/groups - 获取群组列表')
      console.log('   POST /api/groups - 创建群组')
    }
  })
}

startServer()
