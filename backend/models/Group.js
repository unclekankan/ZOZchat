const mongoose = require('mongoose')
const crypto = require('crypto')

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// 生成唯一邀请码的方法
groupSchema.methods.generateInviteCode = function() {
  // 生成6位随机字母数字组合
  const code = crypto.randomBytes(3).toString('hex').toUpperCase()
  return code
}

// 保存前自动生成邀请码
groupSchema.pre('save', async function(next) {
  if (this.isNew && !this.inviteCode) {
    let code = this.generateInviteCode()
    let exists = true
    
    // 确保邀请码唯一
    while (exists) {
      const existingGroup = await this.constructor.findOne({ inviteCode: code })
      if (!existingGroup) {
        exists = false
      } else {
        code = this.generateInviteCode()
      }
    }
    
    this.inviteCode = code
  }
  next()
})

module.exports = mongoose.model('Group', groupSchema)