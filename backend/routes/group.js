const express = require('express')
const router = express.Router()
const Group = require('../models/Group')
const jwt = require('jsonwebtoken')

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

// 获取所有群组
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user.userId
    }).populate('members.user', 'username nickname avatar')

    res.json(groups)
  } catch (error) {
    console.error('获取群组列表错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 创建群组
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, avatar } = req.body

    const group = new Group({
      name,
      description,
      avatar,
      creator: req.user.userId,
      members: [{
        user: req.user.userId,
        role: 'admin'
      }]
    })

    await group.save()
    await group.populate('members.user', 'username nickname avatar')

    console.log('群组创建成功:', group.name, '邀请码:', group.inviteCode)
    res.status(201).json(group)
  } catch (error) {
    console.error('创建群组错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 通过邀请码查找群组
router.get('/invite/:code', auth, async (req, res) => {
  try {
    const { code } = req.params

    const group = await Group.findOne({ inviteCode: code.toUpperCase() })
      .populate('creator', 'username nickname avatar')
      .select('name description avatar inviteCode creator members')

    if (!group) {
      return res.status(404).json({ message: '邀请码无效或群组不存在' })
    }

    // 检查用户是否已在群组中
    const isMember = group.members.some(member =>
      member.user.toString() === req.user.userId
    )

    res.json({
      group: {
        _id: group._id,
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        inviteCode: group.inviteCode,
        creator: group.creator,
        memberCount: group.members.length
      },
      isMember
    })
  } catch (error) {
    console.error('查找群组错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 通过邀请码加入群组
router.post('/join-by-code', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body

    if (!inviteCode) {
      return res.status(400).json({ message: '请输入邀请码' })
    }

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() })

    if (!group) {
      return res.status(404).json({ message: '邀请码无效或群组不存在' })
    }

    // 检查用户是否已在群组中
    const isMember = group.members.some(member =>
      member.user.toString() === req.user.userId
    )

    if (isMember) {
      return res.status(400).json({ message: '你已经是该群组的成员' })
    }

    group.members.push({
      user: req.user.userId,
      role: 'member'
    })

    await group.save()
    await group.populate('members.user', 'username nickname avatar')

    console.log('用户加入群组:', group.name)
    res.json(group)
  } catch (error) {
    console.error('加入群组错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取群组详情
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'username nickname avatar bio')
      .populate('creator', 'username nickname avatar')

    if (!group) {
      return res.status(404).json({ message: '群组不存在' })
    }

    // 检查用户是否在群组中
    const isMember = group.members.some(member =>
      member.user._id.toString() === req.user.userId
    )

    if (!isMember) {
      return res.status(403).json({ message: '无权访问此群组' })
    }

    res.json(group)
  } catch (error) {
    console.error('获取群组详情错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 加入群组（通过ID）
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)

    if (!group) {
      return res.status(404).json({ message: '群组不存在' })
    }

    // 检查用户是否已在群组中
    const isMember = group.members.some(member =>
      member.user.toString() === req.user.userId
    )

    if (isMember) {
      return res.status(400).json({ message: '已经是群组成员' })
    }

    group.members.push({
      user: req.user.userId,
      role: 'member'
    })

    await group.save()
    await group.populate('members.user', 'username nickname avatar')

    res.json(group)
  } catch (error) {
    console.error('加入群组错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 退出群组
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)

    if (!group) {
      return res.status(404).json({ message: '群组不存在' })
    }

    group.members = group.members.filter(member =>
      member.user.toString() !== req.user.userId
    )

    await group.save()

    res.json({ message: '已退出群组' })
  } catch (error) {
    console.error('退出群组错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 重新生成邀请码（仅管理员）
router.post('/:id/regenerate-code', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)

    if (!group) {
      return res.status(404).json({ message: '群组不存在' })
    }

    // 检查用户是否是管理员
    const member = group.members.find(m =>
      m.user.toString() === req.user.userId
    )

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: '只有管理员可以重新生成邀请码' })
    }

    // 生成新的邀请码
    let newCode = group.generateInviteCode()
    let exists = true

    while (exists) {
      const existingGroup = await Group.findOne({ inviteCode: newCode })
      if (!existingGroup) {
        exists = false
      } else {
        newCode = group.generateInviteCode()
      }
    }

    group.inviteCode = newCode
    await group.save()

    res.json({ inviteCode: newCode })
  } catch (error) {
    console.error('重新生成邀请码错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 更新群组信息（仅管理员）
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, avatar } = req.body
    const group = await Group.findById(req.params.id)

    if (!group) {
      return res.status(404).json({ message: '群组不存在' })
    }

    // 检查用户是否是管理员
    const member = group.members.find(m =>
      m.user.toString() === req.user.userId
    )

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: '只有管理员可以更新群组信息' })
    }

    // 更新群组信息
    if (name) group.name = name
    if (description !== undefined) group.description = description
    if (avatar !== undefined) group.avatar = avatar

    await group.save()
    await group.populate('members.user', 'username nickname avatar')

    res.json(group)
  } catch (error) {
    console.error('更新群组信息错误:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router