const express = require('express')
const router = express.Router()
const Friendship = require('../models/Friendship')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

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

router.get('/list', auth, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [
        { requester: req.user.userId, status: 'accepted' },
        { recipient: req.user.userId, status: 'accepted' }
      ]
    })
      .populate('requester', 'username nickname avatar bio lastActive')
      .populate('recipient', 'username nickname avatar bio lastActive')

    const now = new Date()
    const onlineThreshold = 5 * 60 * 1000

    const friends = friendships.map(f => {
      const friend = f.requester._id.toString() === req.user.userId
        ? f.recipient
        : f.requester

      const lastActive = friend.lastActive ? new Date(friend.lastActive) : null
      const isOnline = lastActive && (now - lastActive) < onlineThreshold

      return {
        ...friend.toObject(),
        friendshipId: f._id,
        isOnline
      }
    })

    res.json(friends)
  } catch (error) {
    console.error('获取好友列表错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.user.userId,
      status: 'pending'
    })
      .populate('requester', 'username nickname avatar bio')

    res.json(requests)
  } catch (error) {
    console.error('获取好友请求错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/request', auth, async (req, res) => {
  try {
    const { userId } = req.body

    if (userId === req.user.userId) {
      return res.status(400).json({ message: '不能添加自己为好友' })
    }

    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: req.user.userId, recipient: userId },
        { requester: userId, recipient: req.user.userId }
      ]
    })

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ message: '已经是好友了' })
      }
      if (existingFriendship.status === 'pending') {
        return res.status(400).json({ message: '好友请求已发送' })
      }
    }

    const friendship = new Friendship({
      requester: req.user.userId,
      recipient: userId,
      status: 'pending'
    })

    await friendship.save()
    await friendship.populate('requester recipient', 'username nickname avatar')

    res.status(201).json(friendship)
  } catch (error) {
    console.error('发送好友请求错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/accept/:friendshipId', auth, async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId)

    if (!friendship) {
      return res.status(404).json({ message: '好友请求不存在' })
    }

    if (friendship.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ message: '无权操作' })
    }

    friendship.status = 'accepted'
    await friendship.save()
    await friendship.populate('requester recipient', 'username nickname avatar')

    res.json(friendship)
  } catch (error) {
    console.error('接受好友请求错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.post('/reject/:friendshipId', auth, async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId)

    if (!friendship) {
      return res.status(404).json({ message: '好友请求不存在' })
    }

    if (friendship.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ message: '无权操作' })
    }

    friendship.status = 'rejected'
    await friendship.save()

    res.json({ message: '已拒绝好友请求' })
  } catch (error) {
    console.error('拒绝好友请求错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.delete('/:friendId', auth, async (req, res) => {
  try {
    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: req.user.userId, recipient: req.params.friendId, status: 'accepted' },
        { requester: req.params.friendId, recipient: req.user.userId, status: 'accepted' }
      ]
    })

    if (!friendship) {
      return res.status(404).json({ message: '好友关系不存在' })
    }

    res.json({ message: '已删除好友' })
  } catch (error) {
    console.error('删除好友错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/my-code', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('friendCode')
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    res.json({ friendCode: user.friendCode })
  } catch (error) {
    console.error('获取好友码错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

router.get('/search', auth, async (req, res) => {
  try {
    const { friendCode } = req.query

    if (!friendCode || friendCode.length !== 6) {
      return res.status(400).json({ message: '请输入6位好友码' })
    }

    const user = await User.findOne({
      friendCode: friendCode.toUpperCase(),
      _id: { $ne: req.user.userId }
    })
      .select('username nickname avatar bio friendCode')

    if (!user) {
      return res.status(404).json({ message: '未找到该用户' })
    }

    res.json([user])
  } catch (error) {
    console.error('搜索用户错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router
