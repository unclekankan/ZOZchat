const express = require('express')
const router = express.Router()
const PrivateMessage = require('../models/PrivateMessage')
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

router.get('/:friendId', auth, async (req, res) => {
  try {
    const messages = await PrivateMessage.find({
      $or: [
        { senderId: req.user.userId, recipientId: req.params.friendId },
        { senderId: req.params.friendId, recipientId: req.user.userId }
      ]
    })
      .populate('senderId', 'username nickname avatar')
      .populate('recipientId', 'username nickname avatar')
      .sort({ createdAt: 1 })

    res.json(messages)
  } catch (error) {
    console.error('获取私聊消息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/:friendId', auth, async (req, res) => {
  try {
    const { content, messageType, imageUrl } = req.body

    const message = new PrivateMessage({
      senderId: req.user.userId,
      recipientId: req.params.friendId,
      content,
      messageType: messageType || 'text',
      imageUrl: imageUrl || null
    })

    await message.save()
    await message.populate('senderId', 'username nickname avatar')
    await message.populate('recipientId', 'username nickname avatar')

    res.status(201).json(message)
  } catch (error) {
    console.error('发送私聊消息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/:friendId/image', auth, async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({ message: '请上传图片' })
    }

    // 处理 base64 编码的图片
    const imageData = req.body.image
    const message = new PrivateMessage({
      senderId: req.user.userId,
      recipientId: req.params.friendId,
      content: '[图片]',
      messageType: 'image',
      imageUrl: imageData // 直接存储 base64 编码的图片数据
    })

    await message.save()
    await message.populate('senderId', 'username nickname avatar')
    await message.populate('recipientId', 'username nickname avatar')

    res.status(201).json(message)
  } catch (error) {
    console.error('发送私聊图片错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.put('/:id/recall', auth, async (req, res) => {
  try {
    const message = await PrivateMessage.findById(req.params.id)

    if (!message) {
      return res.status(404).json({ message: '消息不存在' })
    }

    if (message.senderId.toString() !== req.user.userId) {
      return res.status(403).json({ message: '无权撤回此消息' })
    }

    message.isRecalled = true
    await message.save()

    res.json(message)
  } catch (error) {
    console.error('撤回私聊消息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router
