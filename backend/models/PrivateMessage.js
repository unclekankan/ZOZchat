const mongoose = require('mongoose')

const privateMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  },
  imageUrl: {
    type: String,
    default: null
  },
  isRecalled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

privateMessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 })

module.exports = mongoose.model('PrivateMessage', privateMessageSchema)
