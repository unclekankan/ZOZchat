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
const User = require('./models/User')
const Group = require('./models/Group')

const app = express()
const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat'
const NODE_ENV = process.env.NODE_ENV || 'development'

const DEFAULT_GROUP_INVITE_CODE = '6FC693'
const DEFAULT_FRIEND_CODE = 'TU2O3B'

// 启用 CORS
app.use(cors())

// 解析 JSON 和 URL 编码的请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/friends', friendRoutes)
app.use('/api/private-messages', privateMessageRoutes)

// 生产环境：提供前端静态文件
if (NODE_ENV === 'production') {
  try {
    const distPath = path.join(__dirname, '../frontend/dist')
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath))

      // 所有其他请求返回前端应用
      app.get('*', (req, res) => {
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
    let defaultFriend = await User.findOne({ friendCode: DEFAULT_FRIEND_CODE })
    if (!defaultFriend) {
      defaultFriend = new User({
        username: 'SystemBot',
        password: 'system123',
        nickname: '系统助手',
        bio: '欢迎使用聊天系统！',
        friendCode: DEFAULT_FRIEND_CODE
      })
      await defaultFriend.save()
      console.log('✅ 已创建默认好友用户: SystemBot (好友码: ' + DEFAULT_FRIEND_CODE + ')')
    } else {
      console.log('✅ 默认好友用户已存在')
    }

    let defaultGroup = await Group.findOne({ inviteCode: DEFAULT_GROUP_INVITE_CODE })
    if (!defaultGroup) {
      defaultGroup = new Group({
        name: '公共聊天室',
        description: '欢迎所有用户加入的公共聊天室',
        inviteCode: DEFAULT_GROUP_INVITE_CODE,
        admin: defaultFriend._id,
        members: [{
          user: defaultFriend._id,
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
