const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('只支持图片文件'))
    }
  }
})

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

// 获取群组消息历史
router.get('/:groupId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId })
      .populate('userId', 'username nickname avatar')
      .sort({ createdAt: 1 })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/:groupId', auth, async (req, res) => {
  try {
    const { content, messageType, imageUrl } = req.body
    const message = new Message({
      userId: req.user.userId,
      username: req.user.username,
      groupId: req.params.groupId,
      content,
      messageType: messageType || 'text',
      imageUrl: imageUrl || null
    })
    await message.save()
    await message.populate('userId', 'username nickname avatar')
    res.status(201).json(message)
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/:groupId/image', auth, async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({ message: '请上传图片' })
    }

    // 处理 base64 编码的图片
    const imageData = req.body.image
    const message = new Message({
      userId: req.user.userId,
      username: req.user.username,
      groupId: req.params.groupId,
      content: '[图片]',
      messageType: 'image',
      imageUrl: imageData // 直接存储 base64 编码的图片数据
    })
    await message.save()
    await message.populate('userId', 'username nickname avatar')
    res.status(201).json(message)
  } catch (error) {
    console.error('上传图片错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 撤回消息
router.put('/:id/recall', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)

    // 检查消息是否存在
    if (!message) {
      return res.status(404).json({ message: '消息不存在' })
    }

    // 检查是否是消息的发送者
    if (message.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: '无权撤回此消息' })
    }

    // 标记消息为已撤回
    message.isRecalled = true
    await message.save()

    res.json(message)
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取未读消息计数
router.get('/unread', auth, async (req, res) => {
  try {
    // 这里简化处理，返回空对象
    // 实际应用中应该根据消息的已读状态来计算
    res.json({})
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router