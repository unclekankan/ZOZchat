const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Group = require('../models/Group')
const Message = require('../models/Message')
const PrivateMessage = require('../models/PrivateMessage')

// 管理员权限检查中间件
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  next()
}

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 获取所有用户
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

// 获取所有群聊
router.get('/groups', requireAdmin, async (req, res) => {
  try {
    const groups = await Group.find().populate('admin members.user', '-password')
    res.json(groups)
  } catch (error) {
    res.status(500).json({ error: '获取群聊列表失败' })
  }
})

// 获取所有群聊消息
router.get('/messages', requireAdmin, async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('sender', '-password')
      .populate('group')
      .sort({ createdAt: -1 })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: '获取消息列表失败' })
  }
})

// 获取所有私聊消息
router.get('/private-messages', requireAdmin, async (req, res) => {
  try {
    const messages = await PrivateMessage.find()
      .populate('sender', '-password')
      .populate('receiver', '-password')
      .sort({ createdAt: -1 })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: '获取私聊消息失败' })
  }
})

module.exports = router