const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Group = require('../models/Group')
const Friendship = require('../models/Friendship')
const jwt = require('jsonwebtoken')

const DEFAULT_GROUP_INVITE_CODE = '6FC693'
const DEFAULT_FRIEND_CODE = 'TU2O3B'

// JWT验证中间件
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    const decoded = jwt.verify(token, 'secret_key')
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: '未授权' })
  }
}

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname, email, bio, avatar } = req.body

    console.log('收到注册请求:', { username, nickname, email })

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      console.log('用户名已存在:', username)
      return res.status(400).json({ message: '用户名已存在' })
    }

    // 创建新用户
    const user = new User({
      username,
      password,
      nickname: nickname || username,
      email: email || '',
      bio: bio || '',
      avatar: avatar || ''
    })
    await user.save()

    console.log('用户注册成功:', username)
    res.status(201).json({ message: '注册成功' })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    console.log('收到登录请求:', username)

    const user = await User.findOne({ username })
    if (!user) {
      console.log('用户不存在:', username)
      return res.status(400).json({ message: '用户名或密码错误' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      console.log('密码错误:', username)
      return res.status(400).json({ message: '用户名或密码错误' })
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      'secret_key',
      { expiresIn: '1h' }
    )

    await autoJoinDefaultGroup(user._id)
    await autoAddDefaultFriend(user._id)

    console.log('用户登录成功:', username)
    res.json({
      token,
      userId: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ message: '服务器错误', error: error.message })
  }
})

async function autoJoinDefaultGroup(userId) {
  try {
    const group = await Group.findOne({ inviteCode: DEFAULT_GROUP_INVITE_CODE })
    if (!group) {
      console.log('默认群组不存在，跳过自动加入')
      return
    }

    const isMember = group.members.some(m => m.user.toString() === userId.toString())
    if (isMember) {
      console.log('用户已在默认群组中')
      return
    }

    group.members.push({
      user: userId,
      role: 'member'
    })
    await group.save()
    console.log('用户已自动加入默认群组')
  } catch (error) {
    console.error('自动加入群组失败:', error)
  }
}

async function autoAddDefaultFriend(userId) {
  try {
    const defaultFriend = await User.findOne({ friendCode: DEFAULT_FRIEND_CODE })
    if (!defaultFriend) {
      console.log('默认好友不存在，跳过自动添加')
      return
    }

    if (defaultFriend._id.toString() === userId.toString()) {
      console.log('用户是默认好友本人，跳过')
      return
    }

    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: userId, recipient: defaultFriend._id },
        { requester: defaultFriend._id, recipient: userId }
      ]
    })

    if (existingFriendship) {
      console.log('好友关系已存在')
      return
    }

    const friendship = new Friendship({
      requester: userId,
      recipient: defaultFriend._id,
      status: 'accepted'
    })
    await friendship.save()
    console.log('用户已自动添加默认好友')
  } catch (error) {
    console.error('自动添加好友失败:', error)
  }
}

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')

    if (!user.friendCode) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      let uniqueCode = false
      while (!uniqueCode) {
        const existingUser = await User.findOne({ friendCode: code })
        if (!existingUser) {
          user.friendCode = code
          await user.save()
          uniqueCode = true
        } else {
          code = ''
          for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
          }
        }
      }
    }

    res.json(user)
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取指定用户信息
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    res.json(user)
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 更新用户信息
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, email, bio, avatar } = req.body
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { nickname, email, bio, avatar },
      { new: true }
    ).select('-password')

    res.json(user)
  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/heartbeat', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { lastActive: new Date() })
    res.json({ success: true })
  } catch (error) {
    console.error('更新活动时间错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/online-status', auth, async (req, res) => {
  try {
    const { userIds } = req.body

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: '请提供用户ID列表' })
    }

    const users = await User.find({ _id: { $in: userIds } }).select('lastActive')

    const now = new Date()
    const onlineThreshold = 5 * 60 * 1000

    const statusMap = {}
    users.forEach(user => {
      const lastActive = new Date(user.lastActive)
      const isOnline = (now - lastActive) < onlineThreshold
      statusMap[user._id] = isOnline ? 'online' : 'offline'
    })

    res.json(statusMap)
  } catch (error) {
    console.error('获取在线状态错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router